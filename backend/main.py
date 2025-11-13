from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.tasks import router as tasks_router
from dotenv import load_dotenv
import os
import sys
from pprint import pprint

# --- New Imports for Task Logic ---
from pydantic import BaseModel, Field
from typing import List
import datetime
# ----------------------------------

load_dotenv()

app = FastAPI(
    title="TaskGuru API",
    version="1.0",
    description="Your productivity assistant 🚀"
)

# ✅ ADDED: CORS Middleware Block for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],           # 👈 allows frontend (localhost:5173) to access
    allow_credentials=True,
    allow_methods=["*"],           # 👈 allows POST, GET, OPTIONS, DELETE, etc.
    allow_headers=["*"],           # 👈 allows custom headers (e.g. JSON)
)

# --- Pydantic Data Models (matches frontend types) ---
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    priority: int = Field(3, ge=1, le=3) # 1: Danger, 2: Warning, 3: Info
    due_date: datetime.date = Field(..., description="Task due date")
    
class Task(TaskCreate):
    id: int
    is_complete: bool = False
    created_at: datetime.datetime

# --- Dependency Placeholder (In a real app, this verifies JWT token from headers) ---
def get_current_user():
    # Placeholder: Always return a dummy user for this example
    return {"user_id": 1, "username": "JohnDoe"}

# --- Placeholder In-Memory Database (Replace with Firestore/MongoDB) ---
tasks_db = []
last_task_id = 0

# ✅ ADDED: Endpoint: Create Task (POST /tasks/)
@app.post("/tasks/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    global last_task_id
    last_task_id += 1
    new_task = Task(
        id=last_task_id,
        created_at=datetime.datetime.now(),
        **task_data.model_dump()
    )
    tasks_db.append(new_task)
    return new_task

# ✅ ADDED: Endpoint: Get All Tasks (GET /tasks/)
@app.get("/tasks/", response_model=List[Task])
async def get_all_tasks(current_user: dict = Depends(get_current_user)):
    return tasks_db

# ✅ ADDED: Endpoint: Update Task (PATCH /tasks/{task_id})
@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, update_data: dict, current_user: dict = Depends(get_current_user)):
    for task in tasks_db:
        if task.id == task_id:
            for key, value in update_data.items():
                if hasattr(task, key):
                    setattr(task, key, value)
            return {"message": f"Task {task_id} updated successfully."}
    raise HTTPException(status_code=404, detail="Task not found")


# ✅ Existing router includes, cleaned up
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])

# ----------------------------
# Debug: Show loaded modules and routers
# ----------------------------
print("\n🧠 DEBUG IMPORT CHECK START 🧠\n")
duplicates = [m for m in sys.modules.keys() if "auth" in m or "router" in m]
print("📦 Imported modules containing 'auth' or 'router':")
pprint(duplicates)

print("\n🚦 Registered Routes:")
for route in app.routes:
    print(f"{route.name:25} --> {route.path}")

print("\n🧠 DEBUG IMPORT CHECK END 🧠\n")

@app.get("/")
def root():
    return {"message": "TaskGuru backend is running 🚀"}