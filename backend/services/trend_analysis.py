from typing import List, Dict, Any

class TrendAnalysisService:
    @staticmethod
    def analyze_vitals_trends(vitals_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not vitals_history or len(vitals_history) < 2:
            return {
                "heart_rate_trend": "Stable",
                "spo2_trend": "Stable",
                "respiratory_rate_trend": "Stable",
                "blood_pressure_trend": "Stable",
                "stability_summary": "Insufficient temporal observations"
            }

        first = vitals_history[0]
        last = vitals_history[-1]

        hr_delta = last.get("heart_rate", 0) - first.get("heart_rate", 0)
        spo2_delta = last.get("spo2", 0) - first.get("spo2", 0)
        rr_delta = last.get("respiratory_rate", 0) - first.get("respiratory_rate", 0)

        return {
            "heart_rate_trend": "Increasing" if hr_delta > 5 else ("Decreasing" if hr_delta < -5 else "Stable"),
            "heart_rate_delta": hr_delta,
            "spo2_trend": "Decreasing" if spo2_delta < -2 else ("Increasing" if spo2_delta > 2 else "Stable"),
            "spo2_delta": spo2_delta,
            "respiratory_rate_trend": "Increasing" if rr_delta > 3 else ("Decreasing" if rr_delta < -3 else "Stable"),
            "respiratory_rate_delta": rr_delta,
            "observations_count": len(vitals_history)
        }
