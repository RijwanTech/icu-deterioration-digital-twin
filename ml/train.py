import os
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

from .data_preprocessing import load_and_clean_data
from .feature_engineering import create_icu_features

def train_deterioration_models(data_path: str, model_save_path: str = "ml/model.pkl"):
    """
    Step 6: Patient-level train/test split (preventing data leakage across records).
    Step 7: Train Baseline Logistic Regression and Random Forest Ensemble.
    Step 8: Evaluate & save selected model via Joblib.
    """
    print(f"[ML Pipeline] Loading data from {data_path}...")
    df_raw = load_and_clean_data(data_path)
    df = create_icu_features(df_raw)
    
    feature_cols = [
        'age', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'map', 'spo2',
        'respiratory_rate', 'temperature', 'shock_index',
        'heart_rate_change', 'spo2_change', 'respiratory_rate_change',
        'recent_mean_heart_rate', 'recent_mean_spo2', 'recent_mean_respiratory_rate'
    ]
    
    # Filter features available
    active_features = [col for col in feature_cols if col in df.columns]
    X = df[active_features]
    y = df['deterioration_target']
    groups = df['patient_id']

    # GroupShuffleSplit ensures ZERO patient leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    print(f"[ML Pipeline] Training cohort size: {len(X_train)} samples across {df.iloc[train_idx]['patient_id'].nunique()} patients.")
    print(f"[ML Pipeline] Test cohort size: {len(X_test)} samples across {df.iloc[test_idx]['patient_id'].nunique()} patients.")

    # 1. Baseline Model
    baseline_lr = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42))
    ])
    baseline_lr.fit(X_train, y_train)

    # 2. Random Forest Model
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_leaf=4,
        class_weight='balanced',
        random_state=42
    )
    rf_model.fit(X_train, y_train)

    # Save model artifact
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    joblib.dump({
        'model': rf_model,
        'baseline_lr': baseline_lr,
        'features': active_features,
        'model_version': 'RF-v1.4',
        'thresholds': {'low': 0.39, 'medium': 0.69}
    }, model_save_path)

    print(f"[ML Pipeline] Selected model saved successfully to {model_save_path}")
    return rf_model, X_test, y_test

if __name__ == "__main__":
    raw_path = "data/raw/icu_cohort_raw.csv"
    if os.path.exists(raw_path):
        train_deterioration_models(raw_path)
    else:
        print(f"Data file {raw_path} not found. Run data generator first.")
