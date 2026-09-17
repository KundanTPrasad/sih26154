import os
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlmodel import Session, select
from auth import engine, User, Upload, AnalysisResult, hash_password, verify_password, create_access_token
from advisory import generate_advisory, generate_secondary_output, generate_action_plan
from file_processor import process_file, validate_file

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    for url in frontend_url.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "SIH26154 backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


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

class SecondaryOutputRequest(BaseModel):
    source_text: str
    output_type: str

@app.post("/generate-secondary")
def create_secondary_output(data: SecondaryOutputRequest):
    try:
        result = generate_secondary_output(data.source_text, data.output_type)
        return {"output_type": data.output_type, "content": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# NEW: File Upload & AI Analysis Endpoints
# ============================================================

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload an image or PDF, extract text using AI/PyMuPDF,
    store the upload record in the database, and return the
    extracted text for the user to review before analysis.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        file_bytes = await file.read()

        # Validate first
        validate_file(file.filename, len(file_bytes))

        # Process: extract text
        result = process_file(file.filename, file_bytes)

        # Store upload record in DB
        with Session(engine) as session:
            upload = Upload(
                filename=result["filename"],
                file_type=result["file_type"],
                file_size=result["file_size"],
                page_count=result["page_count"],
                extracted_text=result["extracted_text"],
            )
            session.add(upload)
            session.commit()
            session.refresh(upload)

            return {
                "upload_id": upload.id,
                "filename": upload.filename,
                "file_type": upload.file_type,
                "file_size": upload.file_size,
                "page_count": upload.page_count,
                "extracted_text": upload.extracted_text,
            }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


class AnalyzeRequest(BaseModel):
    source_text: str
    output_types: List[str]   # e.g. ["advisory", "linkedin", "exec_summary", "action_plan"]
    upload_id: Optional[int] = None


@app.post("/analyze")
def analyze(data: AnalyzeRequest):
    """
    Generate all requested output types from the source text.
    Stores each result in the analysis_results table.
    """
    if not data.source_text.strip():
        raise HTTPException(status_code=400, detail="Source text cannot be empty")

    valid_types = {"advisory", "linkedin", "exec_summary", "action_plan"}
    invalid = set(data.output_types) - valid_types
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid output types: {', '.join(invalid)}. Valid: {', '.join(valid_types)}"
        )

    results = {}
    errors = {}

    for output_type in data.output_types:
        try:
            if output_type == "advisory":
                output = generate_advisory(data.source_text)
                content = json.dumps(output)
                severity = output.get("severity")
            elif output_type == "action_plan":
                output = generate_action_plan(data.source_text)
                content = json.dumps(output)
                severity = output.get("priority")
            elif output_type in ("linkedin", "exec_summary"):
                output = generate_secondary_output(data.source_text, output_type)
                content = output
                severity = None
            else:
                continue

            # Store in DB
            with Session(engine) as session:
                record = AnalysisResult(
                    upload_id=data.upload_id,
                    source_text=data.source_text[:500],  # store first 500 chars as reference
                    output_type=output_type,
                    content=content,
                    severity=severity,
                )
                session.add(record)
                session.commit()
                session.refresh(record)

            results[output_type] = {
                "id": record.id,
                "content": output,  # parsed object for advisory/action_plan, string for others
            }

        except Exception as e:
            errors[output_type] = str(e)

    if not results and errors:
        raise HTTPException(
            status_code=500,
            detail=f"All generation failed: {json.dumps(errors)}"
        )

    return {
        "results": results,
        "errors": errors if errors else None,
        "upload_id": data.upload_id,
    }


@app.get("/analysis-history")
def get_analysis_history(limit: int = Query(default=20, le=50)):
    """Fetch recent analysis results from the database."""
    with Session(engine) as session:
        results = session.exec(
            select(AnalysisResult)
            .order_by(AnalysisResult.created_at.desc())
            .limit(limit)
        ).all()

        # Group results by upload_id / source_text
        history = []
        seen_groups = {}

        for r in results:
            group_key = r.upload_id or r.source_text[:100]
            if group_key not in seen_groups:
                seen_groups[group_key] = {
                    "id": r.id,
                    "upload_id": r.upload_id,
                    "source_text_preview": r.source_text[:120] if r.source_text else "",
                    "created_at": r.created_at.isoformat(),
                    "outputs": {},
                }
                history.append(seen_groups[group_key])

            # Parse JSON content for structured types
            if r.output_type in ("advisory", "action_plan"):
                try:
                    parsed = json.loads(r.content)
                except (json.JSONDecodeError, TypeError):
                    parsed = r.content
            else:
                parsed = r.content

            seen_groups[group_key]["outputs"][r.output_type] = {
                "id": r.id,
                "content": parsed,
                "severity": r.severity,
            }

        return history


@app.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: int):
    """Delete an analysis result."""
    with Session(engine) as session:
        result = session.get(AnalysisResult, analysis_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis not found")
        session.delete(result)
        session.commit()
        return {"message": "Deleted successfully"}