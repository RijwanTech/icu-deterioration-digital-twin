from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="ICU Clinician")

class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String, primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    unit = Column(String, default="Medical ICU (MICU)")
    admission_diagnosis = Column(String, nullable=False)
    icu_admission_time = Column(DateTime, default=datetime.datetime.utcnow)

    vital_signs = relationship("VitalSign", back_populates="patient", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="patient", cascade="all, delete-orphan")

class VitalSign(Base):
    __tablename__ = "vital_signs"

    record_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    heart_rate = Column(Float, nullable=False)
    systolic_bp = Column(Float, nullable=False)
    diastolic_bp = Column(Float, nullable=False)
    spo2 = Column(Float, nullable=False)
    respiratory_rate = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)

    patient = relationship("Patient", back_populates="vital_signs")

class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    model_version = Column(String, default="RF-v1")

    patient = relationship("Patient", back_populates="predictions")

class Event(Base):
    __tablename__ = "events"

    event_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    patient = relationship("Patient", back_populates="events")
