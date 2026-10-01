import pandas as pd
import numpy as np

def create_icu_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 5: Create features.
    Potential features:
      - age, heart_rate, systolic_bp, diastolic_bp, spo2, respiratory_rate, temperature
      - Derived: mean_arterial_pressure (MAP), shock_index (HR/SBP)
    Potential trend features:
      - heart_rate_change, spo2_change, respiratory_rate_change
      - recent_mean_heart_rate, recent_mean_spo2, recent_mean_respiratory_rate
    """
    df = df.copy()
    
    # 1. Hemodynamic derivations
    if 'systolic_bp' in df.columns and 'diastolic_bp' in df.columns:
        df['map'] = (2 * df['diastolic_bp'] + df['systolic_bp']) / 3.0
    
    if 'heart_rate' in df.columns and 'systolic_bp' in df.columns:
        df['shock_index'] = np.where(df['systolic_bp'] > 0, df['heart_rate'] / df['systolic_bp'], 0.8)

    # 2. Grouped Patient Rolling Trend Features
    grouped = df.groupby('patient_id')
    
    for metric in ['heart_rate', 'spo2', 'respiratory_rate']:
        if metric in df.columns:
            # 6-hour rolling delta & means
            df[f'{metric}_change'] = grouped[metric].diff().fillna(0)
            df[f'recent_mean_{metric}'] = grouped[metric].transform(lambda x: x.rolling(6, min_periods=1).mean())

    # 3. Deterioration Target Construct (Documented Rule for Prototype)
    # Target definition: Acute deterioration event = SBP < 90 OR SpO2 < 90 OR RR > 28 OR Shock Index > 1.0
    if 'deterioration_target' not in df.columns:
        df['deterioration_target'] = np.where(
            (df['systolic_bp'] < 90) | (df['spo2'] < 90) | (df['respiratory_rate'] > 28) | (df.get('shock_index', 0) > 1.0),
            1, 0
        )

    return df

if __name__ == "__main__":
    print("Feature Engineering Module Verified.")
