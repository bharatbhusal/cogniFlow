from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/ask")
def ask_question(question: str):
    # Logic to handle the question
    return {"msg": "Question received", "question": question}
