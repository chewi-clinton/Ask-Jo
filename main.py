from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chat import router as chat_router

app = FastAPI(
    title="Ask Jo AI Service",
    description="AI inference service for Ask Jo counselling chatbot",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://api.amino-vault.com", "http://localhost:8900"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/health/")
async def health():
    return {"status": "ok", "service": "ask-jo-ai"}