import os
import json
# pyrefly: ignore[untyped-import]
import tensorflow as tf
# pyrefly: ignore[untyped-import]
from tensorflow import keras
# pyrefly: ignore[missing-import]
from tensorflow.keras import layers

MERGED_DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "merged")
BATCH_SIZE = 32
IMAGE_SIZE = (224, 224)

def get_train_augmentation():
    """
    Data augmentation pipeline applied STRICTLY to the train split only.
    Simulates real-world mobile camera field conditions (angles, sun exposure, camera noise).
    """
    return keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.12),
        layers.RandomZoom(0.12),
        layers.RandomContrast(0.12),
        layers.RandomBrightness(0.12),
        layers.GaussianNoise(0.02),
    ], name="field_robust_augmentation")

def load_split_datasets(base_dir=MERGED_DATA_DIR, batch_size=BATCH_SIZE, image_size=IMAGE_SIZE):
    train_dir = os.path.join(base_dir, "train")
    val_dir = os.path.join(base_dir, "val")
    test_dir = os.path.join(base_dir, "test")

    print(f"Loading datasets from {base_dir} (batch_size={batch_size}, image_size={image_size})...")

    # Load raw tf.data datasets
    train_ds = keras.utils.image_dataset_from_directory(
        train_dir,
        label_mode="categorical",
        image_size=image_size,
        batch_size=batch_size,
        shuffle=True,
        seed=42
    )

    val_ds = keras.utils.image_dataset_from_directory(
        val_dir,
        label_mode="categorical",
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False
    )

    test_ds = keras.utils.image_dataset_from_directory(
        test_dir,
        label_mode="categorical",
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False
    )

    class_names = train_ds.class_names

    # Apply data augmentation ONLY to train set
    augmentation = get_train_augmentation()
    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    )

    # Prefetch and cache for optimal GPU / CPU throughput
    train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(buffer_size=tf.data.AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names

if __name__ == "__main__":
    train_ds, val_ds, test_ds, class_names = load_split_datasets()
    print(f"\nSuccessfully loaded:")
    print(f"  Classes ({len(class_names)}): {class_names[:5]}...")
    for images, labels in train_ds.take(1):
        print(f"  Train Batch Images shape: {images.shape}, Labels shape: {labels.shape}")
        break

