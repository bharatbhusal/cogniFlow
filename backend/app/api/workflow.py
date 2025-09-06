from fastapi import APIRouter

router = APIRouter()

@router.get("")
def list_workflows():
    return []

@router.post("")
def create_workflow():
    return {"msg": "Workflow created"}

@router.get("/{id}")
def get_workflow(id: int):
    return {"id": id}

@router.put("/{id}")
def update_workflow(id: int):
    return {"msg": "Workflow updated"}

@router.delete("/{id}")
def delete_workflow(id: int):
    return {"msg": "Workflow deleted"}
