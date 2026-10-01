from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import crud, schemas
from ..services.risk_engine import calculate_deterioration_risk, MODEL_VERSION

router = APIRouter(prefix="/api", tags=["Predictions"])

@router.get("/patients/{patient_id}/prediction", response_model=schemas.PredictionResponse)
def get_latest_prediction(patient_id: str, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    latest_vital = crud.get_latest_vital(db, patient_id)
    if not latest_vital:
        raise HTTPException(status_code=409, detail=f"Patient {patient_id} has no recorded vital signs.")

    vitals_dict = {
        "heart_rate": latest_vital.heart_rate,
        "systolic_bp": latest_vital.systolic_bp,
        "diastolic_bp": latest_vital.diastolic_bp,
        "spo2": latest_vital.spo2,
        "respiratory_rate": latest_vital.respiratory_rate,
        "temperature": latest_vital.temperature
    }

    risk_score, risk_level, factors = calculate_deterioration_risk(vitals_dict, patient.age)

    return schemas.PredictionResponse(
        patient_id=patient_id,
        risk_score=risk_score,
        risk_level=risk_level,
        model_version=MODEL_VERSION,
        prediction_timestamp=datetime.utcnow(),
        contributing_factors=[schemas.ContributingFactorSchema(**f) for f in factors],
        clinical_disclaimer="AI-generated risk estimate — for research/demo purposes only."
    )

@router.post("/predict", response_model=schemas.PredictionResponse)
def predict_adhoc(vitals: schemas.VitalSignCreate):
    vitals_dict = {
        "heart_rate": vitals.heart_rate,
        "systolic_bp": vitals.systolic_bp,
        "diastolic_bp": vitals.diastolic_bp,
        "spo2": vitals.spo2,
        "respiratory_rate": vitals.respiratory_rate,
        "temperature": vitals.temperature
    }
    risk_score, risk_level, factors = calculate_deterioration_risk(vitals_dict, age=vitals.age)

    return schemas.PredictionResponse(
        patient_id=vitals.patient_id,
        risk_score=risk_score,
        risk_level=risk_level,
        model_version=MODEL_VERSION,
        prediction_timestamp=datetime.utcnow(),
        contributing_factors=[schemas.ContributingFactorSchema(**f) for f in factors],
        clinical_disclaimer="AI-generated risk estimate — for research/demo purposes only."
    )
