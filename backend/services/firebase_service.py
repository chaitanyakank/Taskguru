import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime
# 👇 UPDATED IMPORT - using the correct module path
from google.cloud.firestore import FieldFilter, And 

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()

db = None  # global Firestore variable


# ----------------------------
# CONNECT TO FIREBASE
# ----------------------------
def connect_to_firebase():
    """Connect to Firebase and return Firestore DB"""
    global db
    try:
        cred_path = os.getenv("FIREBASE_CRED_PATH")
        if not cred_path or not os.path.exists(cred_path):
            raise FileNotFoundError(f"❌ FIREBASE_CRED_PATH not found or invalid: {cred_path}")

        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        print("✅ Firebase connected successfully!")
        return db

    except Exception as e:
        print(f"❌ Firebase connection failed: {e}")
        db = None
        return None


# Auto connect at import
connect_to_firebase()


# ----------------------------
# USER HELPERS
# ----------------------------
def add_user(uid, data):
    db.collection("users").document(uid).set(data)
    print(f"👤 User added/updated: {uid}")


def get_user_by_email(email):
    """
    Retrieves a user document by their email.
    Updated to use FieldFilter syntax.
    """
    # 👇 UPDATED: Using FieldFilter and the 'filter' keyword argument
    users_ref = db.collection("users").where(
        filter=FieldFilter("email", "==", email)
    ).stream()
    
    for u in users_ref:
        d = u.to_dict()
        d["id"] = u.id
        return d
    return None


# ----------------------------
# TASK HELPERS
# ----------------------------
def add_task(user_id, title, description=None, due_time=None, metadata=None):
    task_doc = {
        "user_id": user_id,
        "title": title,
        "description": description or "",
        "due_time": due_time or None,
        "done": False,
        "metadata": metadata or {},
        "created_at": datetime.utcnow().isoformat()
    }
    doc_ref = db.collection("tasks").document()
    doc_ref.set(task_doc)
    print(f"📝 Task created: {title} for user {user_id}")
    return {"task_id": doc_ref.id, **task_doc}


def get_tasks_for_user(user_id, only_open=True):
    """
    Retrieves tasks for a user, optionally filtering for open tasks.
    Updated to use FieldFilter and And/Or logic.
    """
    # 1. Start with the mandatory filter: user_id
    filters = [
        FieldFilter("user_id", "==", user_id)
    ]

    # 2. Add optional filter for 'only_open'
    if only_open:
        # FieldFilter for done status
        filters.append(FieldFilter("done", "==", False))

    # 3. Combine filters using And() if there are multiple
    if len(filters) > 1:
        q = db.collection("tasks").where(filter=And(filters))
    # 4. Or use the single filter if only one exists
    elif filters:
        q = db.collection("tasks").where(filter=filters[0])
    else:
        # Fallback to base collection if no filters applied (unlikely for this function)
        q = db.collection("tasks")
        
    results = []
    for t in q.stream():
        d = t.to_dict()
        d["id"] = t.id
        results.append(d)
    print(f"📋 Found {len(results)} tasks for user {user_id}")
    return results


def mark_task_done(task_id):
    doc_ref = db.collection("tasks").document(task_id)
    doc = doc_ref.get()
    if not doc.exists:
        print(f"⚠️ Task not found: {task_id}")
        return None
    # Firestore update is atomic, no change needed here
    doc_ref.update({"done": True})
    updated = doc_ref.get().to_dict()
    updated["id"] = doc_ref.id
    print(f"✅ Task marked done: {task_id}")
    return updated