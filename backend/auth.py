from datetime import datetime, timedelta
import os

from dotenv import load_dotenv
from sqlmodel import SQLModel, Field, create_engine, Session, select
from passlib.context import CryptContext
from jose import jwt

load_dotenv()

# Supabase PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in the .env file")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)


class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Create tables in Supabase PostgreSQL
SQLModel.metadata.create_all(engine)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in the .env file")

ALGORITHM = "HS256"


def create_access_token(
    data: dict,
    expires_minutes: int = 60
):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        JWT_SECRET,
        algorithm=ALGORITHM
    )