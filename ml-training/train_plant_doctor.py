import os
import sys
import json
import time
import argparse
import numpy as np

# Set TensorFlow threading & Keras cache before importing TensorFlow
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "1"
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.environ["KERAS_HOME"] = os.path.join(WORKSPACE_ROOT, ".keras_cache")

import tensorflow as tf
tf.config.threading.set_inter_op_parallelism_threads(4)
tf.config.threading.set_intra_op_parallelism_threads(12)

from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

from data_loader import load_split_datasets

def build_model(num_classes=33):
    """
    Builds transfer learning model based on MobileNetV2.
    Inputs are raw RGB [0, 255] which are scaled by mobilenet_v2.preprocess_input to [-1, 1].
    """
    inputs = layers.Input(shape=(224, 224, 3), name="input_image")
    x = preprocess_input(inputs)
    
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False  # Frozen for Stage 1

    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D(name="avg_pool")(x)
    x = layers.BatchNormalization(name="bn_1")(x)
    x = layers.Dropout(0.3, name="drop_1")(x)
    x = layers.Dense(256, activation="relu", name="dense_256")(x)
    x = layers.BatchNormalization(name="bn_2")(x)
    x = layers.Dropout(0.2, name="drop_2")(x)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32", name="predictions")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="PlantDoctor_MobileNetV2")
    return model, base_model

def load_class_weights(weights_file="ml-training/class_weights.json"):
    if not os.path.exists(weights_file):
        weights_file = os.path.join(os.path.dirname(__file__), "class_weights.json")
    with open(weights_file, "r") as f:
        data = json.load(f)
    return {int(k): float(v) for k, v in data["class_weights_by_index"].items()}

def parse_args():
    parser = argparse.ArgumentParser(description="Train Plant Doctor Transfer Learning Model")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size for training and evaluation")
    parser.add_argument("--stage1-epochs", type=int, default=3, help="Stage 1 head warmup epochs")
    parser.add_argument("--stage2-epochs", type=int, default=3, help="Stage 2 fine-tuning epochs")
    parser.add_argument("--steps-per-epoch", type=int, default=400, help="Steps per training epoch")
    parser.add_argument("--val-steps", type=int, default=100, help="Steps for validation during training")
    return parser.parse_args()

def main():
    args = parse_args()

    print("=" * 70)
    print("PLANT DOCTOR - PHASE 3: MODEL TRAINING & EVALUATION")
    print(f"Batch Size: {args.batch_size} | Stage 1: {args.stage1_epochs} eps | Stage 2: {args.stage2_epochs} eps")
    print(f"Steps/Epoch: {args.steps_per_epoch} (~{args.steps_per_epoch * args.batch_size:,} images/epoch)")
    print("=" * 70)

    # 1. Load Data
    train_ds, val_ds, test_ds, class_names = load_split_datasets(batch_size=args.batch_size)
    num_classes = len(class_names)
    print(f"\n[Data] Classes: {num_classes}")
    
    # Verify class_names.json consistency
    class_names_path = os.path.join(os.path.dirname(__file__), "class_names.json")
    with open(class_names_path, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"[Data] Confirmed class names saved to {class_names_path}")

    # Load class weights
    class_weights = load_class_weights()
    print(f"[Data] Loaded {len(class_weights)} balanced class weights.")

    # 2. Build Model
    model, base_model = build_model(num_classes=num_classes)
    model.summary(line_length=80)

    model_save_path = os.path.join(os.path.dirname(__file__), "plant_disease_model.keras")
    tflite_save_path = os.path.join(os.path.dirname(__file__), "plant_disease_model.tflite")

    # Callbacks
    checkpoint_cb = keras.callbacks.ModelCheckpoint(
        model_save_path,
        monitor="val_accuracy",
        mode="max",
        save_best_only=True,
        verbose=1
    )
    early_stopping_cb = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True,
        verbose=1
    )
    reduce_lr_cb = keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2,
        min_lr=1e-6,
        verbose=1
    )

    # -------------------------------------------------------------------------
    # STAGE 1: Freeze base model, train the classification head
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("STAGE 1: Training Classification Head (Base MobileNetV2 Frozen)")
    print("=" * 70)
    base_model.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    t0 = time.time()
    history_stage1 = model.fit(
        train_ds.repeat(),
        steps_per_epoch=args.steps_per_epoch,
        validation_data=val_ds,
        validation_steps=args.val_steps,
        epochs=args.stage1_epochs,
        class_weight=class_weights,
        callbacks=[checkpoint_cb, reduce_lr_cb],
        verbose=1
    )
    print(f"Stage 1 completed in {(time.time() - t0):.1f}s")

    # -------------------------------------------------------------------------
    # STAGE 2: Unfreeze top layers and fine-tune
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("STAGE 2: Fine-Tuning Top 30 Layers of MobileNetV2")
    print("=" * 70)
    base_model.trainable = True
    # Freeze all layers except the last 30
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    trainable_count = sum(np.prod(p.shape) for p in model.trainable_weights)
    print(f"Trainable parameters in Stage 2: {trainable_count:,}")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    total_epochs = args.stage1_epochs + args.stage2_epochs
    history_stage2 = model.fit(
        train_ds.repeat(),
        steps_per_epoch=args.steps_per_epoch,
        validation_data=val_ds,
        validation_steps=args.val_steps,
        initial_epoch=args.stage1_epochs,
        epochs=total_epochs,
        class_weight=class_weights,
        callbacks=[checkpoint_cb, early_stopping_cb, reduce_lr_cb],
        verbose=1
    )
    print(f"Stage 2 completed.")

    # Always ensure model is saved even if val_accuracy did not improve on last step
    if not os.path.exists(model_save_path):
        print(f"Saving final model to {model_save_path}...")
        model.save(model_save_path)
    else:
        print(f"\nLoading best checkpoint from {model_save_path} for final evaluation...")
        model = keras.models.load_model(model_save_path)

    # -------------------------------------------------------------------------
    # EVALUATION ON UNTOUCHED TEST SET
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("PHASE 3: EVALUATING ON UNTOUCHED TEST SET (All 11,134 images)")
    print("=" * 70)

    y_true_list = []
    y_pred_list = []

    test_start = time.time()
    for batch_idx, (images, labels) in enumerate(test_ds):
        preds = model.predict_on_batch(images)
        y_true_list.append(np.argmax(labels.numpy(), axis=1))
        y_pred_list.append(np.argmax(preds.numpy() if hasattr(preds, 'numpy') else preds, axis=1))
        if (batch_idx + 1) % 35 == 0:
            print(f"  Processed {batch_idx + 1} / 174 test batches...")

    y_true = np.concatenate(y_true_list)
    y_pred = np.concatenate(y_pred_list)
    test_duration = time.time() - test_start

    from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

    test_acc = accuracy_score(y_true, y_pred)
    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        output_dict=True,
        digits=4
    )
    report_text = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        digits=4
    )

    print("\n" + "=" * 70)
    print(f"TEST ACCURACY: {test_acc * 100:.2f}% (evaluated {len(y_true)} images in {test_duration:.1f}s)")
    print("=" * 70)
    print(report_text)

    # Identify weak classes (F1 < 0.85)
    weak_classes = []
    for c_name in class_names:
        f1 = report_dict[c_name]["f1-score"]
        if f1 < 0.85:
            weak_classes.append({
                "class": c_name,
                "f1_score": round(float(f1), 4),
                "precision": round(float(report_dict[c_name]["precision"]), 4),
                "recall": round(float(report_dict[c_name]["recall"]), 4),
                "support": int(report_dict[c_name]["support"])
            })

    # Save detailed evaluation report
    eval_summary = {
        "test_accuracy": round(float(test_acc), 4),
        "macro_f1": round(float(report_dict["macro avg"]["f1-score"]), 4),
        "weighted_f1": round(float(report_dict["weighted avg"]["f1-score"]), 4),
        "total_test_samples": len(y_true),
        "num_classes": num_classes,
        "weak_classes": weak_classes,
        "classification_report": report_dict
    }

    eval_report_path = os.path.join(os.path.dirname(__file__), "test_evaluation_report.json")
    with open(eval_report_path, "w") as f:
        json.dump(eval_summary, f, indent=2)
    print(f"\n[Report] Saved test metrics to {eval_report_path}")

    # -------------------------------------------------------------------------
    # EXPORT: TFLite Model
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("EXPORTING TFLITE MODEL")
    print("=" * 70)
    try:
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = converter.convert()
        with open(tflite_save_path, "wb") as f:
            f.write(tflite_model)
        
        tflite_size_mb = os.path.getsize(tflite_save_path) / (1024 * 1024)
        keras_size_mb = os.path.getsize(model_save_path) / (1024 * 1024)
        print(f"Keras Model:  {model_save_path} ({keras_size_mb:.2f} MB)")
        print(f"TFLite Model: {tflite_save_path} ({tflite_size_mb:.2f} MB)")
    except Exception as e:
        print(f"[Warning] TFLite conversion error: {e}")

    print("\n" + "=" * 70)
    print("PHASE 3 COMPLETE: Model trained, evaluated, and exported successfully!")
    print("=" * 70)

if __name__ == "__main__":
    main()
