from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import io
import csv
from datetime import datetime
from ..database import get_db
from .. import crud, schemas
from ..services.digital_twin import DigitalTwinService
from ..services.trend_analysis import TrendAnalysisService

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("", response_model=List[schemas.PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    patients = crud.get_patients(db)
    result = []
    for p in patients:
        latest = crud.get_latest_vital(db, p.patient_id)
        current_state = None
        if latest:
            current_state = {
                "heart_rate": latest.heart_rate,
                "systolic_bp": latest.systolic_bp,
                "diastolic_bp": latest.diastolic_bp,
                "spo2": latest.spo2,
                "respiratory_rate": latest.respiratory_rate,
                "temperature": latest.temperature,
                "blood_pressure": f"{int(latest.systolic_bp)}/{int(latest.diastolic_bp)}"
            }
        result.append(schemas.PatientResponse(
            patient_id=p.patient_id,
            age=p.age,
            gender=p.gender,
            bed_number=p.bed_number,
            unit=p.unit,
            admission_diagnosis=p.admission_diagnosis,
            icu_admission_time=p.icu_admission_time,
            current_state=current_state
        ))
    return result

@router.get("/{patient_id}")
def get_patient_details(patient_id: str, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    vitals = crud.get_patient_vitals(db, patient_id)
    vitals_list = [
        {
            "heart_rate": v.heart_rate,
            "systolic_bp": v.systolic_bp,
            "diastolic_bp": v.diastolic_bp,
            "spo2": v.spo2,
            "respiratory_rate": v.respiratory_rate,
            "temperature": v.temperature,
            "timestamp": v.timestamp.isoformat()
        }
        for v in vitals
    ]
    if not vitals_list:
        raise HTTPException(status_code=409, detail=f"Patient {patient_id} has no recorded vital signs.")

    current_vital = vitals_list[-1]

    twin_state = DigitalTwinService.construct_digital_twin_state(
        {
            "patient_id": patient.patient_id,
            "age": patient.age,
            "gender": patient.gender,
            "icu_admission_time": patient.icu_admission_time.isoformat()
        },
        current_vital,
        vitals_list
    )

    return {
        "patient_id": patient.patient_id,
        "age": patient.age,
        "gender": patient.gender,
        "bed_number": patient.bed_number,
        "unit": patient.unit,
        "admission_diagnosis": patient.admission_diagnosis,
        "icu_admission_time": patient.icu_admission_time.isoformat(),
        "current_state": {
            "heart_rate": current_vital["heart_rate"],
            "spo2": current_vital["spo2"],
            "respiratory_rate": current_vital["respiratory_rate"],
            "temperature": current_vital["temperature"],
            "blood_pressure": f"{int(current_vital['systolic_bp'])}/{int(current_vital['diastolic_bp'])}"
        },
        "digital_twin": twin_state
    }

@router.get("/{patient_id}/vitals", response_model=List[schemas.VitalSignResponse])
def get_vitals(patient_id: str, db: Session = Depends(get_db)):
    return crud.get_patient_vitals(db, patient_id)

@router.get("/{patient_id}/trends")
def get_trends(patient_id: str, db: Session = Depends(get_db)):
    vitals = crud.get_patient_vitals(db, patient_id)
    vitals_dicts = [{"heart_rate": v.heart_rate, "spo2": v.spo2, "respiratory_rate": v.respiratory_rate} for v in vitals]
    summary = TrendAnalysisService.analyze_vitals_trends(vitals_dicts)
    return {
        "patient_id": patient_id,
        "points": vitals,
        "summary": summary
    }

@router.get("/{patient_id}/timeline")
def get_timeline(patient_id: str, db: Session = Depends(get_db)):
    return crud.get_patient_events(db, patient_id)

@router.get("/{patient_id}/export/csv")
def export_patient_csv(patient_id: str, db: Session = Depends(get_db)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    vitals = crud.get_patient_vitals(db, patient_id)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "timestamp", "patient_id", "record_id", "age", "gender", "unit",
        "bed_number", "heart_rate", "systolic_bp", "diastolic_bp", "map",
        "spo2", "respiratory_rate", "temperature"
    ])

    for v in vitals:
        map_val = round((2 * v.diastolic_bp + v.systolic_bp) / 3.0, 1)
        writer.writerow([
            v.timestamp.isoformat(), patient.patient_id, v.record_id, patient.age,
            patient.gender, patient.unit, patient.bed_number, v.heart_rate,
            v.systolic_bp, v.diastolic_bp, map_val, v.spo2, v.respiratory_rate,
            v.temperature
        ])

    csv_data = output.getvalue()
    filename = f"{patient_id}_telemetry_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/csv")
def export_all_cohort_csv(db: Session = Depends(get_db)):
    patients = crud.get_patients(db)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "patient_id", "bed_number", "unit", "age", "gender", "admission_diagnosis",
        "icu_admission_time", "heart_rate", "systolic_bp", "diastolic_bp", "spo2",
        "respiratory_rate", "temperature"
    ])

    for p in patients:
        latest = crud.get_latest_vital(db, p.patient_id)
        writer.writerow([
            p.patient_id, p.bed_number, p.unit, p.age, p.gender, p.admission_diagnosis,
            p.icu_admission_time.isoformat(),
            latest.heart_rate if latest else "",
            latest.systolic_bp if latest else "",
            latest.diastolic_bp if latest else "",
            latest.spo2 if latest else "",
            latest.respiratory_rate if latest else "",
            latest.temperature if latest else ""
        ])

    csv_data = output.getvalue()
    filename = f"icu_cohort_full_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

