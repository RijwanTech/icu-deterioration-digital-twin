from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    role: Optional[str] = "ICU Clinician"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: str
    token: Optional[str] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class VitalSignBase(BaseModel):
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    spo2: float
    respiratory_rate: float
    temperature: float

class VitalSignCreate(VitalSignBase):
    patient_id: str
    age: int
    timestamp: Optional[datetime] = None

class VitalSignResponse(VitalSignBase):
    record_id: str
    patient_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PatientCurrentState(VitalSignBase):
    blood_pressure: Optional[str] = None

class PatientResponse(BaseModel):
    patient_id: str
    age: int
    gender: str
    bed_number: Optional[str] = None
    unit: Optional[str] = None
    admission_diagnosis: Optional[str] = None
    icu_admission_time: datetime
    current_state: Optional[Dict[str, Any]] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None

    class Config:
        from_attributes = True

class ContributingFactorSchema(BaseModel):
    feature: str
    label: str
    impact_score: float
    direction: str
    description: str
    observed_value: str
    baseline_reference: str

class PredictionResponse(BaseModel):
    patient_id: str
    risk_score: float
    risk_level: str
    model_version: str
    prediction_timestamp: datetime
    contributing_factors: List[ContributingFactorSchema] = []
    clinical_disclaimer: str = "AI-generated risk estimate — for research/demo purposes only."

class SimulationRequest(BaseModel):
    patient_id: str
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    spo2: float
    respiratory_rate: float
    temperature: float

class SimulationResponse(BaseModel):
    patient_id: str
    current_state: Dict[str, Any]
    simulated_state: Dict[str, Any]
    risk_delta: float
    model_version: str
    simulation_disclaimer: str

class DashboardSummaryResponse(BaseModel):
    total_patients: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    active_alerts_count: int
    last_model_run: datetime
    model_status: str
