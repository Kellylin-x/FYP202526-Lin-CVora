from dotenv import load_dotenv
from pathlib import Path
# Load environment variables using explicit path (avoids BOM/CWD issues)
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", encoding="utf-8-sig")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from .api.cv_routes import router as cv_router

app = FastAPI(
    title="CVora - AI-Powered CV Builder API",
    description="Backend API for STEM CV Builder - CT413 Final Year Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server default
        "http://localhost:5174",  # Vite dev server (when 5173 is in use)
        "http://localhost:5175",  # Vite dev server (when 5173/5174 are in use)
        "http://localhost:3000",  # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
        "http://192.168.1.5:5173",
        "http://192.168.1.3:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cv_router)


@app.get("/")
def read_root():
    """Root endpoint - API information"""
    return {
        "message": "Welcome to CVora API",
        "version": "1.0.0",
        "project": "AI-Powered CV Builder for STEM Roles (UK & Ireland)",
        "student": "Yali Lin (Kelly)",
        "student_id": "22721291",
        "programme": "BCT - CT413 Final Year Project",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "cv_upload": "POST /api/cv/upload",
            "cv_enhance": "POST /api/cv/enhance-bullet",
            "job_analyze": "POST /api/cv/job/analyze"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "services": {
            "cv_parser": "operational",
            "ai_service": "operational",
            "ats_analyzer": "operational"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)