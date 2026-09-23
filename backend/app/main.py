from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="청년나침반 (Youth Compass) API",
    description="청년 맞춤 정책 탐색 및 AI 추천 백엔드 서비스",
    version="1.0.0"
)

# CORS 설정
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Youth Compass Backend API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# 라우터 등록
from app.routers import policies

app.include_router(policies.router, prefix="/policies", tags=["Policies"])
app.include_router(policies.router, prefix="/api/policies", tags=["Policies (API)"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
