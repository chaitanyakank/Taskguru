from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from services.firebase_service import db
from services.email_service import send_email
import uuid
from google.cloud.firestore import FieldFilter  # Added import

router = APIRouter(tags=["Tasks"])

# ----------------------------
# MODELS
# ----------------------------
class TaskCreate(BaseModel):
    title: str
    description: str = None
    due_date: str = None
    priority: str = "normal"
    user_email: str


class SubtaskCreate(BaseModel):
    title: str
    parent_task_id: str


class UpdateTask(BaseModel):
    title: str = None
    description: str = None
    priority: str = None
    due_date: str = None
    done: bool = None


class UpdateSubtask(BaseModel):
    title: str = None
    done: bool = None


# ----------------------------
# CREATE TASK
# ----------------------------
@router.post("/create")
def create_task(task: TaskCreate):
    try:
        task_id = str(uuid.uuid4())
        task_data = {
            "task_id": task_id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "due_date": task.due_date,
            "user_email": task.user_email,
            "done": False,
            "created_at": datetime.utcnow().isoformat(),
            "subtasks": [],
        }

        db.collection("tasks").document(task_id).set(task_data)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "✅ Task created successfully",
                "task_id": task_id,
            },
        )
    except Exception as e:
        print("⚠️ Task creation error:", e)
        raise HTTPException(status_code=500, detail="Failed to create task")


# ----------------------------
# LIST TASKS
# ----------------------------
@router.get("/list")
def list_tasks(email: str | None = None, only_open: bool = False):
    q = db.collection("tasks")
    if email:
        # Fixed: Using FieldFilter with filter= keyword
        q = q.where(filter=FieldFilter("user_email", "==", email))
    if only_open:
        # Fixed: Using FieldFilter with filter= keyword
        q = q.where(filter=FieldFilter("done", "==", False))

    results = []
    for t in q.stream():
        d = t.to_dict()
        d["id"] = t.id
        results.append(d)
    return {"tasks": results}


# ----------------------------
# GET TASK BY ID
# ----------------------------
@router.get("/{task_id}")
def get_task(task_id: str):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    d = doc.to_dict()
    d["id"] = doc.id
    return d


# ----------------------------
# ADD SUBTASK
# ----------------------------
@router.post("/subtask/add")
def add_subtask(subtask: SubtaskCreate):
    task_ref = db.collection("tasks").document(subtask.parent_task_id)
    task = task_ref.get()

    if not task.exists:
        raise HTTPException(status_code=404, detail="Parent task not found")

    sub_id = str(uuid.uuid4())
    new_subtask = {
        "id": sub_id,
        "title": subtask.title,
        "done": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    task_data = task.to_dict()
    subtasks = task_data.get("subtasks", [])
    subtasks.append(new_subtask)
    task_ref.update({"subtasks": subtasks})

    return {"message": "✅ Subtask added successfully", "subtask_id": sub_id}


# ----------------------------
# ✅ TOGGLE (COMPLETE/UNCOMPLETE) SUBTASK
# ----------------------------
@router.put("/subtask/complete/{task_id}/{subtask_id}")
def toggle_subtask(task_id: str, subtask_id: str):
    task_ref = db.collection("tasks").document(task_id)
    doc = task_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    data = doc.to_dict()
    found = False

    print(f"🔍 Toggling subtask {subtask_id} in task {task_id}")
    print(f"📋 Current subtasks: {data.get('subtasks', [])}")

    for sub in data.get("subtasks", []):
        if sub["id"] == subtask_id:
            old_state = sub.get("done", False)
            sub["done"] = not old_state  # ✅ Toggle done state
            sub["updated_at"] = datetime.utcnow().isoformat()
            found = True
            print(f"🔄 Subtask {subtask_id} toggled from {old_state} to {sub['done']}")

    if not found:
        print(f"❌ Subtask {subtask_id} not found")
        raise HTTPException(status_code=404, detail="Subtask not found")

    try:
        task_ref.update({"subtasks": data["subtasks"]})
        print(f"✅ Subtask {subtask_id} updated successfully")
        return {"message": "✅ Subtask updated successfully"}
    except Exception as e:
        print(f"❌ Subtask update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update subtask: {str(e)}")
# ----------------------------
# DELETE SUBTASK (NEW)
# ----------------------------
@router.delete("/subtask/delete/{task_id}/{subtask_id}")
def delete_subtask(task_id: str, subtask_id: str):
    task_ref = db.collection("tasks").document(task_id)
    task_doc = task_ref.get()

    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = task_doc.to_dict()
    subtasks = task_data.get("subtasks", [])

    # filter out the deleted one
    updated_subtasks = [s for s in subtasks if s["id"] != subtask_id]

    if len(updated_subtasks) == len(subtasks):
        raise HTTPException(status_code=404, detail="Subtask not found")

    task_ref.update({"subtasks": updated_subtasks})
    return {"message": "✅ Subtask deleted successfully"}

# ----------------------------
# UPDATE TASK
# ----------------------------
@router.put("/update/{task_id}")
def update_task(task_id: str, data: UpdateTask):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    # Convert to dict and remove None values
    update_data = data.dict(exclude_unset=True)
    
    # Add updated timestamp
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    try:
        doc_ref.update(update_data)
        print(f"✅ Task {task_id} updated with: {update_data}")
        return {"message": "✅ Task updated successfully", "updated_fields": list(update_data.keys())}
    except Exception as e:
        print(f"❌ Task update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")


# ----------------------------
# COMPLETE TASK
# ----------------------------
@router.put("/complete/{task_id}")
def complete_task(task_id: str):
    doc_ref = db.collection("tasks").document(task_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Task not found")

    doc_ref.update({"done": True, "completed_at": datetime.utcnow().isoformat()})
    return {"message": "✅ Task marked as complete"}


# ----------------------------
# DELETE TASK
# ----------------------------
@router.delete("/delete/{task_id}")
def delete_task(task_id: str):
    doc_ref = db.collection("tasks").document(task_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Task not found")

    doc_ref.delete()
    return {"message": "🗑️ Task deleted successfully"}


# ----------------------------
# SHARE TASK
# ----------------------------
@router.post("/share_task/{task_id}")
def share_task(task_id: str, shared_with: dict):
    shared_email = shared_with.get("shared_with")
    if not shared_email:
        raise HTTPException(status_code=400, detail="Missing 'shared_with' email")

    task_ref = db.collection("tasks").document(task_id)
    task_doc = task_ref.get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = task_doc.to_dict()
    pending = task_data.get("pending_requests", [])
    collaborators = task_data.get("collaborators", [])

    if shared_email in pending:
        return {"message": f"{shared_email} already has a pending invite"}
    if shared_email in collaborators:
        return {"message": f"{shared_email} already has access to this task"}

    pending.append(shared_email)
    task_ref.update({"pending_requests": pending})

    share_link = f"http://127.0.0.1:8001/tasks/request_access/{task_id}?email={shared_email}"

    try:
        email_subject = f"📋 You've been invited to collaborate on '{task_data['title']}'"
        email_message = f"""
        <h2>TaskGuru Collaboration Invite</h2>
        <p><b>{task_data['user_email']}</b> invited you to collaborate on <b>{task_data['title']}</b>.</p>
        <a href="{share_link}" target="_blank">Request Access</a>
        """
        send_email(shared_email, email_subject, email_message)
        print(f"✅ Invitation email sent to {shared_email}")

        notif_data = {
            "type": "invite",
            "task_id": task_id,
            "title": task_data.get("title", "Untitled Task"),
            "recipient": shared_email,
            "sender": task_data.get("user_email"),
            "message": f"You've been invited to collaborate on '{task_data['title']}'.",
            "created_at": datetime.utcnow().isoformat(),
            "read": False,
        }
        db.collection("notifications").add(notif_data)

    except Exception as e:
        print(f"⚠️ Email sending failed but task shared: {e}")

    return {"message": f"✅ Invitation sent to {shared_email}."}


# ----------------------------
# REQUEST ACCESS
# ----------------------------
@router.post("/request_access/{task_id}")
def request_task_access(
    task_id: str,
    request_data: dict | None = Body(default=None),
    email: str | None = Query(default=None)
):
    user_email = (request_data or {}).get("user_email") if request_data else None
    user_email = user_email or email
    if not user_email:
        raise HTTPException(status_code=400, detail="Missing user_email")

    user_email = user_email.strip().lower()
    task_ref = db.collection("tasks").document(task_id)
    task_doc = task_ref.get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = task_doc.to_dict()
    title = task_data.get("title", "Untitled Task")
    collaborators = [e.lower() for e in task_data.get("collaborators", [])]
    pending = [e.lower() for e in task_data.get("pending_requests", [])]

    if user_email in collaborators:
        return {"message": "✅ You already have access"}
    if user_email in pending:
        return {"message": "⏳ Request already pending"}

    pending.append(user_email)
    task_ref.update({"pending_requests": pending})

    try:
        owner_email = task_data["user_email"]
        email_subject = f"🔔 Access Request for '{title}'"
        email_message = f"""
        <h3>Task Access Request</h3>
        <p><b>{user_email}</b> requested access to <b>{title}</b>.</p>
        """
        send_email(owner_email, email_subject, email_message)

        notif_data = {
            "type": "access_request",
            "task_id": task_id,
            "title": title,
            "recipient": owner_email,
            "sender": user_email,
            "message": f"{user_email} has requested access to '{title}'.",
            "created_at": datetime.utcnow().isoformat(),
            "read": False,
        }
        db.collection("notifications").add(notif_data)

    except Exception as e:
        print(f"⚠️ Email or notification failed: {e}")

    return {"message": f"📨 Request sent to owner for '{title}'"}


# ----------------------------
# APPROVE ACCESS
# ----------------------------
@router.post("/approve_access/{task_id}")
def approve_task_access(task_id: str, data: dict):
    approver_email = data.get("approver_email")
    user_email = data.get("user_email")
    if not approver_email or not user_email:
        raise HTTPException(status_code=400, detail="Missing emails")

    task_ref = db.collection("tasks").document(task_id)
    task_doc = task_ref.get()
    if not task_doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    task_data = task_doc.to_dict()
    title = task_data.get("title", "Untitled Task")
    collaborators = task_data.get("collaborators", [])
    pending = task_data.get("pending_requests", [])
    owner_email = task_data.get("user_email")

    if approver_email.lower() != owner_email.lower():
        raise HTTPException(status_code=403, detail="Only owner can approve")
    if user_email not in pending:
        raise HTTPException(status_code=400, detail="No pending request")

    pending.remove(user_email)
    collaborators.append(user_email)
    task_ref.update({"pending_requests": pending, "collaborators": collaborators})

    try:
        email_subject = f"✅ Access Granted for '{title}'"
        email_message = f"""
        <h3>Access Approved 🎉</h3>
        <p>{approver_email} approved your access to <b>{title}</b>.</p>
        """
        send_email(user_email, email_subject, email_message)

        notif_data = {
            "type": "access_approved",
            "task_id": task_id,
            "title": title,
            "recipient": user_email,
            "sender": approver_email,
            "message": f"Your access to '{title}' was approved by {approver_email}.",
            "created_at": datetime.utcnow().isoformat(),
            "read": False,
        }
        db.collection("notifications").add(notif_data)

    except Exception as e:
        print(f"⚠️ Approval email/notification failed: {e}")

    return {"message": f"✅ {user_email} approved for '{title}'"}