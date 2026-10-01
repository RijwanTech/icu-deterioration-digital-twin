from fastapi import APIRouter, HTTPException, Depends
from ..schemas import LoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest):
    if not request.username or not request.password:
        raise HTTPException(status_code=400, detail="Username and password are required.")
    
    # Academic prototype credential verification
    return UserResponse(
        user_id=request.username,
        username=request.username,
        role="ICU Clinician",
        token=None
    )
