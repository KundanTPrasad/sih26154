from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select
from auth import engine, User, hash_password, verify_password, create_access_token
from advisory import generate_advisory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "SIH26154 backend is running"}


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


@app.post("/signup")
def signup(data: SignupRequest):
    with Session(engine) as session:
        existing_user = session.exec(select(User).where(User.email == data.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        new_user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password)
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "Signup successful", "user_id": new_user.id}


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/login")
def login(data: LoginRequest):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == data.email)).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token({"sub": user.email, "user_id": user.id})
        return {"message": "Login successful", "access_token": token}


class AdvisoryRequest(BaseModel):
    source_text: str


@app.post("/generate-advisory")
def create_advisory(data: AdvisoryRequest):
    try:
        advisory = generate_advisory(data.source_text)
        return advisory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))