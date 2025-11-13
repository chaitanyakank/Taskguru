from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.firebase_service import db
from services.email_service import send_email
from datetime import datetime
import uuid
from google.cloud.firestore import FieldFilter  # Added import

router = APIRouter(tags=["Authentication"])

# ----------------------------
# MODELS
# ----------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ResetPasswordRequest(BaseModel):
    email: str


# ----------------------------
# REGISTER
# ----------------------------
@router.post("/register")
def register_user(data: RegisterRequest):
    email = data.email.strip().lower()
    # Fixed: Using FieldFilter with filter= keyword
    users_ref = db.collection("users").where(filter=FieldFilter("email", "==", email)).stream()
    for _ in users_ref:
        raise HTTPException(status_code=400, detail="User already exists")

    user_id = str(uuid.uuid4())
    user_data = {
        "email": email,
        "password": data.password,
        "created_at": datetime.utcnow().isoformat(),
    }
    db.collection("users").document(user_id).set(user_data)
    return {"message": "✅ User registered successfully", "user_id": user_id}


# ----------------------------
# Login
# ----------------------------
@router.get("/Login")
def Login_user(email: str, password: str):
    email = email.strip().lower()
    # Fixed: Using FieldFilter with filter= keyword for multiple conditions
    users_ref = (
        db.collection("users")
        .where(filter=FieldFilter("email", "==", email))
        .where(filter=FieldFilter("password", "==", password))
        .stream()
    )
    for user in users_ref:
        return {"message": "✅ Login successful", "user_id": user.id}
    raise HTTPException(status_code=401, detail="Invalid credentials")


# ----------------------------
# RESET PASSWORD
# ----------------------------
@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    email = data.email.strip().lower()
    # Fixed: Using FieldFilter with filter= keyword
    users_ref = db.collection("users").where(filter=FieldFilter("email", "==", email)).stream()
    user_exists = any(True for _ in users_ref)

    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    reset_link = f"http://127.0.0.1:5173/reset-password?email={email}"
    subject = "🔑 Reset your TaskGuru password"
    message = f"""
    <h2>Password Reset Request</h2>
    <p>Hello 👋, click below to reset your password:</p>
    <a href="{reset_link}" target="_blank">Reset Password</a>
    """

    try:
        send_email(email, subject, message)
        return {"message": f"✅ Password reset email sent to {email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")


# ----------------------------
# USER INFO
# ----------------------------
@router.get("/user-info")
def get_user_info(email: str = Query(...)):
    email = email.strip().lower()
    # Fixed: Using FieldFilter with filter= keyword
    users_ref = db.collection("users").where(filter=FieldFilter("email", "==", email)).stream()
    for user in users_ref:
        data = user.to_dict()
        data["id"] = user.id
        data["exists"] = True
        return data
    return {"email": email, "exists": False, "message": "User not found"}


# ----------------------------
# NOTIFICATIONS
# ----------------------------
@router.get("/notifications", tags=["Notifications"])
def get_notifications(email: str):
    # Fixed: Using FieldFilter with filter= keyword
    q = (
        db.collection("notifications")
        .where(filter=FieldFilter("recipient", "==", email))
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    notifications = [n.to_dict() | {"id": n.id} for n in q]
    return {"notifications": notifications}