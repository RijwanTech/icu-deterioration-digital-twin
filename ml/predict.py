import joblib
import pandas as pd
import numpy as np

def predict_deterioration(model_path: str, patient_features: dict) -> dict:
    """
    Step 9: Real-time inference from saved model artifact.
    """
    artifact = joblib.load(model_path)
    model = artifact['model']
    features = artifact['features']
    thresholds = artifact.get('thresholds', {'low': 0.39, 'medium': 0.69})

    df_input = pd.DataFrame([patient_features])
    for f in features:
        if f not in df_input.columns:
            df_input[f] = 0.0

    X = df_input[features]
    prob = model.predict_proba(X)[0, 1]
    risk_score = round(float(prob), 2)

    risk_level = "LOW"
    if risk_score > thresholds['medium']:
        risk_level = "HIGH"
    elif risk_score > thresholds['low']:
        risk_level = "MEDIUM"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "model_version": artifact.get("model_version", "RF-v1"),
        "features_evaluated": features,
        "disclaimer": "AI-generated risk estimate — for research/demo purposes only."
    }

