from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(user: UserRegister):
    # TODO: Implement MongoDB insertion and password hashing
    return {"message": "User registered successfully", "user": user.email}

@router.post("/login")
async def login(user: UserLogin):
    # TODO: Implement MongoDB validation and JWT generation
    return {"token": "fake-jwt-token", "message": "Login successful"}
