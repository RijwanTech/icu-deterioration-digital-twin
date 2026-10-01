from typing import Dict, Any, List
from .risk_engine import calculate_deterioration_risk, MODEL_VERSION
import datetime

class DigitalTwinService:
    @staticmethod
    def construct_digital_twin_state(
        patient_data: Dict[str, Any],
        current_vital: Dict[str, Any],
        history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Builds the unified Digital Twin virtual representation across
        Profile, Current State, Historical State, Trends, AI State, and Timeline.
        """
        age = patient_data["age"]
        
        # Calculate trends
        hr_change = 0
        spo2_change = 0
        if len(history) > 1:
            hr_change = current_vital["heart_rate"] - history[0]["heart_rate"]
            spo2_change = current_vital["spo2"] - history[0]["spo2"]

        trend_features = {
            "heart_rate_change": hr_change,
            "spo2_change": spo2_change
        }

        risk_score, risk_level, factors = calculate_deterioration_risk(
            current_vital, age, trend_features
        )

        return {
            "patient_profile": {
                "patient_id": patient_data["patient_id"],
                "age": age,
                "gender": patient_data["gender"],
                "icu_admission_time": patient_data["icu_admission_time"]
            },
            "current_state": current_vital,
            "trends": {
                "heart_rate_change": hr_change,
                "spo2_change": spo2_change,
                "status": "Deteriorating" if risk_level == "HIGH" else "Stable"
            },
            "ai_state": {
                "risk_score": risk_score,
                "risk_level": risk_level,
                "model_version": MODEL_VERSION,
                "prediction_timestamp": datetime.datetime.utcnow().isoformat(),
                "contributing_factors": factors,
                "disclaimer": "AI-generated risk estimate — for research/demo purposes only."
            },
            "status": "ACTIVE"
        }
