from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas
from ..services.risk_engine import calculate_deterioration_risk, MODEL_VERSION

router = APIRouter(prefix="/api", tags=["Simulation"])

@router.post("/simulate", response_model=schemas.SimulationResponse)
def run_simulation(sim_input: schemas.SimulationRequest, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, sim_input.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {sim_input.patient_id} not found.")

    latest_vital = crud.get_latest_vital(db, sim_input.patient_id)
    if not latest_vital:
        raise HTTPException(status_code=409, detail=f"Patient {sim_input.patient_id} has no recorded vital signs.")

    current_vitals_dict = {
        "heart_rate": latest_vital.heart_rate,
        "systolic_bp": latest_vital.systolic_bp,
        "diastolic_bp": latest_vital.diastolic_bp,
        "spo2": latest_vital.spo2,
        "respiratory_rate": latest_vital.respiratory_rate,
        "temperature": latest_vital.temperature
    }

    curr_score, curr_level, _ = calculate_deterioration_risk(current_vitals_dict, patient.age)

    sim_vitals_dict = {
        "heart_rate": sim_input.heart_rate,
        "systolic_bp": sim_input.systolic_bp,
        "diastolic_bp": sim_input.diastolic_bp,
        "spo2": sim_input.spo2,
        "respiratory_rate": sim_input.respiratory_rate,
        "temperature": sim_input.temperature
    }

    sim_score, sim_level, _ = calculate_deterioration_risk(sim_vitals_dict, patient.age)
    risk_delta = round(sim_score - curr_score, 2)

    return schemas.SimulationResponse(
        patient_id=sim_input.patient_id,
        current_state={
            "risk_score": curr_score,
            "risk_level": curr_level,
            "vitals": current_vitals_dict
        },
        simulated_state={
            "risk_score": sim_score,
            "risk_level": sim_level,
            "vitals": sim_vitals_dict
        },
        risk_delta=risk_delta,
        model_version=MODEL_VERSION,
        simulation_disclaimer="Simulation represents model output under modified input assumptions and does not represent a clinical prediction or treatment recommendation."
    )
