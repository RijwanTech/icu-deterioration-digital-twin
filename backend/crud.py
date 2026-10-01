from sqlalchemy.orm import Session
from . import models, schemas
import uuid
import datetime

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).offset(skip).limit(limit).all()

def get_patient(db: Session, patient_id: str):
    return db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()

def get_patient_vitals(db: Session, patient_id: str, limit: int = 24):
    return db.query(models.VitalSign)\
        .filter(models.VitalSign.patient_id == patient_id)\
        .order_by(models.VitalSign.timestamp.asc())\
        .limit(limit).all()

def get_latest_vital(db: Session, patient_id: str):
    return db.query(models.VitalSign)\
        .filter(models.VitalSign.patient_id == patient_id)\
        .order_by(models.VitalSign.timestamp.desc()).first()

def get_patient_events(db: Session, patient_id: str):
    return db.query(models.Event)\
        .filter(models.Event.patient_id == patient_id)\
        .order_by(models.Event.timestamp.desc()).all()

def create_prediction(db: Session, patient_id: str, risk_score: float, risk_level: str, model_version: str):
    db_pred = models.Prediction(
        prediction_id=f"pred_{uuid.uuid4().hex[:8]}",
        patient_id=patient_id,
        timestamp=datetime.datetime.utcnow(),
        risk_score=risk_score,
        risk_level=risk_level,
        model_version=model_version
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred
