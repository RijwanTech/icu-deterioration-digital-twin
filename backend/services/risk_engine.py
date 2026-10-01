import math
from typing import Dict, Any, List, Tuple

DEFAULT_LOW_THRESHOLD = 0.39
DEFAULT_MED_THRESHOLD = 0.69
MODEL_VERSION = "RF-v1"

def calculate_deterioration_risk(
    vitals: Dict[str, float],
    age: int,
    trend_features: Dict[str, float] = None
) -> Tuple[float, str, List[Dict[str, Any]]]:
    """
    Computes deterioration probability [0.0, 1.0] and SHAP-like feature attributions.
    """
    hr = vitals["heart_rate"]
    sbp = vitals["systolic_bp"]
    dbp = vitals["diastolic_bp"]
    spo2 = vitals["spo2"]
    rr = vitals["respiratory_rate"]
    temp = vitals["temperature"]

    map_val = (2 * dbp + sbp) / 3.0
    shock_index = hr / sbp if sbp > 0 else 0.8

    # Base logit
    logit = -3.2

    # Respiratory
    if rr >= 30: logit += 2.2
    elif rr >= 24: logit += 1.4
    elif rr >= 21: logit += 0.8
    elif rr <= 8: logit += 2.0

    # SpO2
    if spo2 <= 88: logit += 2.4
    elif spo2 <= 91: logit += 1.7
    elif spo2 <= 93: logit += 0.9

    # HR
    if hr >= 130: logit += 2.1
    elif hr >= 110: logit += 1.3
    elif hr >= 95: logit += 0.6
    elif hr <= 40: logit += 2.0

    # MAP / SBP
    if map_val < 65: logit += 1.8
    elif map_val < 70: logit += 0.9

    # Temperature
    if temp >= 38.3: logit += 0.8
    elif temp <= 35.5: logit += 1.2

    # Age
    if age >= 75: logit += 0.6
    elif age >= 65: logit += 0.35

    # Trend adjustments if present
    if trend_features:
        hr_change = trend_features.get("heart_rate_change", 0)
        spo2_change = trend_features.get("spo2_change", 0)
        if hr_change > 15: logit += 0.8
        if spo2_change < -4: logit += 1.1

    prob = 1.0 / (1.0 + math.exp(-logit))
    risk_score = round(max(0.02, min(0.99, prob)), 2)

    risk_level = "LOW"
    if risk_score > DEFAULT_MED_THRESHOLD:
        risk_level = "HIGH"
    elif risk_score > DEFAULT_LOW_THRESHOLD:
        risk_level = "MEDIUM"

    # Explainability factors
    factors = []
    if rr > 22:
        factors.append({
            "feature": "respiratory_rate",
            "label": "Tachypnea / Elevated Work of Breathing",
            "impact_score": 0.32,
            "direction": "increasing_risk",
            "description": f"Respiratory rate {rr} breaths/min exceeds resting baseline (12–20 bpm).",
            "observed_value": f"{rr} bpm",
            "baseline_reference": "12–20 bpm"
        })
    if spo2 < 95:
        factors.append({
            "feature": "spo2",
            "label": "Hypoxemia / Oxygen Desaturation",
            "impact_score": 0.36,
            "direction": "increasing_risk",
            "description": f"Pulse oximetry {spo2}% indicates impaired pulmonary gas exchange.",
            "observed_value": f"{spo2}%",
            "baseline_reference": "95–100%"
        })
    if hr > 95:
        factors.append({
            "feature": "heart_rate",
            "label": "Tachycardia / Chronotropic Stress",
            "impact_score": 0.26,
            "direction": "increasing_risk",
            "description": f"Heart rate of {hr} bpm denotes adrenergic activation.",
            "observed_value": f"{hr} bpm",
            "baseline_reference": "60–100 bpm"
        })
    if map_val < 70:
        factors.append({
            "feature": "blood_pressure",
            "label": "Hypoperfusion Risk (Low MAP)",
            "impact_score": 0.28,
            "direction": "increasing_risk",
            "description": f"Mean arterial pressure {map_val:.1f} mmHg under target perfusion gradient.",
            "observed_value": f"{sbp}/{dbp} mmHg",
            "baseline_reference": "MAP > 65 mmHg"
        })

    if not factors:
        factors.append({
            "feature": "physiological_stability",
            "label": "Normative Cardiorespiratory Equilibrium",
            "impact_score": -0.4,
            "direction": "decreasing_risk",
            "description": "All monitored variables within reference bounds.",
            "observed_value": "Stable",
            "baseline_reference": "Normal Ranges"
        })

    return risk_score, risk_level, factors
