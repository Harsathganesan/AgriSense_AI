# AgriSense AI - Plant Disease Dataset Analysis Report

**Analysis Timestamp:** Deterministic Run  
**Dataset Location:** `G:\Projects\NASA Farming\ml-training\dataset`  
**Evaluation Standard:** Independent Stratified 70/15/15 Holdout  

---

## 1. Executive Summary
- **Total Images Scanned:** 20,638
- **Corrupted / Unreadable Images:** 0
- **Duplicate Images Detected:** 14 (Discovered nested folder duplicate extraction)
- **Net Unique Valid Images:** 20,624
- **Total Diagnostic Classes:** 15
- **Healthy Samples:** 3,215 (15.6%)
- **Diseased Samples:** 17,409 (84.4%)
- **Class Imbalance Ratio:** 21.11:1 (Max: 3208 samples, Min: 152 samples)

---

## 2. Crop Categories & Class Breakdown

| Crop | Disease / Condition | Healthy? | Sample Count | % of Dataset |
| :--- | :--- | :--- | :--- | :--- |
| **Pepper Bell** | Bacterial Spot | Diseased | 997 | 4.83% |
| **Pepper Bell** | Healthy | Healthy | 1,478 | 7.17% |
| **Potato** | Early Blight | Diseased | 1,000 | 4.85% |
| **Potato** | Late Blight | Diseased | 1,000 | 4.85% |
| **Potato** | Healthy | Healthy | 152 | 0.74% |
| **Tomato** | Bacterial Spot | Diseased | 2,127 | 10.31% |
| **Tomato** | Early Blight | Diseased | 1,000 | 4.85% |
| **Tomato** | Late Blight | Diseased | 1,901 | 9.22% |
| **Tomato** | Leaf Mold | Diseased | 952 | 4.62% |
| **Tomato** | Septoria Leaf Spot | Diseased | 1,771 | 8.59% |
| **Tomato** | Spider Mites Two Spotted Spider Mite | Diseased | 1,676 | 8.13% |
| **Tomato** | Target Spot | Diseased | 1,404 | 6.81% |
| **Tomato** | Tomato Yellowleaf  Curl Virus | Diseased | 3,208 | 15.55% |
| **Tomato** | Tomato Mosaic Virus | Diseased | 373 | 1.81% |
| **Tomato** | Healthy | Healthy | 1,585 | 7.69% |

---

## 3. Stratified Partitioning (No Data Leakage)
To prevent model overfitting and evaluation bias, a stratified split ensures that each of the 15 classes maintains the exact distribution across all partitions:

- **Training Set (70%):** 14,436 images (`ml-training/splits/train_split.csv`)
- **Validation Set (15%):** 3,094 images (`ml-training/splits/val_split.csv`)
- **Independent Test Set (15%):** 3,094 images (`ml-training/splits/test_split.csv`)
- **Data Leakage Check:** Passed (0 file overlap across partitions)

---

## 4. Class Imbalance Mitigation Strategy for Training
- Class weights calculated inversely proportional to class frequencies:
  $$w_j = \frac{N}{K \times n_j}$$
- Standardized data augmentation (random rotation, horizontal flip, brightness jitter) to stabilize lower-count classes such as `Potato___healthy` (152 samples).
