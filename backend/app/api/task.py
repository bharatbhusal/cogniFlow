from fastapi import APIRouter

router = APIRouter()

@router.get("")
def list_tasks():
    return []

@router.post("")
def create_task():
    return {"msg": "Task created"}

@router.get("/{id}")
def get_task(id: int):
    return {"id": id}

@router.put("/{id}")
def update_task(id: int):
    return {"msg": "Task updated"}

@router.delete("/{id}")
def delete_task(id: int):
    return {"msg": "Task deleted"}
