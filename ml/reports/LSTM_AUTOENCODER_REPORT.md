# LSTM AUTOENCODER — SEQUENCE ANOMALY DETECTION REPORT
**Task**: Sequence-Level Meteorological Anomaly Detection (Unsupervised Autoencoder)  
**Execution Timestamp**: 2026-09-23  
**Framework Environment**: TensorFlow `2.22.0-rc0`, Keras `3.16.0.dev`, Python `3.14.6`  
**Artifact Directory**: `ml/`  

---

## 1. Executive Summary & Deliverables

An unsupervised LSTM Autoencoder was constructed, trained exclusively on normal historical sequences, and evaluated on synthetic ground-truth sequence anomalies across 7 Indian weather stations. All data integrity constraints, time-based split isolations, and sequence construction rules were strictly enforced.

| Deliverable | Path | Description / Metrics |
| :--- | :--- | :--- |
| **Model Weights** | [`ml/models/lstm_autoencoder.keras`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/models/lstm_autoencoder.keras) | Trained LSTM Autoencoder (64 units, 24 timesteps, 25 features) |
| **Scaler** | [`ml/models/scaler.pkl`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/models/scaler.pkl) | `StandardScaler` fitted strictly on normal training sequences |
| **Threshold Config** | [`ml/models/anomaly_threshold.json`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/models/anomaly_threshold.json) | Optimal threshold: **0.24231** (P90 of Normal Val, Val F1: 0.3390) |
| **Feature Config** | [`ml/features/lstm_feature_config.json`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/features/lstm_feature_config.json) | 25-feature single-station core telemetry configuration |
| **Sequence Metadata** | [`ml/sequences/sequence_metadata.json`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/sequences/sequence_metadata.json) | Sequence counts, drop reasons, and cross-source metadata |
| **Training History** | [`ml/reports/training_history.csv`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/training_history.csv) | 100-epoch training loss curve log |
| **Loss Curve Plot** | [`ml/reports/training_loss.png`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/training_loss.png) | High-resolution training & validation MSE loss curves |
| **Reconstruction Plot** | [`ml/reports/reconstruction_error_distribution.png`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/reconstruction_error_distribution.png) | Overlapping error histograms (Normal Val vs Anomaly Val) |
| **Test Predictions** | [`ml/reports/test_predictions.csv`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/test_predictions.csv) | Per-window actual/predicted labels, MSE error, and fault metadata |
| **Test Metrics** | [`ml/reports/model_metrics.json`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/model_metrics.json) | Complete evaluation metrics (Accuracy, F1, Precision, Recall, Specificity) |
| **Confusion Matrix** | [`ml/reports/confusion_matrix.png`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/reports/confusion_matrix.png) | Confusion matrix heatmap on test sequences |

---

## 2. Input Dataset & Step 1 Verification

The input files from the prior task (`data/anomaly_labeled/{train,val,test}_labeled.csv`) were verified prior to processing:
* **Row Counts**: Train: **200,039**, Validation: **49,864**, Test: **37,011** (100% match with prior audit).
* **Column Completeness**: All 59 engineered features + 8 fault-label columns present without structural corruption.
* **Timestamp Monotonicity**: Timestamps are strictly increasing within each `(station_id, source)` time series.
* **Split Boundary Isolation**: Zero overlapping timestamps between splits; zero fault windows cross split boundaries.
* **Pre-Injection Value Audit**: 100% of rows with `is_anomaly == True` have non-null `true_value_before_injection`.

---

## 3. Final Feature Set (Step 2) & Series Exclusions

Following Option A as instructed, model input is restricted to the **25-feature single-station core telemetry set**:

1. **Core Measurements (4)**: `temperature`, `humidity`, `pressure`, `wind_speed`
2. **Cyclical Spatial & Temporal (5)**: `wind_dir_sin`, `wind_dir_cos`, `hour_sin`, `hour_cos`, `day_of_year`
3. **Rates of Change (4)**: `temperature_roc`, `humidity_roc`, `pressure_roc`, `wind_speed_roc`
4. **3-Hour Rolling Stats (8)**: `temperature_roll_mean_3h`, `temperature_roll_std_3h`, `humidity_roll_mean_3h`, `humidity_roll_std_3h`, `pressure_roll_mean_3h`, `pressure_roll_std_3h`, `wind_speed_roll_mean_3h`, `wind_speed_roll_std_3h`
5. **24-Hour Rolling Means (4)**: `temperature_roll_mean_24h`, `humidity_roll_mean_24h`, `pressure_roll_mean_24h`, `wind_speed_roll_mean_24h`

### Excluded from Model Input
* **Identifers & Categoricals**: `station_id`, `city`, `source`, `split`, `timestamp`.
* **Data Quality & Provenance Flags**: All `*_filled`, `*_large_gap`, `*_invalid_removed`, `*_missing`, and `*_unreliable_source` flags.
* **Ground-Truth Labels**: All 8 label columns (`fault_type`, `is_anomaly`, `affected_variable`, etc.).
* **Precipitation**: Excluded from model input due to structural event-only reporting in NOAA (95% native sparsity).
* **Cross-Source Differences**: Excluded from model input due to 3-hourly synoptic sampling cadence of peer stations, but **retained in sequence metadata** per amendment.

### Explicit Station Exclusions Confirmed
As directed, **NOAA Mumbai (`43057099999`)**, **NOAA Pune (`43063099999`)**, and **NOAA Bengaluru (`43295099999`)** are excluded from sequence generation because their native 3-hourly cadence fails the $\le 1\text{h}$ consecutive-timestamp requirement.

---

## 4. Sequence Construction & Window Statistics (Step 3)

### Construction Rules
* **Station Grouping**: Sequences are constructed strictly within individual `(station_id, source)` time series.
* **Sliding Window**: Length $L = 24$ hours, stride $S = 1$ hour.
* **Timestamp Continuity**: Strict requirement of $(t_{k+1} - t_k) == 1.0\text{ hour}$ across all 24 steps.
* **Zero-NaN Requirement**: If ANY of the 25 features has `NaN` in ANY of the 24 steps, the entire window is dropped.
* **Sequence-Level Label Rule**: A sequence is labeled **`ANOMALY`** if `is_anomaly == True` for $\ge 1$ timestep in the 24-hour window, else **`NORMAL`**.

### Sequence Generation Volume by Split

| Split | Total Possible Windows | Time-Gap Discontinuity Drops ($> 1\text{h}$) | Excluded Station Drops (3h Synoptic) | NaN Feature Drops | Valid Sequences Generated | Normal Sequences | Anomaly Sequences | Anomaly Sequence % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Train** | 199,717 | 15,650 | 13,342 | 48,494 | **122,231** | **101,846** | **20,385** | 16.68% |
| **Validation** | 49,542 | 4,401 | 3,804 | 11,399 | **29,938** | **24,346** | **5,592** | 18.68% |
| **Test** | 36,689 | 1,464 | 1,092 | 4,556 | **29,577** | **25,726** | **3,851** | 13.02% |
| **TOTAL** | **285,948** | **21,515** | **18,238** | **64,449** | **181,746** | **151,918** | **29,828** | **16.41%** |

*(Note: Although point-level anomaly incidence is ~2.7%, sequence-level anomaly incidence is ~16.4% because an anomaly lasting 1–12 hours flags every overlapping 24-hour sliding window that intersects it).*

---

## 5. Scaling, Model Architecture & Training Dynamics (Steps 4–6)

### Feature Scaling (Step 4)
* `StandardScaler` was fitted strictly on flattened **NORMAL training sequences** ($101,846 \times 24 = 2,444,304$ timesteps across 25 features).
* Fitted scaler was applied to train, validation, and test sequences. No data leakage from validation or test occurred.
* Saved to [`ml/models/scaler.pkl`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/models/scaler.pkl).

### Model Architecture (Step 6)
```
Model: "LSTM_Autoencoder"
_________________________________________________________________
 Layer (type)                Output Shape              Param #   
=================================================================
 input_layer (InputLayer)    (None, 24, 25)            0         
 lstm_encoder (LSTM)         (None, 64)                23,040    
 dropout_1 (Dropout)         (None, 64)                0         
 repeat_vector (RepeatVector)(None, 24, 64)            0         
 lstm_decoder (LSTM)         (None, 24, 64)            33,024    
 dropout_2 (Dropout)         (None, 24, 64)            0         
 time_distributed (Dense)    (None, 24, 25)            1,625     
=================================================================
Total params: 57,689 (225.35 KB)
Trainable params: 57,689 (225.35 KB)
Non-trainable params: 0 (0.00 Byte)
_________________________________________________________________
```

### Hyperparameters & Training Setup
* **Loss**: Mean Squared Error (MSE)
* **Optimizer**: Adam ($\text{learning\_rate} = 10^{-3}$, reduced on plateau down to $3.125 \times 10^{-5}$)
* **Batch Size**: 64
* **Epochs**: 100 max (completed 100 epochs; best weights from epoch 99 restored)
* **Callbacks**: `EarlyStopping(monitor='val_loss', patience=10)`, `ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5)`
* **Reproducibility Seed**: 42 (`numpy`, `random`, `tensorflow`)

### Overfitting & Loss Curve Observations
* **Initial Loss (Epoch 1)**: Train MSE: **0.5487**, Val MSE: **0.3155**
* **Final Best Loss (Epoch 99)**: Train MSE: **0.2087**, Val MSE: **0.1615**
* **Overfitting Assessment**: There is **zero overfitting**. Validation loss strictly tracks and remains slightly below training loss throughout training. This is expected due to the 20% Dropout rate applied during training (which is disabled during validation inference).

---

## 6. Reconstruction Error Analysis (Step 7)

Per-sequence MSE was computed across all five sequence partitions:
$$\text{MSE}_i = \frac{1}{24 \times 25} \sum_{t=1}^{24} \sum_{f=1}^{25} (X_{i,t,f} - \hat{X}_{i,t,f})^2$$

### Reconstruction Error Percentile Table

| Sequence Partition | Count | Mean MSE | Std Dev | Median (P50) | P90 | P95 | P99 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Normal Train** | 101,846 | 0.14442 | 0.07689 | 0.12722 | 0.21132 | 0.24998 | 0.41580 |
| **Normal Validation** | 24,346 | 0.16133 | 0.08154 | 0.14659 | 0.24231 | 0.28228 | 0.38633 |
| **Anomaly Validation** | 5,592 | **0.23105** | 0.18731 | **0.18581** | **0.38380** | **0.54364** | **0.72973** |
| **Normal Test** | 25,726 | 0.12656 | 0.07125 | 0.11356 | 0.21179 | 0.24554 | 0.35126 |
| **Anomaly Test** | 3,851 | **0.19638** | 0.15822 | **0.16062** | **0.35462** | **0.45072** | **0.65090** |

*Key Takeaway*: In both validation and test sets, the anomaly distributions exhibit significantly heavier tails than normal sequences (P95 of anomaly validation is $0.5436$ vs $0.2823$ for normal validation, a **1.93x separation**).

---

## 7. Threshold Optimization on Validation Set (Step 8)

The anomaly threshold was tuned **strictly on the validation set** across candidate percentiles of the Normal Validation reconstruction error distribution:

| Candidate Percentile | Candidate Threshold (MSE) | Validation Precision | Validation Recall | Validation F1 Score | Validation Accuracy | Decision |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P90.0** | **0.24231** | **0.4022** | **0.2929** | **0.3390** | **78.68%** | **SELECTED (Optimal F1)** |
| **P95.0** | 0.28228 | 0.4748 | 0.1969 | 0.2783 | 80.99% | Lower F1 trade-off |
| **P97.0** | 0.31195 | 0.5465 | 0.1575 | 0.2446 | 82.20% | Lower F1 trade-off |
| **P99.0** | 0.38633 | 0.6950 | 0.0994 | 0.1740 | 82.68% | Excessively conservative |

*Chosen Threshold*: **$\tau^* = 0.24231$** (P90 of Normal Validation Error). Saved to [`ml/models/anomaly_threshold.json`](file:///C:/Users/Aryan%20Gupta/.gemini/antigravity/scratch/skyguard_ai/ml/models/anomaly_threshold.json).

---

## 8. Final Test Evaluation & Performance Metrics (Steps 9 & 10)

The frozen model, scaler, and threshold ($\tau^* = 0.24231$) were evaluated on all **29,577 unseen test sequences** (July 1, 2025 to December 31, 2025).

### Confusion Matrix on Test Set

| Actual \ Predicted | Predicted Normal | Predicted Anomaly | Total Actual |
| :--- | :---: | :---: | :---: |
| **Actual Normal** | **24,368** (TN) | **1,358** (FP) | 25,726 |
| **Actual Anomaly** | **2,830** (FN) | **1,021** (TP) | 3,851 |
| **Total Predicted** | 27,198 | 2,379 | **29,577** |

### Comprehensive Performance Metrics

| Metric | Formula | Test Result | Interpretation |
| :--- | :--- | :---: | :--- |
| **Accuracy** | $(TP + TN) / \text{Total}$ | **85.84%** | Strong overall sequence classification |
| **Specificity (TNR)** | $TN / (TN + FP)$ | **94.72%** | High baseline stability on normal weather |
| **False Positive Rate (FPR)** | $FP / (TN + FP)$ | **5.28%** | Low false alarm rate on operational sequences |
| **Precision** | $TP / (TP + FP)$ | **42.92%** | ~43% of flagged alerts are true synthetic faults |
| **Recall (Sensitivity)** | $TP / (TP + FN)$ | **26.51%** | Detects over a quarter of all sequence anomalies |
| **F1 Score** | $2 \cdot \frac{\text{Prec} \cdot \text{Rec}}{\text{Prec} + \text{Rec}}$ | **0.3278** | Consistent with validation tuning ($0.3390$) |
| **False Negative Rate (FNR)** | $FN / (TP + FN)$ | **73.49%** | Misses subtle drift/frozen faults lacking cross-check |

---

## 9. Fault-Type Detection Sensitivity Analysis (Step 11)

Evaluated exclusively on test anomaly windows containing each respective synthetic fault type:

| Fault Type | Target Variable | Total Test Windows | Detected as Anomaly (TP) | Missed (FN) | Detection Sensitivity Rate | Key Detection Dynamic |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`WIND_ANOMALY`** | WS / WD | 1,104 | 557 | 547 | **50.45%** | **Highest Detection Rate**: Large velocity jumps strongly violate temporal auto-correlation. |
| **`HUMIDITY_ANOMALY`**| `humidity` | 615 | 164 | 451 | **26.67%** | Extreme saturations ($0\%/100\%$) trigger large reconstruction penalties. |
| **`FROZEN_SENSOR`** | T, RH, P, WS | 307 | 54 | 253 | **17.59%** | Moderate sensitivity: Constant readings resemble calm night-time inversions. |
| **`PRESSURE_ANOMALY`** | `pressure` | 798 | 127 | 671 | **15.91%** | Moderate sensitivity: $5\text{--}20\ \text{hPa}$ shifts partially absorbed by rolling means. |
| **`TEMP_SPIKE`** | `temperature` | 987 | 145 | 842 | **14.69%** | Brief 1–3h spikes have low coverage in 24h windows ($4\%\text{--}12\%$ of steps). |
| **`TEMP_DRIFT`** | `temperature` | 200 | 23 | 177 | **11.50%** | Gradual $\pm 3\text{--}8^\circ\text{C}$ drift closely mimics natural seasonal temperature trends. |
| **`COMMUNICATION_FAILURE`**| `ALL` | 0 * | 0 | 0 | **N/A** | *Dropped during sequence construction due to missing telemetry (`NaN`). |

*\* Note on Communication Failure: Total telemetry link drops produce contiguous NaNs. In accordance with the strict Step 3 rule ("If ANY row inside a 24-hour window has a NaN in a selected feature, DROP that entire window"), communication failures are handled at the ingestion layer as missing data dropouts rather than passed to numerical sequence inference.*

---

## 10. Amendment Breakout: `single_source_fault` Realism

As specified in the amendment, the cross-source discrepancy features and `single_source_fault` labels were preserved in sequence metadata to isolate model performance on cross-verified faults vs standalone faults:

| Fault Category | Total Test Windows | Detected as Anomaly (TP) | Missed (FN) | Detection Sensitivity Rate | Performance Ratio |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`single_source_fault == True`** | **1,298** | **629** | **669** | **48.46%** | **3.16x higher** |
| **`single_source_fault == False`** | **2,553** | **392** | **2,161** | **15.35%** | Baseline |

### Critical Analytical Insight
Faults constructed with `single_source_fault == True` were detected at a rate of **48.46%**, compared to only **15.35%** for standalone faults without dual-stream cross-verification.
* **Why**: When a fault occurs on a single sensor while the co-located peer sensor remains healthy, the physical relationship between diurnal variables (e.g. temperature vs pressure, or wind vs humidity) is distorted. The autoencoder successfully catches this multivariate physical distortion in nearly half of all windows, even though the explicit cross-source difference feature was omitted from model input.

---

## 11. Model Limitations & Behavioral Observations

1. **Window-Level vs Point-Level Granularity**:
   * A single 1-hour spike anomaly causes up to 24 consecutive sliding windows to be labeled as anomalous. Because the spike only occupies $1/24 \approx 4.1\%$ of the window's timesteps, the average reconstruction MSE over the 24 hours is diluted.
2. **Subtle Calibration Drift vs Diurnal Shifts**:
   * Slow calibration drifts ($0.1^\circ\text{C}/\text{hr}$) are difficult for an unsupervised reconstruction model to distinguish from genuine meteorological synoptic shifts (e.g. pre-monsoon heat waves or cold fronts) without explicit cross-station spatial consensus.
3. **Class Imbalance in Sequences**:
   * Although point-level anomalies represent 2.78% of rows, the 24-hour window expansion creates a 16.4% anomaly sequence rate, which naturally limits single-threshold precision without secondary confidence filtering.

---

## 12. Recommended Next Steps

1. **Spatial Consensus Dual-Input Architecture**: Feed the co-located peer reading (or spatial consensus delta) directly into an ensemble classifier that combines the single-station LSTM Autoencoder reconstruction score with a cross-source gradient booster.
2. **Point-Level Error Attribution**: Implement point-wise error thresholding (evaluating the specific timestep error $e_t$ rather than the window average $\bar{e}$) to accurately locate the exact onset of short-duration spikes.
3. **Multi-Horizon Ensembling**: Combine the 24-hour sequence model with a 3-hour short-window detector optimized specifically for rapid transient faults (spikes and squalls).

---

## 13. Sign-Off Confirmation

**LSTM Autoencoder sequence anomaly detection pipeline complete and verified. All results, metrics, and plots reflect actual computed numbers without estimation or synthetic patching.**
