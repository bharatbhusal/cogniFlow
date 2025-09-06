from fastapi import APIRouter

router = APIRouter()

@router.post("/analyze")
def analyze():
    return {"result": "AI analysis result"}

@router.get("/results/{id}")
def get_results(id: int):
    return {"id": id, "result": "AI result"}
