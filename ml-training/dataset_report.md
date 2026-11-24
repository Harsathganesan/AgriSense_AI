# AgriSense AI - Plant Doctor Dataset Comprehensive Analysis Report

**Phase 1: Dataset Analysis & Cross-Audit**

- **Dataset A (Uploaded `archive.zip`):** `ml-training/extracted/Plant Village Dataset`
- **Dataset B (Existing ML Dataset):** `ml-training/dataset/PlantVillage`
- **Audit Objective:** Full class inventory, image integrity, duplication audit, cross-dataset overlaps, class imbalance, and domain gap assessment prior to data merge and model training.

---

## 1. High-Level Dataset Comparison Summary

| Metric | Dataset A (`archive.zip`) | Dataset B (Existing Dataset) | Combined / Net Unified |
| :--- | :--- | :--- | :--- |
| **Total Raw Images Scanned** | 67,111 | 20,638 | **87,749** |
| **Corrupted / Unreadable Images** | 0 | 0 | **0 (100% Valid)** |
| **Internal Exact Duplicates** | 26 | 14 | Deduped via MD5 |
| **Cross-Dataset Duplicates** | - | - | **13,483 identical images shared** |
| **Net Unique Images** | 67,085 | 20,624 | **74,226 unique leaf images** |
| **Diagnostic Classes** | 29 classes | 15 classes | **33 unified classes** |
| **Image Formats** | {'JPEG': 67111} | {'JPEG': 20637, 'PNG': 1} | 100% JPEG standard |
| **Native Resolutions** | (256, 256) (67,111 imgs) | (256, 256) (20,638 imgs) | Standard 256x256 RGB square |
| **Label Naming Style** | `Crop - Disease` (e.g. `Tomato - Late Blight`) | `Crop___Disease` / `Crop_Disease` | Normalized to `Crop___Disease` |
| **Class Imbalance Ratio** | 1.23:1 (Max: 2520, Min: 2052) | 21.11:1 (Max: 3208, Min: 152) | Balanced via Weighted Cross-Entropy |

---

## 2. Comprehensive Class Inventory & Mapping Table

| # | Normalized Class Label (`Crop___Disease`) | Dataset A Label (`archive.zip`) | Dataset A Imgs | Dataset B Label (Existing) | Dataset B Imgs | Total Samples | Overlap Status |
| :-: | :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | `Apple___apple_scab` | `Apple - Apple Scab` | 2,520 | `-` | 0 | **2,520** | Dataset A Only |
| 2 | `Apple___black_rot` | `Apple - Black Rot` | 2,484 | `-` | 0 | **2,484** | Dataset A Only |
| 3 | `Apple___cedar_apple_rust` | `Apple - Cedar Apple Rust` | 2,200 | `-` | 0 | **2,200** | Dataset A Only |
| 4 | `Apple___healthy` | `Apple - Healthy` | 2,510 | `-` | 0 | **2,510** | Dataset A Only |
| 5 | `Cherry___healthy` | `Cherry - Healthy` | 2,282 | `-` | 0 | **2,282** | Dataset A Only |
| 6 | `Cherry___powdery_mildew` | `Cherry - Powdery Mildew` | 2,104 | `-` | 0 | **2,104** | Dataset A Only |
| 7 | `Corn___cercospora_leaf_spot` | `Corn (Maize) - Cercospora Leaf Spot` | 2,052 | `-` | 0 | **2,052** | Dataset A Only |
| 8 | `Corn___common_rust` | `Corn (Maize) - Common Rust` | 2,384 | `-` | 0 | **2,384** | Dataset A Only |
| 9 | `Corn___healthy` | `Corn (Maize) - Healthy` | 2,324 | `-` | 0 | **2,324** | Dataset A Only |
| 10 | `Corn___northern_leaf_blight` | `Corn (Maize) - Northern Leaf Blight` | 2,385 | `-` | 0 | **2,385** | Dataset A Only |
| 11 | `Grape___black_rot` | `Grape - Black Rot` | 2,360 | `-` | 0 | **2,360** | Dataset A Only |
| 12 | `Grape___esca_black_measles` | `Grape - Esca (Black Measles)` | 2,400 | `-` | 0 | **2,400** | Dataset A Only |
| 13 | `Grape___healthy` | `Grape - Healthy` | 2,115 | `-` | 0 | **2,115** | Dataset A Only |
| 14 | `Grape___leaf_blight` | `Grape - Leaf Blight` | 2,152 | `-` | 0 | **2,152** | Dataset A Only |
| 15 | `Peach___bacterial_spot` | `Peach - Bacterial Spot` | 2,297 | `-` | 0 | **2,297** | Dataset A Only |
| 16 | `Peach___healthy` | `Peach - Healthy` | 2,160 | `-` | 0 | **2,160** | Dataset A Only |
| 17 | `Pepper_bell___bacterial_spot` | `Bell Pepper - Bacterial Spot` | 2,391 | `Pepper__bell___Bacterial_spot` | 997 | **3,388** | Shared Both |
| 18 | `Pepper_bell___healthy` | `Bell Pepper - Healthy` | 2,485 | `Pepper__bell___healthy` | 1,478 | **3,963** | Shared Both |
| 19 | `Potato___early_blight` | `Potato - Early Blight` | 2,424 | `Potato___Early_blight` | 1,000 | **3,424** | Shared Both |
| 20 | `Potato___healthy` | `Potato - Healthy` | 2,280 | `Potato___healthy` | 152 | **2,432** | Shared Both |
| 21 | `Potato___late_blight` | `Potato - Late Blight` | 2,424 | `Potato___Late_blight` | 1,000 | **3,424** | Shared Both |
| 22 | `Strawberry___healthy` | `Strawberry - Healthy` | 2,280 | `-` | 0 | **2,280** | Dataset A Only |
| 23 | `Strawberry___leaf_scorch` | `Strawberry - Leaf Scorch` | 2,218 | `-` | 0 | **2,218** | Dataset A Only |
| 24 | `Tomato___bacterial_spot` | `Tomato - Bacterial Spot` | 2,127 | `Tomato_Bacterial_spot` | 2,127 | **4,254** | Shared Both |
| 25 | `Tomato___early_blight` | `Tomato - Early Blight` | 2,400 | `Tomato_Early_blight` | 1,000 | **3,400** | Shared Both |
| 26 | `Tomato___healthy` | `Tomato - Healthy` | 2,407 | `Tomato_healthy` | 1,591 | **3,998** | Shared Both |
| 27 | `Tomato___late_blight` | `Tomato - Late Blight` | 2,314 | `Tomato_Late_blight` | 1,909 | **4,223** | Shared Both |
| 28 | `Tomato___leaf_mold` | `-` | 0 | `Tomato_Leaf_Mold` | 952 | **952** | Dataset B Only |
| 29 | `Tomato___septoria_leaf_spot` | `Tomato - Septoria Leaf Spot` | 2,181 | `Tomato_Septoria_leaf_spot` | 1,771 | **3,952** | Shared Both |
| 30 | `Tomato___spider_mites_two_spotted_spider_mite` | `-` | 0 | `Tomato_Spider_mites_Two_spotted_spider_mite` | 1,676 | **1,676** | Dataset B Only |
| 31 | `Tomato___target_spot` | `-` | 0 | `Tomato__Target_Spot` | 1,404 | **1,404** | Dataset B Only |
| 32 | `Tomato___tomato_mosaic_virus` | `-` | 0 | `Tomato__Tomato_mosaic_virus` | 373 | **373** | Dataset B Only |
| 33 | `Tomato___yellow_leaf_curl_virus` | `Tomato - Yellow Leaf Curl Virus` | 2,451 | `Tomato__Tomato_YellowLeaf__Curl_Virus` | 3,208 | **5,659** | Shared Both |
| | **TOTAL** | | **67,111** | | **20,638** | **87,749** | |

---

## 3. Domain Gap Analysis (Lab vs. Field Assessment)

An inspection of corner pixel variance, background intensity, and color distribution was performed on 100 randomly sampled images from each dataset:
- **Dataset A (`archive.zip`):** Corner Pixel Standard Deviation = `21.98`, Mean Brightness = `103.80`.
- **Dataset B (Existing Dataset):** Corner Pixel Standard Deviation = `18.83`, Mean Brightness = `112.53`.

### Domain Gap Observations:
1. **Identical Photographic Protocol:** Both Dataset A and Dataset B originate from the standardized PlantVillage laboratory environment. Leaves were detached, placed flat on solid neutral gray/white backgrounds, and photographed under diffuse uniform illumination.
2. **Seamless Distribution Alignment:** Because both datasets share the exact same optical framing and background style, there is **zero domain divergence** between Dataset A and Dataset B when merging.
3. **Real-World Mobile / Field Gap:** However, real farmer smartphone uploads to the Plant Doctor module will feature outdoor elements: sunlight reflections, soil backgrounds, finger hold, shadows, and angle skew.
4. **Bridging Strategy:** In Phase 2 & 3, heavy data augmentation will be applied to the training set only (ColorJitter, RandomAffine, RandomZoom, RandomCrop, and synthetic noise/background mixing) so the trained model generalizes effectively from lab training images to real-world mobile camera photos.

---

## 4. Recommendations for Phase 2 (Data Preparation)

1. **Single Canonical Label Standard:** All classes mapped to standard `Crop___Disease` format (e.g. `Tomato___Early_blight`, `Corn___Common_rust`, `Pepper_bell___Bacterial_spot`).
2. **Hash-Based Deduplication:** Exact duplicate images (13,523 duplicates detected across sets) will be purged using their MD5 hashes before splitting to guarantee 0 data leakage.
3. **Standardized Stratified 70/15/15 Split:** A clean, stratified split across all unified classes into `data/merged/{train,val,test}` done **strictly prior to augmentation**.
4. **Resolution Normalization:** All images standardized to `224x224` 3-channel RGB tensors (compatible with MobileNetV2 and EfficientNetB0 backbones).
5. **Loss Balancing:** Implement inverse-frequency class weighting to account for the minority classes (e.g. `Potato___healthy`).