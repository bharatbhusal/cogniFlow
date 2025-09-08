from fastapi import APIRouter

router = APIRouter()

@router.get("")
def list_projects():
    return []

@router.post("")
def create_project():
    return {"msg": "Project created"}

@router.get("/{id}")
def get_project(id: int):
    return {"id": id}

@router.put("/{id}")
def update_project(id: int):
    return {"msg": "Project updated"}

@router.delete("/{id}")
def delete_project(id: int):
    return {"msg": "Project deleted"}
