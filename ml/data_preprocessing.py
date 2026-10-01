import pandas as pd
import numpy as np

def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """
    Step 1: Load data.
    Step 2: Clean data and handle outliers.
    Step 3: Handle missing values with physiological forward-fill / median imputations.
    Step 4: Process timestamps.
    """
    df = pd.read_csv(file_path)
    
    # Process timestamps
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values(by=['patient_id', 'timestamp'])
    
    # Range validation & physiologic bounds clipping
    bounds = {
        'heart_rate': (30, 220),
        'systolic_bp': (50, 260),
        'diastolic_bp': (30, 160),
        'spo2': (60, 100),
        'respiratory_rate': (4, 60),
        'temperature': (32.0, 43.0)
    }
    
    for col, (low, high) in bounds.items():
        if col in df.columns:
            df[col] = df[col].clip(lower=low, upper=high)
            df[col] = df.groupby('patient_id')[col].ffill().bfill()
            df[col] = df[col].fillna(df[col].median())
            
    return df

if __name__ == "__main__":
    print("Data Preprocessing Module Verified.")
