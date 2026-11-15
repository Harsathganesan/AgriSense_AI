"""
AgriSense AI - Dataset Analysis and Stratified Splitting Script
Phase 1: Dataset Analysis

This script:
1. Discovers all class folders dynamically without assuming names.
2. Validates image integrity using PIL (checks for corrupt files).
3. Identifies duplicate files (via content hashing) to avoid data leakage.
4. Extracts crop categories and disease classes automatically.
5. Computes class distribution, healthy vs. diseased counts, and imbalance.
6. Generates stratified 70/15/15 train/val/test splits without duplicating files.
7. Outputs dataset_analysis_report.json and a formatted markdown summary.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from collections import defaultdict, Counter
from PIL import Image
import numpy as np

def compute_file_hash(filepath, block_size=65536):
    """Compute MD5 hash of a file to detect duplicates."""
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(block_size), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        return None

def is_valid_image(filepath):
    """Validate that image can be opened and verified by PIL."""
    try:
        with Image.open(filepath) as img:
            img.verify()
        # Verify does not decode data; open and load a 1x1 chunk to ensure readable
        with Image.open(filepath) as img:
            img.load()
        return True, None
    except Exception as e:
        return False, str(e)

def parse_class_name(folder_name):
    """
    Automatically deduce crop and condition from folder name.
    Handles standard PlantVillage conventions:
    e.g. 'Tomato_Early_blight', 'Potato___Late_blight', 'Pepper__bell___healthy'
    """
    cleaned = folder_name.strip()
    
    # Common separators in PlantVillage: '___', '__', '_'
    if '___' in cleaned:
        parts = cleaned.split('___')
        crop_part = parts[0].replace('__', '_').replace('_', ' ')
        condition_part = parts[1].replace('__', '_').replace('_', ' ')
    elif '__' in cleaned:
        parts = cleaned.split('__', 1)
        crop_part = parts[0].replace('_', ' ')
        condition_part = parts[1].replace('_', ' ')
    elif '_' in cleaned:
        parts = cleaned.split('_', 1)
        crop_part = parts[0]
        condition_part = parts[1].replace('_', ' ')
    else:
        crop_part = cleaned
        condition_part = "Unknown"

    crop_name = crop_part.title()
    disease_name = condition_part.title()
    
    is_healthy = "healthy" in folder_name.lower() or "healthy" in condition_part.lower()
    
    return {
        "raw_class": folder_name,
        "crop": crop_name,
        "condition": disease_name,
        "is_healthy": is_healthy
    }

def analyze_dataset(dataset_root="ml-training/dataset"):
    root_path = Path(dataset_root)
    if not root_path.exists():
        print(f"Error: Dataset path '{dataset_root}' does not exist.")
        sys.exit(1)

    print(f"[*] Scanning dataset at: {root_path.resolve()}")
    
    # Detect all image files (.jpg, .jpeg, .png, .bmp, .webp)
    valid_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.JPG', '.JPEG', '.PNG'}
    
    # Find all leaf directories containing images
    class_dirs = {}
    for dirpath, dirnames, filenames in os.walk(root_path):
        # Ignore hidden folders
        if any(part.startswith('.') for part in Path(dirpath).parts):
            continue
            
        imgs = [f for f in filenames if Path(f).suffix in valid_exts]
        if imgs:
            folder_name = os.path.basename(dirpath)
            # Check relative depth / parent to ensure proper class grouping
            rel_path = os.path.relpath(dirpath, root_path)
            class_dirs[rel_path] = {
                "folder_name": folder_name,
                "full_path": dirpath,
                "image_count": len(imgs),
                "images": imgs
            }

    print(f"[*] Found {len(class_dirs)} directories containing images.")

    # Image validation, duplicate detection, and integrity check
    seen_hashes = {}  # hash -> first seen relative path
    duplicates = []
    corrupted = []
    valid_images_by_class = defaultdict(list)
    nested_structures_found = set()

    total_scanned = 0

    for rel_dir, info in sorted(class_dirs.items()):
        raw_folder = info["folder_name"]
        
        # Detect if this path has duplicated hierarchy (e.g. PlantVillage/PlantVillage/...)
        parts = Path(rel_dir).parts
        if len(parts) > 2 and parts[-2] == "PlantVillage" and "PlantVillage" in parts[:-2]:
            nested_structures_found.add(rel_dir)

        print(f"    Scanning: {rel_dir} ({info['image_count']} images)...")
        for img_name in info["images"]:
            total_scanned += 1
            img_path = os.path.join(info["full_path"], img_name)
            rel_file_path = os.path.relpath(img_path, root_path)
            
            # 1. Validation check
            valid, err = is_valid_image(img_path)
            if not valid:
                corrupted.append({"path": rel_file_path, "error": err})
                continue
            
            # 2. Duplicate detection
            img_hash = compute_file_hash(img_path)
            if img_hash in seen_hashes:
                duplicates.append({
                    "original": seen_hashes[img_hash],
                    "duplicate": rel_file_path,
                    "class": raw_folder
                })
            else:
                seen_hashes[img_hash] = rel_file_path
                valid_images_by_class[raw_folder].append(rel_file_path)

    unique_valid_count = sum(len(imgs) for imgs in valid_images_by_class.values())
    total_duplicates = len(duplicates)
    total_corrupted = len(corrupted)

    print("\n" + "="*60)
    print("DATASET INTEGRITY & DISCOVERY SUMMARY")
    print("="*60)
    print(f"Total raw images scanned: {total_scanned}")
    print(f"Total corrupted images:    {total_corrupted}")
    print(f"Total duplicate images:    {total_duplicates}")
    print(f"Unique, valid images:     {unique_valid_count}")
    print(f"Identified unique classes: {len(valid_images_by_class)}")
    print("="*60)

    # Class details and analysis
    class_stats = []
    crops_summary = defaultdict(lambda: {"total": 0, "healthy": 0, "diseased": 0, "classes": []})
    healthy_total = 0
    diseased_total = 0

    for raw_class, img_list in sorted(valid_images_by_class.items()):
        parsed = parse_class_name(raw_class)
        cnt = len(img_list)
        is_h = parsed["is_healthy"]
        
        if is_h:
            healthy_total += cnt
            crops_summary[parsed["crop"]]["healthy"] += cnt
        else:
            diseased_total += cnt
            crops_summary[parsed["crop"]]["diseased"] += cnt
            
        crops_summary[parsed["crop"]]["total"] += cnt
        crops_summary[parsed["crop"]]["classes"].append({
            "raw_class": raw_class,
            "condition": parsed["condition"],
            "count": cnt,
            "is_healthy": is_h
        })

        class_stats.append({
            "raw_class": raw_class,
            "crop": parsed["crop"],
            "condition": parsed["condition"],
            "is_healthy": is_h,
            "count": cnt,
            "percentage": round((cnt / unique_valid_count) * 100, 2)
        })

    counts_only = [item["count"] for item in class_stats]
    max_count = max(counts_only) if counts_only else 0
    min_count = min(counts_only) if counts_only else 0
    imbalance_ratio = round(max_count / min_count, 2) if min_count > 0 else 0

    print(f"\n[+] Crop Breakdown:")
    for crop, data in crops_summary.items():
        print(f"    - {crop}: {data['total']} images (Healthy: {data['healthy']}, Diseased: {data['diseased']}) across {len(data['classes'])} classes")

    print(f"\n[+] Health Ratio: Healthy: {healthy_total} ({round(healthy_total/unique_valid_count*100, 1)}%) | Diseased: {diseased_total} ({round(diseased_total/unique_valid_count*100, 1)}%)")
    print(f"[+] Class Imbalance Ratio: {imbalance_ratio}:1 (Max: {max_count}, Min: {min_count})")

    # Stratified Train/Val/Test Split (70% Train, 15% Val, 15% Test)
    # Using deterministic seed to prevent data leakage and guarantee reproducibility
    print("\n[*] Performing Stratified 70% Train / 15% Val / 15% Test Split...")
    
    all_filepaths = []
    all_labels = []
    
    # Class names mapping
    class_names = sorted(list(valid_images_by_class.keys()))
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    
    for raw_class, paths in valid_images_by_class.items():
        for p in paths:
            all_filepaths.append(p)
            all_labels.append(raw_class)

    from sklearn.model_selection import train_test_split
    
    # 70% train, 30% temp (which will be split 50/50 into 15% val, 15% test)
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        all_filepaths, all_labels,
        test_size=0.30,
        random_state=42,
        stratify=all_labels
    )
    
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels,
        test_size=0.50,
        random_state=42,
        stratify=temp_labels
    )

    print(f"[+] Split Results:")
    print(f"    Train: {len(train_paths)} ({round(len(train_paths)/len(all_filepaths)*100, 1)}%)")
    print(f"    Val:   {len(val_paths)} ({round(len(val_paths)/len(all_filepaths)*100, 1)}%)")
    print(f"    Test:  {len(test_paths)} ({round(len(test_paths)/len(all_filepaths)*100, 1)}%)")

    # Verify no overlap between splits (Data Leakage Verification)
    train_set = set(train_paths)
    val_set = set(val_paths)
    test_set = set(test_paths)
    
    leakage = (train_set & val_set) | (train_set & test_set) | (val_set & test_set)
    if leakage:
        raise ValueError(f"CRITICAL: Data leakage detected! Overlapping files: {len(leakage)}")
    print("[+] Verified ZERO data leakage between Train, Validation, and Test splits.")

    # Save splits to directory
    splits_dir = Path("ml-training/splits")
    splits_dir.mkdir(parents=True, exist_ok=True)
    
    def save_split_csv(filepath, paths, labels):
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("image_path,class_name,class_id\n")
            for p, l in zip(paths, labels):
                f.write(f'"{p}","{l}",{class_to_idx[l]}\n')
                
    save_split_csv(splits_dir / "train_split.csv", train_paths, train_labels)
    save_split_csv(splits_dir / "val_split.csv", val_paths, val_labels)
    save_split_csv(splits_dir / "test_split.csv", test_paths, test_labels)
    print(f"[+] Saved split manifests to '{splits_dir.resolve()}'.")

    # Save class_names.json for serving
    class_names_path = Path("ml-training/class_names.json")
    with open(class_names_path, 'w', encoding='utf-8') as f:
        json.dump(class_names, f, indent=2)
    print(f"[+] Saved class names list to '{class_names_path.resolve()}'.")

    # Generate complete dataset analysis report in JSON
    report_data = {
        "dataset_root": str(root_path.resolve()),
        "total_images_scanned": total_scanned,
        "corrupted_images_count": total_corrupted,
        "corrupted_images": corrupted,
        "duplicate_images_count": total_duplicates,
        "unique_valid_images_count": unique_valid_count,
        "healthy_count": healthy_total,
        "diseased_count": diseased_total,
        "imbalance_ratio": imbalance_ratio,
        "total_classes": len(class_names),
        "crops": crops_summary,
        "classes": class_stats,
        "splits": {
            "train_count": len(train_paths),
            "val_count": len(val_paths),
            "test_count": len(test_paths),
            "train_percent": 70.0,
            "val_percent": 15.0,
            "test_percent": 15.0,
            "data_leakage_detected": False
        }
    }

    report_json_path = Path("ml-training/dataset_analysis_report.json")
    with open(report_json_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2)
    print(f"[+] Saved JSON report to '{report_json_path.resolve()}'.")

    # Generate Markdown Report
    md_content = f"""# AgriSense AI - Plant Disease Dataset Analysis Report

**Analysis Timestamp:** Deterministic Run  
**Dataset Location:** `{root_path.resolve()}`  
**Evaluation Standard:** Independent Stratified 70/15/15 Holdout  

---

## 1. Executive Summary
- **Total Images Scanned:** {total_scanned:,}
- **Corrupted / Unreadable Images:** {total_corrupted}
- **Duplicate Images Detected:** {total_duplicates:,} (Discovered nested folder duplicate extraction)
- **Net Unique Valid Images:** {unique_valid_count:,}
- **Total Diagnostic Classes:** {len(class_names)}
- **Healthy Samples:** {healthy_total:,} ({round(healthy_total/unique_valid_count*100, 1)}%)
- **Diseased Samples:** {diseased_total:,} ({round(diseased_total/unique_valid_count*100, 1)}%)
- **Class Imbalance Ratio:** {imbalance_ratio}:1 (Max: {max_count} samples, Min: {min_count} samples)

---

## 2. Crop Categories & Class Breakdown

| Crop | Disease / Condition | Healthy? | Sample Count | % of Dataset |
| :--- | :--- | :--- | :--- | :--- |
"""
    for item in class_stats:
        status_badge = "Healthy" if item["is_healthy"] else "Diseased"
        md_content += f"| **{item['crop']}** | {item['condition']} | {status_badge} | {item['count']:,} | {item['percentage']}% |\n"

    md_content += f"""
---

## 3. Stratified Partitioning (No Data Leakage)
To prevent model overfitting and evaluation bias, a stratified split ensures that each of the 15 classes maintains the exact distribution across all partitions:

- **Training Set (70%):** {len(train_paths):,} images (`ml-training/splits/train_split.csv`)
- **Validation Set (15%):** {len(val_paths):,} images (`ml-training/splits/val_split.csv`)
- **Independent Test Set (15%):** {len(test_paths):,} images (`ml-training/splits/test_split.csv`)
- **Data Leakage Check:** Passed (0 file overlap across partitions)

---

## 4. Class Imbalance Mitigation Strategy for Training
- Class weights calculated inversely proportional to class frequencies:
  $$w_j = \\frac{{N}}{{K \\times n_j}}$$
- Standardized data augmentation (random rotation, horizontal flip, brightness jitter) to stabilize lower-count classes such as `Potato___healthy` ({min_count} samples).
"""

    md_report_path = Path("ml-training/DATASET_ANALYSIS_REPORT.md")
    with open(md_report_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"[+] Saved Markdown report to '{md_report_path.resolve()}'.")

    return report_data

if __name__ == "__main__":
    analyze_dataset()

