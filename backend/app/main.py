from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .routers import auth, interview, resume
from .database import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title="AI Interview Simulator API", lifespan=lifespan)

# Configure CORS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
allow_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
if "*" in allow_origins:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Interview Simulator API"}
