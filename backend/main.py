from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from . import models, crud
from .routers import auth, patients, predictions, simulation

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ICU Deterioration Digital Twin API",
    description="Backend service for AI-Based Early Prediction & Continuous Monitoring of ICU Patient Deterioration",
    version="1.4.2"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(predictions.router)
app.include_router(simulation.router)

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    patients_list = crud.get_patients(db)
    prediction_rows = db.query(models.Prediction).order_by(models.Prediction.timestamp.desc()).all()
    latest_predictions = {}
    for prediction in prediction_rows:
        latest_predictions.setdefault(prediction.patient_id, prediction)

    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for prediction in latest_predictions.values():
        if prediction.risk_level in risk_counts:
            risk_counts[prediction.risk_level] += 1

    latest_run = max((prediction.timestamp for prediction in latest_predictions.values()), default=None)
    return {
        "total_patients": len(patients_list),
        "low_risk_count": risk_counts["LOW"],
        "medium_risk_count": risk_counts["MEDIUM"],
        "high_risk_count": risk_counts["HIGH"],
        "active_alerts_count": 0,
        "last_model_run": latest_run.isoformat() if latest_run else None,
        "model_status": "ACTIVE"
    }

@app.get("/")
def healthcheck():
    return {
        "status": "healthy",
        "service": "ICU Deterioration Digital Twin API",
        "disclaimer": "AI-generated risk estimate — for research/demo purposes only."
    }
