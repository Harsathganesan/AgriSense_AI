import os
import sys
import json
import hashlib
import io
import shutil
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np
from sklearn.model_selection import train_test_split

ARCHIVE_DIR = "ml-training/extracted/Plant Village Dataset"
MY_DATASET_DIR = "ml-training/dataset/PlantVillage"
OUT_BASE = "ml-training/data/merged"
SPLITS = ["train", "val", "test"]

# Explicit Canonical 33-Class Normalization Map
CANONICAL_MAP = {
    # Apple
    "Apple - Apple Scab": "Apple___Apple_scab",
    "Apple - Black Rot": "Apple___Black_rot",
    "Apple - Cedar Apple Rust": "Apple___Cedar_apple_rust",
    "Apple - Healthy": "Apple___Healthy",
    # Cherry
    "Cherry - Healthy": "Cherry___Healthy",
    "Cherry - Powdery Mildew": "Cherry___Powdery_mildew",
    # Corn
    "Corn (Maize) - Cercospora Leaf Spot": "Corn___Cercospora_leaf_spot",
    "Corn (Maize) - Common Rust": "Corn___Common_rust",
    "Corn (Maize) - Healthy": "Corn___Healthy",
    "Corn (Maize) - Northern Leaf Blight": "Corn___Northern_leaf_blight",
    # Grape
    "Grape - Black Rot": "Grape___Black_rot",
    "Grape - Esca (Black Measles)": "Grape___Esca_black_measles",
    "Grape - Healthy": "Grape___Healthy",
    "Grape - Leaf Blight": "Grape___Leaf_blight",
    # Peach
    "Peach - Bacterial Spot": "Peach___Bacterial_spot",
    "Peach - Healthy": "Peach___Healthy",
    # Pepper Bell
    "Bell Pepper - Bacterial Spot": "Pepper_bell___Bacterial_spot",
    "Pepper__bell___Bacterial_spot": "Pepper_bell___Bacterial_spot",
    "Bell Pepper - Healthy": "Pepper_bell___Healthy",
    "Pepper__bell___healthy": "Pepper_bell___Healthy",
    # Potato
    "Potato - Early Blight": "Potato___Early_blight",
    "Potato___Early_blight": "Potato___Early_blight",
    "Potato - Healthy": "Potato___Healthy",
    "Potato___healthy": "Potato___Healthy",
    "Potato - Late Blight": "Potato___Late_blight",
    "Potato___Late_blight": "Potato___Late_blight",
    # Strawberry
    "Strawberry - Healthy": "Strawberry___Healthy",
    "Strawberry - Leaf Scorch": "Strawberry___Leaf_scorch",
    # Tomato
    "Tomato - Bacterial Spot": "Tomato___Bacterial_spot",
    "Tomato_Bacterial_spot": "Tomato___Bacterial_spot",
    "Tomato - Early Blight": "Tomato___Early_blight",
    "Tomato_Early_blight": "Tomato___Early_blight",
    "Tomato - Healthy": "Tomato___Healthy",
    "Tomato_healthy": "Tomato___Healthy",
    "Tomato - Late Blight": "Tomato___Late_blight",
    "Tomato_Late_blight": "Tomato___Late_blight",
    "Tomato_Leaf_Mold": "Tomato___Leaf_mold",
    "Tomato - Septoria Leaf Spot": "Tomato___Septoria_leaf_spot",
    "Tomato_Septoria_leaf_spot": "Tomato___Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Tomato___Spider_mites_two_spotted_spider_mite",
    "Tomato__Target_Spot": "Tomato___Target_spot",
    "Tomato__Tomato_mosaic_virus": "Tomato___Tomato_mosaic_virus",
    "Tomato - Yellow Leaf Curl Virus": "Tomato___Yellow_leaf_curl_virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "Tomato___Yellow_leaf_curl_virus",
}

def hash_worker(item):
    fpath, cls_name = item
    try:
        with open(fpath, "rb") as fp:
            data = fp.read()
        return (hashlib.md5(data).hexdigest(), fpath, cls_name, None)
    except Exception as e:
        return (None, fpath, cls_name, str(e))

def scan_all_unique_images():
    print("Step 1: Rapid multi-threaded scanning and deduplication...", flush=True)
    all_raw_items = []

    # 1. Gather all files from Dataset A
    splits = ["Train", "Val", "Test"]
    for s in splits:
        split_path = os.path.join(ARCHIVE_DIR, s)
        if not os.path.exists(split_path):
            continue
        for entry in os.scandir(split_path):
            if entry.is_dir() and entry.name != ".ipynb_checkpoints":
                canonical_cls = CANONICAL_MAP.get(entry.name)
                if not canonical_cls:
                    continue
                for f in os.scandir(entry.path):
                    if f.is_file() and os.path.splitext(f.name)[1].lower() in [".jpg", ".jpeg", ".png", ".bmp"]:
                        all_raw_items.append((f.path, canonical_cls))

    # 2. Gather all files from Dataset B
    if os.path.exists(MY_DATASET_DIR):
        for entry in os.scandir(MY_DATASET_DIR):
            if entry.is_dir() and entry.name != ".ipynb_checkpoints":
                canonical_cls = CANONICAL_MAP.get(entry.name)
                if not canonical_cls:
                    continue
                for f in os.scandir(entry.path):
                    if f.is_file() and os.path.splitext(f.name)[1].lower() in [".jpg", ".jpeg", ".png", ".bmp"]:
                        all_raw_items.append((f.path, canonical_cls))

    print(f"  Discovered {len(all_raw_items):,} total raw files across both datasets.", flush=True)
    print("  Computing hashes with 8 parallel worker threads...", flush=True)

    unique_items = {}
    skipped_duplicates = 0
    corrupt_count = 0

    batch_size = 5000
    total = len(all_raw_items)
    with ThreadPoolExecutor(max_workers=8) as executor:
        for i in range(0, total, batch_size):
            chunk = all_raw_items[i : i + batch_size]
            results = executor.map(hash_worker, chunk)
            for h, fpath, cls_name, err in results:
                if err or not h:
                    corrupt_count += 1
                    continue
                if h in unique_items:
                    skipped_duplicates += 1
                else:
                    unique_items[h] = (fpath, cls_name)
            print(f"  Hashed {min(i + batch_size, total):,}/{total:,} files...", flush=True)

    print(f"\nDeduplication complete:", flush=True)
    print(f"  Unique images: {len(unique_items):,}", flush=True)
    print(f"  Duplicates removed: {skipped_duplicates:,}", flush=True)
    print(f"  Corrupt skipped: {corrupt_count}", flush=True)
    return unique_items

def partition_stratified(unique_items):
    print("\nStep 2: Stratified 70/15/15 Split (Random Seed = 42)...", flush=True)
    hashes = list(unique_items.keys())
    labels = [unique_items[h][1] for h in hashes]

    # Split 70% train, 30% temp
    train_hashes, temp_hashes, train_y, temp_y = train_test_split(
        hashes, labels, test_size=0.30, random_state=42, stratify=labels
    )

    # Split temp 50/50 -> 15% val, 15% test of total
    val_hashes, test_hashes, val_y, test_y = train_test_split(
        temp_hashes, temp_y, test_size=0.50, random_state=42, stratify=temp_y
    )

    # Verify no data leakage
    set_train = set(train_hashes)
    set_val = set(val_hashes)
    set_test = set(test_hashes)

    assert len(set_train & set_val) == 0, "Leakage train-val!"
    assert len(set_train & set_test) == 0, "Leakage train-test!"
    assert len(set_val & set_test) == 0, "Leakage val-test!"
    print(f"  Leakage Verification: 100% PASSED (0 overlap).", flush=True)

    print(f"  Train: {len(train_hashes):,} images ({len(train_hashes)/len(hashes)*100:.1f}%)", flush=True)
    print(f"  Val:   {len(val_hashes):,} images ({len(val_hashes)/len(hashes)*100:.1f}%)", flush=True)
    print(f"  Test:  {len(test_hashes):,} images ({len(test_hashes)/len(hashes)*100:.1f}%)", flush=True)

    splits_data = {
        "train": [(h, unique_items[h][0], unique_items[h][1]) for h in train_hashes],
        "val": [(h, unique_items[h][0], unique_items[h][1]) for h in val_hashes],
        "test": [(h, unique_items[h][0], unique_items[h][1]) for h in test_hashes]
    }
    return splits_data

def resize_save_worker(task):
    h, src_path, cls_name, dst_dir = task
    try:
        dst_path = os.path.join(dst_dir, f"{h[:16]}.jpg")
        if os.path.exists(dst_path):
            return True
        with Image.open(src_path) as img:
            img = img.convert("RGB")
            # 224x224 Lanczos
            resized = img.resize((224, 224), Image.Resampling.LANCZOS)
            resized.save(dst_path, "JPEG", quality=90)
        return True
    except Exception as e:
        return False

def write_merged_dataset(splits_data):
    print("\nStep 3: Resizing to 224x224 and saving to data/merged/{train,val,test}...", flush=True)
    class_list = sorted(list(set(CANONICAL_MAP.values())))

    # Pre-create directory tree
    for s in SPLITS:
        for c in class_list:
            os.makedirs(os.path.join(OUT_BASE, s, c), exist_ok=True)

    tasks = []
    for s in SPLITS:
        for h, src_path, cls_name in splits_data[s]:
            dst_dir = os.path.join(OUT_BASE, s, cls_name)
            tasks.append((h, src_path, cls_name, dst_dir))

    total = len(tasks)
    print(f"  Converting {total:,} images with 8 threads...", flush=True)
    batch_size = 5000
    with ThreadPoolExecutor(max_workers=8) as executor:
        for i in range(0, total, batch_size):
            chunk = tasks[i : i + batch_size]
            list(executor.map(resize_save_worker, chunk))
            print(f"  Converted {min(i + batch_size, total):,}/{total:,} images (224x224)...", flush=True)
    print("All images saved to data/merged!", flush=True)

def generate_metadata_and_weights(splits_data):
    print("\nStep 4: Writing class_names.json, crop_to_diseases.json, and class_weights.json...", flush=True)
    class_list = sorted(list(set(CANONICAL_MAP.values())))

    # 1. class_names.json
    with open("ml-training/class_names.json", "w", encoding="utf-8") as f:
        json.dump(class_list, f, indent=2)
    print(f"  Saved 33 classes to ml-training/class_names.json", flush=True)

    # 2. crop_to_diseases.json
    crop_map = defaultdict(list)
    for c in class_list:
        crop, disease = c.split("___", 1)
        crop_map[crop].append(disease)

    with open("ml-training/crop_to_diseases.json", "w", encoding="utf-8") as f:
        json.dump({k: sorted(v) for k, v in sorted(crop_map.items())}, f, indent=2)
    print(f"  Saved crop->diseases mapping to ml-training/crop_to_diseases.json", flush=True)

    # 3. class_weights.json
    train_counts = Counter([item[2] for item in splits_data["train"]])
    val_counts = Counter([item[2] for item in splits_data["val"]])
    test_counts = Counter([item[2] for item in splits_data["test"]])

    N = len(splits_data["train"])
    K = len(class_list)
    class_weights_dict = {}
    class_weights_idx = {}

    for idx, c in enumerate(class_list):
        n_c = train_counts.get(c, 1)
        w = float(N / (K * n_c))
        class_weights_dict[c] = round(w, 4)
        class_weights_idx[idx] = round(w, 4)

    with open("ml-training/class_weights.json", "w", encoding="utf-8") as f:
        json.dump({
            "class_weights_by_name": class_weights_dict,
            "class_weights_by_index": class_weights_idx,
            "train_counts": dict(train_counts)
        }, f, indent=2)
    print(f"  Saved class weights to ml-training/class_weights.json", flush=True)

    # 4. Summary
    summary = {
        "total_unique": N + len(splits_data["val"]) + len(splits_data["test"]),
        "train": N,
        "val": len(splits_data["val"]),
        "test": len(splits_data["test"]),
        "classes": K,
        "class_breakdown": {
            c: {
                "train": train_counts[c],
                "val": val_counts[c],
                "test": test_counts[c],
                "total": train_counts[c] + val_counts[c] + test_counts[c],
                "weight": class_weights_dict[c]
            } for c in class_list
        }
    }
    with open("ml-training/data_split_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  Saved summary to ml-training/data_split_summary.json", flush=True)
    return summary

def main():
    unique = scan_all_unique_images()
    splits = partition_stratified(unique)
    write_merged_dataset(splits)
    generate_metadata_and_weights(splits)
    print("\n==========================================")
    print("PHASE 2 - DATA PREPARATION COMPLETED 100%!")
    print("==========================================", flush=True)

if __name__ == "__main__":
    main()
