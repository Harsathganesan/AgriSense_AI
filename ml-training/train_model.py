"""
AgriSense AI - Deep Learning Plant Disease Model Training Pipeline
Phase 2: MobileNetV2 / EfficientNet Transfer Learning

Features:
- Pretrained ImageNet Transfer Learning (MobileNetV2 / EfficientNetB0)
- Two-phase training: frozen feature extraction -> optional fine-tuning of top backbone layers
- Stratified holdout evaluation on independent test set
- Robust Data Augmentation (Rotation, Zoom, Flip, Contrast)
- Class imbalance handling via per-sample weights (computed from sklearn balanced class weights)
- Callbacks: ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
- Evaluation Graphs: Accuracy/Loss curves, Confusion Matrix, Classification Report
- Quantized TFLite (augmentation-free inference graph) and Keras export

IMPORTANT (serving contract):
  Preprocessing is EMBEDDED in the saved model. The model expects RAW pixel values in [0, 255]
  (float32, 224x224x3). So in the backend disease detector, set:
      AGRISENSE_MODEL_NORMALIZE=0
  otherwise images get normalized twice and predictions will be wrong.
"""

import os
import sys
import glob

# Automatically inject ml-training/venv and backend/venv site-packages if run with system python or IDE
_script_dir = os.path.dirname(os.path.abspath(__file__))
_proj_root = os.path.dirname(_script_dir) if os.path.basename(_script_dir) == "ml-training" else _script_dir
for _venv_rel in [os.path.join("ml-training", "venv"), os.path.join("backend", "venv")]:
    _candidates = [os.path.join(_proj_root, _venv_rel, "Lib", "site-packages")]  # Windows
    _candidates += glob.glob(os.path.join(_proj_root, _venv_rel, "lib", "python*", "site-packages"))  # Linux/macOS
    for _sp in _candidates:
        if os.path.exists(_sp) and _sp not in sys.path:
            sys.path.insert(0, _sp)

import json
import shutil
import argparse
import tempfile
from pathlib import Path

# Set writable Matplotlib and Keras cache directory
_local_cache = os.path.abspath(os.path.join(_proj_root, ".keras_cache"))
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))
os.environ["KERAS_HOME"] = _local_cache if os.path.exists(_local_cache) else os.path.join(tempfile.gettempdir(), ".keras")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import pandas as pd  # type: ignore
import numpy as np  # type: ignore

try:
    import matplotlib
    matplotlib.use("Agg")  # headless-safe backend (no display needed)
    import matplotlib.pyplot as plt  # type: ignore
    import seaborn as sns  # type: ignore
except ImportError:
    plt = None  # type: ignore
    sns = None  # type: ignore

from sklearn.utils.class_weight import compute_class_weight  # type: ignore
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score  # type: ignore

# Check tensorflow (use ONE keras namespace everywhere to avoid keras/tf.keras mismatches)
try:
    import tensorflow as tf  # type: ignore
    from tensorflow.keras import layers, models, callbacks, optimizers  # type: ignore
    from tensorflow.keras.applications import MobileNetV2, EfficientNetB0  # type: ignore
except ImportError:
    print("[!] TensorFlow is not installed in the current environment.")
    print("    Install it via: pip install tensorflow")
    sys.exit(1)

IMG_SIZE = (224, 224)
SEED = 42


def parse_args():
    parser = argparse.ArgumentParser(description="Train AgriSense AI Plant Disease Detection Model")
    parser.add_argument("--epochs", type=int, default=15, help="Epochs for phase 1 / feature extraction (default: 15)")
    parser.add_argument("--finetune-epochs", type=int, default=5, help="Epochs for phase 2 fine-tuning; 0 disables (default: 5)")
    parser.add_argument("--finetune-layers", type=int, default=30, help="Number of top backbone layers to unfreeze (default: 30)")
    parser.add_argument("--finetune-lr", type=float, default=1e-5, help="Learning rate for fine-tuning (default: 1e-5)")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size (default: 32)")
    parser.add_argument("--lr", type=float, default=0.0005, help="Initial learning rate (default: 0.0005)")
    parser.add_argument("--model-type", type=str, choices=["mobilenet", "efficientnet"], default="mobilenet", help="Model backbone")
    parser.add_argument("--dataset-root", type=str, default="ml-training/dataset", help="Dataset root directory")
    parser.add_argument("--splits-dir", type=str, default="ml-training/splits", help="Splits CSV directory")
    parser.add_argument("--output-dir", type=str, default="ml-training", help="Output directory for model & artifacts")
    parser.add_argument("--subset", type=float, default=1.0, help="Fraction of data to use (for quick dry runs, 0.0-1.0)")
    parser.add_argument("--verify-images", action="store_true", help="Scan every image with PIL and drop corrupt files (slow but safe)")
    args = parser.parse_args()
    if not (0.0 < args.subset <= 1.0):
        parser.error("--subset must be in (0.0, 1.0]")
    return args


# ----------------------------------------------------------------------
# Data loading
# ----------------------------------------------------------------------
def load_split_dataframe(csv_path, dataset_root, class_names, subset=1.0, verify_images=False):
    df = pd.read_csv(csv_path)

    required = {"image_path", "class_id"}
    if not required.issubset(df.columns):
        print(f"[!] Error: {csv_path} must contain columns {sorted(required)}. Found: {list(df.columns)}")
        sys.exit(1)

    if subset < 1.0:
        df = df.sample(frac=subset, random_state=SEED).reset_index(drop=True)

    # Labels must be valid indices for the model's output layer
    num_classes = len(class_names)
    bad_ids = df[(df["class_id"] < 0) | (df["class_id"] >= num_classes)]
    if len(bad_ids) > 0:
        print(f"[!] Error: {len(bad_ids)} rows in {csv_path} have class_id outside 0..{num_classes - 1}.")
        print("    class_names.json and the split CSVs are out of sync. Re-run analyze_dataset.py.")
        sys.exit(1)

    # If CSV has class names, make sure the id -> name mapping matches class_names.json
    if "class_name" in df.columns:
        expected = df["class_id"].map(lambda i: class_names[int(i)])
        mismatch = (expected != df["class_name"]).sum()
        if mismatch > 0:
            print(f"[!] Error: {mismatch} rows in {csv_path} have class_id/class_name that disagree with class_names.json.")
            print("    The label order is inconsistent - the trained model would predict wrong diseases.")
            sys.exit(1)

    # Resolve absolute or relative path to image file (also handle Windows-style backslashes)
    def resolve_path(p):
        p = str(p).replace("\\", "/")
        full = os.path.join(dataset_root, p)
        if os.path.exists(full):
            return full
        if os.path.exists(p):  # path already includes dataset prefix
            return p
        return full

    df["resolved_path"] = df["image_path"].apply(resolve_path)
    valid_mask = df["resolved_path"].apply(os.path.exists)
    if not valid_mask.all():
        # pyrefly: ignore[unnecessary-type-conversion]
        missing_count = int((~valid_mask).sum())
        print(f"[!] Warning: {missing_count} images in {csv_path} were not found on disk. Filtering...")
        df = df[valid_mask].reset_index(drop=True)

    if verify_images:
        df = filter_corrupt_images(df, Path(csv_path).name)

    if len(df) == 0:
        print(f"[!] Error: no usable images left for {csv_path}. Check --dataset-root ('{dataset_root}').")
        sys.exit(1)

    return df


def filter_corrupt_images(df, name):
    from PIL import Image  # type: ignore
    keep = []
    total = len(df)
    for i, p in enumerate(df["resolved_path"].values):
        try:
            with Image.open(p) as im:
                im.verify()
            keep.append(True)
        except Exception:
            keep.append(False)
        if (i + 1) % 5000 == 0:
            print(f"    verified {i + 1:,}/{total:,} images in {name}")
    keep = np.array(keep)
    dropped = int((~keep).sum())
    if dropped:
        print(f"[!] Dropped {dropped} corrupt image(s) from {name}.")
    return df[keep].reset_index(drop=True)


def build_dataset_pipeline(df, batch_size=32, is_training=True, img_size=IMG_SIZE,
                           num_classes=15, class_weights=None, skip_corrupt=True):
    """
    Yields RAW float32 pixels in [0, 255]. Model-specific preprocessing lives INSIDE the model,
    so the same graph works for MobileNetV2 and EfficientNet and matches serving exactly.
    """
    paths = df["resolved_path"].astype(str).values
    labels = df["class_id"].astype("int32").values

    weight_table = None
    if is_training and class_weights is not None:
        weight_table = tf.constant([class_weights[i] for i in range(num_classes)], dtype=tf.float32)

    def load_and_preprocess(path, label):
        raw_img = tf.io.read_file(path)
        img = tf.io.decode_image(raw_img, channels=3, expand_animations=False)
        img.set_shape([None, None, 3])
        # antialias=True matches PIL's downscale behaviour used by the backend (less train/serve skew)
        img = tf.image.resize(img, img_size, method="bilinear", antialias=True)
        img = tf.cast(img, tf.float32)
        one_hot = tf.one_hot(label, depth=num_classes)
        if weight_table is not None:
            return img, one_hot, tf.gather(weight_table, label)
        return img, one_hot

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if is_training:
        ds = ds.shuffle(buffer_size=min(len(df), 2000), seed=SEED, reshuffle_each_iteration=True)

    ds = ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    if skip_corrupt:
        ds = ds.apply(tf.data.experimental.ignore_errors())
    ds = ds.batch(batch_size)
    ds = ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    return ds


# ----------------------------------------------------------------------
# Model
# ----------------------------------------------------------------------
def build_model(model_type="mobilenet", input_shape=(224, 224, 3), num_classes=15):
    inputs = layers.Input(shape=input_shape, name="input_image")  # RAW pixels 0..255

    # Data Augmentation Layer (active only during training)
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.1),
        layers.RandomContrast(0.1),
    ], name="data_augmentation")

    x = data_augmentation(inputs)

    if model_type == "mobilenet":
        # MobileNetV2 expects [-1, 1]: embed the scaling in the model
        x = layers.Rescaling(1.0 / 127.5, offset=-1.0, name="mobilenet_preprocess")(x)
        base_model = MobileNetV2(input_shape=input_shape, include_top=False, weights="imagenet")
    else:
        # Keras EfficientNetB0 already contains its own rescaling/normalization -> expects raw 0..255
        base_model = EfficientNetB0(input_shape=input_shape, include_top=False, weights="imagenet")

    # Freeze base model initially for feature extraction
    base_model.trainable = False

    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu", name="dense_features")(x)
    x = layers.Dropout(0.4, name="dropout_regularization")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="classification_output")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name=f"AgriSense_{model_type.title()}")
    return model, base_model


def compile_model(model, lr):
    model.compile(
        optimizer=optimizers.Adam(learning_rate=lr),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.Precision(name="precision"), tf.keras.metrics.Recall(name="recall")],
    )


def unfreeze_top_layers(base_model, n_layers):
    """Unfreeze the last n backbone layers; BatchNorm layers stay frozen for stable fine-tuning."""
    base_model.trainable = True
    for layer in base_model.layers[:-n_layers]:
        layer.trainable = False
    for layer in base_model.layers:
        if isinstance(layer, layers.BatchNormalization):
            layer.trainable = False
    trainable = sum(1 for l in base_model.layers if l.trainable)
    print(f"[*] Fine-tuning: {trainable} backbone layers unfrozen (BatchNorm kept frozen).")


def make_callbacks(keras_model_path, initial_best=None):
    ckpt_kwargs = dict(
        filepath=str(keras_model_path),
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
        verbose=1,
    )
    if initial_best is not None:
        # Don't let fine-tuning overwrite a better phase-1 checkpoint with a worse model
        # pyrefly: ignore[bad-assignment]
        ckpt_kwargs["initial_value_threshold"] = float(initial_best)
    try:
        checkpoint = callbacks.ModelCheckpoint(**ckpt_kwargs)
    except TypeError:
        ckpt_kwargs.pop("initial_value_threshold", None)
        checkpoint = callbacks.ModelCheckpoint(**ckpt_kwargs)

    return [
        checkpoint,
        # Same metric as the checkpoint so "best" means the same thing everywhere
        callbacks.EarlyStopping(monitor="val_accuracy", mode="max", patience=4, restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7, verbose=1),
    ]


def merge_histories(*histories):
    merged = {}
    for h in histories:
        if h is None:
            continue
        for k, v in h.history.items():
            merged.setdefault(k, []).extend(v)
    return merged


def build_inference_model(trained_model, input_shape=(224, 224, 3)):
    """
    Rebuild a clean inference graph WITHOUT augmentation layers
    (random layers can break/bloat TFLite conversion). Weights are shared.
    """
    inputs = layers.Input(shape=input_shape, name="input_image")
    x = inputs
    for layer in trained_model.layers:
        if isinstance(layer, layers.InputLayer) or layer.name == "data_augmentation":
            continue
        x = layer(x)
    return models.Model(inputs=inputs, outputs=x, name=trained_model.name + "_inference")


# ----------------------------------------------------------------------
# Plots / evaluation
# ----------------------------------------------------------------------
def plot_history(history_dict, output_path):
    if plt is None:
        print("[!] matplotlib not installed - skipping training curves (pip install matplotlib seaborn).")
        return
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    epochs = range(1, len(history_dict["loss"]) + 1)

    ax1.plot(epochs, history_dict["accuracy"], "g-o", label="Training Accuracy", linewidth=2)
    ax1.plot(epochs, history_dict["val_accuracy"], "b-s", label="Validation Accuracy", linewidth=2)
    ax1.set_title("AgriSense AI - Training & Validation Accuracy", fontsize=13, fontweight="bold")
    ax1.set_xlabel("Epoch", fontsize=11)
    ax1.set_ylabel("Accuracy", fontsize=11)
    ax1.grid(True, linestyle="--", alpha=0.6)
    ax1.legend(loc="lower right")

    ax2.plot(epochs, history_dict["loss"], "r-o", label="Training Loss", linewidth=2)
    ax2.plot(epochs, history_dict["val_loss"], "m-s", label="Validation Loss", linewidth=2)
    ax2.set_title("AgriSense AI - Training & Validation Loss", fontsize=13, fontweight="bold")
    ax2.set_xlabel("Epoch", fontsize=11)
    ax2.set_ylabel("Cross-Entropy Loss", fontsize=11)
    ax2.grid(True, linestyle="--", alpha=0.6)
    ax2.legend(loc="upper right")

    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"[+] Saved training history curves to '{output_path}'.")


def evaluate_and_plot_confusion_matrix(model, test_ds, test_df, class_names, output_cm_path, output_report_path):
    print("\n[*] Evaluating on Independent Holdout Test Set...")

    y_true = test_df["class_id"].values
    y_pred_probs = model.predict(test_ds, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)

    if len(y_pred) != len(y_true):
        print(f"[!] Error: predicted {len(y_pred)} samples but test set has {len(y_true)}. "
              f"Some test images failed to decode - re-run with --verify-images.")
        sys.exit(1)

    num_classes = len(class_names)
    labels_all = list(range(num_classes))
    cm = confusion_matrix(y_true, y_pred, labels=labels_all)  # fixed-size matrix, safe for missing classes

    test_acc = accuracy_score(y_true, y_pred)
    test_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    print("\n" + "=" * 60)
    print("INDEPENDENT HOLDOUT TEST SET EVALUATION")
    print("=" * 60)
    print(f"Test Accuracy: {round(test_acc * 100, 2)}%")
    print(f"Weighted F1-Score: {round(test_f1 * 100, 2)}%")
    print("=" * 60)

    cls_report = classification_report(
        y_true, y_pred, labels=labels_all, target_names=class_names, output_dict=True, zero_division=0
    )
    cls_report_str = classification_report(
        y_true, y_pred, labels=labels_all, target_names=class_names, zero_division=0
    )
    print("\nDetailed Per-Class Performance:")
    print(cls_report_str)

    eval_summary = {
        "test_accuracy": float(test_acc),
        "test_weighted_f1": float(test_f1),
        # pyrefly: ignore[unnecessary-type-conversion]
        "total_test_samples": int(len(y_true)),
        "classification_report": cls_report,
    }
    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(eval_summary, f, indent=2)
    print(f"[+] Saved test evaluation metrics to '{output_report_path}'.")

    if plt is None or sns is None:
        print("[!] matplotlib/seaborn not installed - skipping confusion matrix plot.")
        return test_acc, test_f1

    plt.figure(figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Greens", xticklabels=class_names, yticklabels=class_names)
    plt.title("AgriSense AI - Confusion Matrix (Independent Test Set)", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Predicted Disease Class", fontsize=11, fontweight="bold")
    plt.ylabel("Ground Truth Class", fontsize=11, fontweight="bold")
    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    plt.savefig(output_cm_path, dpi=300)
    plt.close()
    print(f"[+] Saved confusion matrix heatmap to '{output_cm_path}'.")

    return test_acc, test_f1


# ----------------------------------------------------------------------
# Export
# ----------------------------------------------------------------------
def convert_to_tflite(trained_model, output_tflite_path):
    print("\n[*] Exporting Quantized TFLite Model for High-Speed Inference...")
    inference_model = build_inference_model(trained_model)
    # pyrefly: ignore[implicit-import, missing-attribute]
    converter = tf.lite.TFLiteConverter.from_keras_model(inference_model)
    # pyrefly: ignore[implicit-import, missing-attribute]
    converter.optimizations = [tf.lite.Optimize.DEFAULT]  # dynamic-range quantization (float32 I/O)
    tflite_model = converter.convert()

    with open(output_tflite_path, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(output_tflite_path) / (1024 * 1024)
    print(f"[+] Saved TFLite model to '{output_tflite_path}' ({round(size_mb, 2)} MB).")


def verify_tflite(keras_model, tflite_path, test_ds, max_images=16):
    """Sanity check: TFLite and Keras must agree on the same images."""
    try:
        # pyrefly: ignore[implicit-import, missing-attribute]
        interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
        interpreter.allocate_tensors()
        in_d = interpreter.get_input_details()[0]
        out_d = interpreter.get_output_details()[0]

        imgs = None
        for batch_imgs, _ in test_ds.take(1):
            imgs = batch_imgs.numpy()[:max_images]
        if imgs is None:
            return

        keras_pred = np.argmax(keras_model.predict(imgs, verbose=0), axis=1)
        tfl_pred = []
        for img in imgs:
            interpreter.set_tensor(in_d["index"], np.expand_dims(img, 0).astype(in_d["dtype"]))
            interpreter.invoke()
            tfl_pred.append(int(np.argmax(interpreter.get_tensor(out_d["index"])[0])))

        agree = float(np.mean(keras_pred == np.array(tfl_pred))) * 100
        status = "OK" if agree >= 90 else "WARNING - check conversion"
        print(f"[*] TFLite vs Keras prediction agreement on {len(imgs)} test images: {agree:.1f}% ({status})")
    except Exception as e:
        print(f"[!] TFLite verification skipped: {e}")


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
def main():
    args = parse_args()
    tf.keras.utils.set_random_seed(SEED)

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent

    # 1. Resolve splits directory
    splits_dir = Path(args.splits_dir)
    if not (splits_dir / "train_split.csv").exists():
        if (script_dir / "splits" / "train_split.csv").exists():
            splits_dir = script_dir / "splits"
        elif (project_root / "ml-training" / "splits" / "train_split.csv").exists():
            splits_dir = project_root / "ml-training" / "splits"

    train_csv = splits_dir / "train_split.csv"
    val_csv = splits_dir / "val_split.csv"
    test_csv = splits_dir / "test_split.csv"

    if not (train_csv.exists() and val_csv.exists() and test_csv.exists()):
        print(f"[!] Error: Split manifests not found in {splits_dir}. Run analyze_dataset.py first!")
        sys.exit(1)

    # 2. Resolve class_names.json
    class_names_path = None
    for cp in [Path("ml-training/class_names.json"), script_dir / "class_names.json", project_root / "ml-training" / "class_names.json"]:
        if cp.exists():
            class_names_path = cp
            break

    if not class_names_path:
        print("[!] Error: class_names.json not found.")
        sys.exit(1)

    with open(class_names_path, "r", encoding="utf-8") as f:
        class_names = json.load(f)
    if isinstance(class_names, dict):  # support {"0": "name", ...}
        class_names = [class_names[k] for k in sorted(class_names.keys(), key=lambda x: int(x))]

    num_classes = len(class_names)
    print(f"[*] Loaded {num_classes} classes from {class_names_path}")

    # 3. Resolve dataset root directory
    dataset_root = Path(args.dataset_root)
    if not dataset_root.exists():
        if (script_dir / "dataset").exists():
            dataset_root = script_dir / "dataset"
        elif (project_root / "ml-training" / "dataset").exists():
            dataset_root = project_root / "ml-training" / "dataset"
        else:
            print(f"[!] Error: dataset root '{args.dataset_root}' not found. Pass --dataset-root explicitly.")
            sys.exit(1)

    print(f"[*] Loading datasets from root '{dataset_root}'...")
    train_df = load_split_dataframe(train_csv, str(dataset_root), class_names, args.subset, args.verify_images)
    val_df = load_split_dataframe(val_csv, str(dataset_root), class_names, args.subset, args.verify_images)
    test_df = load_split_dataframe(test_csv, str(dataset_root), class_names, args.subset, args.verify_images)

    print(f"    Train samples: {len(train_df):,}")
    print(f"    Val samples:   {len(val_df):,}")
    print(f"    Test samples:  {len(test_df):,}")

    # Class weights (applied as per-sample weights inside the tf.data pipeline - works on every Keras version)
    y_train = train_df["class_id"].values
    # pyrefly: ignore[no-matching-overload]
    unique_classes_in_train = np.unique(y_train)
    computed_weights = compute_class_weight("balanced", classes=unique_classes_in_train, y=y_train)
    class_weights_dict = {int(c): float(w) for c, w in zip(unique_classes_in_train, computed_weights)}
    for c in range(num_classes):
        class_weights_dict.setdefault(c, 1.0)
    print(f"[*] Class weights computed (Min: {round(min(class_weights_dict.values()), 2)}, Max: {round(max(class_weights_dict.values()), 2)})")

    # tf.data pipelines
    train_ds = build_dataset_pipeline(train_df, args.batch_size, True, IMG_SIZE, num_classes, class_weights_dict, skip_corrupt=True)
    val_ds = build_dataset_pipeline(val_df, args.batch_size, False, IMG_SIZE, num_classes, skip_corrupt=True)
    # Test set: NO error skipping, so predictions always line up 1:1 with test_df labels
    test_ds = build_dataset_pipeline(test_df, args.batch_size, False, IMG_SIZE, num_classes, skip_corrupt=False)

    # Build Model
    model, base_model = build_model(model_type=args.model_type, num_classes=num_classes)
    compile_model(model, args.lr)
    model.summary()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    keras_model_path = out_dir / "plant_disease_model.keras"
    history_plot_path = out_dir / "training_history.png"
    cm_plot_path = out_dir / "confusion_matrix.png"
    eval_report_path = out_dir / "evaluation_report.json"
    tflite_model_path = out_dir / "plant_disease_model.tflite"

    # ---------------- Phase 1: feature extraction ----------------
    print("\n" + "=" * 60)
    print(f"PHASE 1: FEATURE EXTRACTION ({args.epochs} EPOCHS, BATCH SIZE {args.batch_size})")
    print("=" * 60)

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=make_callbacks(keras_model_path),
        verbose=1,
    )
    best_val_acc = max(history1.history["val_accuracy"])

    # ---------------- Phase 2: fine-tuning ----------------
    history2 = None
    if args.finetune_epochs > 0:
        print("\n" + "=" * 60)
        print(f"PHASE 2: FINE-TUNING ({args.finetune_epochs} EPOCHS, LR {args.finetune_lr})")
        print("=" * 60)
        unfreeze_top_layers(base_model, args.finetune_layers)
        compile_model(model, args.finetune_lr)  # must re-compile after changing trainable flags
        history2 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=args.finetune_epochs,
            callbacks=make_callbacks(keras_model_path, initial_best=best_val_acc),
            verbose=1,
        )

    # Always evaluate/export the BEST checkpoint (not whatever the last epoch happened to be)
    if keras_model_path.exists():
        print(f"\n[*] Reloading best checkpoint from '{keras_model_path}'...")
        model = tf.keras.models.load_model(str(keras_model_path))
    else:
        model.save(str(keras_model_path))
    print(f"[+] Best model at '{keras_model_path.resolve()}'.")

    plot_history(merge_histories(history1, history2), history_plot_path)

    evaluate_and_plot_confusion_matrix(model, test_ds, test_df, class_names, cm_plot_path, eval_report_path)

    # Export TFLite
    try:
        convert_to_tflite(model, tflite_model_path)
        verify_tflite(model, tflite_model_path, test_ds)
    except Exception as e:
        print(f"[!] TFLite conversion notice: {e}")

    # Sync trained model artifacts to backend/app/models for immediate API serving
    backend_models_dir = project_root / "backend" / "app" / "models"
    if backend_models_dir.exists():
        for src, dst_name in [
            (keras_model_path, "plant_disease_model.keras"),
            (tflite_model_path, "plant_disease_model.tflite"),
            (class_names_path, "class_names.json"),
        ]:
            if src.exists():
                shutil.copy2(src, backend_models_dir / dst_name)
        print(f"[+] Synchronized trained model artifacts to '{backend_models_dir}'.")

    print("\n[SUCCESS] AI Model Training & Evaluation Complete.")
    print("[!] REMINDER: preprocessing is embedded in this model. Set AGRISENSE_MODEL_NORMALIZE=0 for the backend.")


if __name__ == "__main__":
    main()