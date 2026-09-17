import io
import json
import pymupdf as fitz
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from main import app
from auth import engine, Upload, AnalysisResult
from sqlmodel import Session, select

client = TestClient(app)

def run_test_1():
    print("=== STARTING TEST RUN 1: PDF Extraction -> DB -> Advisory & Action Plan ===")
    
    # 1. Generate an in-memory sample PDF with raw incident/operations data
    doc = fitz.open()
    page = doc.new_page()
    sample_text = (
        "INCIDENT REPORT #IR-2026-09\n"
        "Date: 2026-09-17 | Severity: CRITICAL\n"
        "System: Cloud Database Cluster DB-03\n\n"
        "Event Summary:\n"
        "At 14:22 UTC, primary database node DB-03 experienced high memory exhaustion (98.4%) "
        "causing connection timeouts across payment processing services. 1,420 checkout transactions failed.\n\n"
        "Root Cause:\n"
        "Unindexed query on orders_v2 table triggered full table scans under spike traffic.\n\n"
        "Recommended Mitigation:\n"
        "1. Apply composite index on (merchant_id, created_at).\n"
        "2. Scale connection pool limit from 200 to 500.\n"
        "3. Implement circuit breaker for payment worker pods."
    )
    page.insert_text((50, 72), sample_text, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()

    # 2. Test /upload-file endpoint
    files = {"file": ("incident_report.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/upload-file", files=files)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    upload_data = response.json()
    print("[PASS] Upload successful. Upload ID:", upload_data.get("upload_id"))
    print("[PASS] Extracted text length:", len(upload_data.get("extracted_text", "")))
    assert "INCIDENT REPORT" in upload_data["extracted_text"]

    # 3. Test /analyze with action_plan and advisory
    analyze_payload = {
        "source_text": upload_data["extracted_text"],
        "output_types": ["action_plan", "advisory"],
        "upload_id": upload_data["upload_id"]
    }
    analyze_res = client.post("/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, f"Analyze failed: {analyze_res.text}"
    analysis = analyze_res.json()
    print("[PASS] Analysis generated successfully.")
    assert "action_plan" in analysis["results"]
    assert "advisory" in analysis["results"]
    
    action_plan = analysis["results"]["action_plan"]["content"]
    print("[PASS] Action Plan Priority:", action_plan.get("priority"))
    print("[PASS] Action Plan Steps Count:", len(action_plan.get("steps", [])))

    # 4. Verify DB storage
    with Session(engine) as session:
        up = session.get(Upload, upload_data["upload_id"])
        assert up is not None, "Upload record not found in DB"
        print("[PASS] Verified Upload in DB: id =", up.id, "filename =", up.filename)
        
        results = session.exec(select(AnalysisResult).where(AnalysisResult.upload_id == up.id)).all()
        assert len(results) >= 2, f"Expected at least 2 analysis records, found {len(results)}"
        print("[PASS] Verified AnalysisResults in DB: count =", len(results))

    print("=== TEST RUN 1 PASSED ===\n")


def run_test_2():
    print("=== STARTING TEST RUN 2: Raw Data Processing -> Multi-output (Action Plan, Exec Summary, LinkedIn) & History API ===")
    
    raw_business_data = (
        "Q3 PERFORMANCE AUDIT REPORT - LOGISTICS LOG\n"
        "Fleet Fleet-Alpha: 45 trucks deployed. 12 experienced fuel efficiency drop > 18%.\n"
        "Maintenance logs indicate delayed oil changes and tire pressure misalignment.\n"
        "Cost overruns: $42,000 this quarter.\n"
        "Immediate Action Required: Fleet inspection protocol, route optimization AI deployment, and preventive maintenance contract revision."
    )

    # 1. Test direct /analyze without prior file upload (or with simulated raw text)
    analyze_payload = {
        "source_text": raw_business_data,
        "output_types": ["action_plan", "exec_summary", "linkedin"]
    }
    analyze_res = client.post("/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, f"Analyze failed: {analyze_res.text}"
    analysis = analyze_res.json()
    print("[PASS] Analysis generated successfully for 3 output types.")
    assert "action_plan" in analysis["results"]
    assert "exec_summary" in analysis["results"]
    assert "linkedin" in analysis["results"]
    print("[PASS] Exec Summary Preview:", analysis["results"]["exec_summary"]["content"][:80].encode('ascii', 'ignore').decode(), "...")
    print("[PASS] LinkedIn Post Preview:", analysis["results"]["linkedin"]["content"][:80].encode('ascii', 'ignore').decode(), "...")

    # 2. Test /analysis-history endpoint
    history_res = client.get("/analysis-history?limit=10")
    assert history_res.status_code == 200, f"History fetch failed: {history_res.text}"
    history = history_res.json()
    assert len(history) > 0, "Expected non-empty history"
    print("[PASS] History API returned", len(history), "recent analysis groups")

    print("=== TEST RUN 2 PASSED ===\n")

if __name__ == "__main__":
    run_test_1()
    run_test_2()
    print("SUCCESS: ALL 2 TEST RUNS COMPLETED AND VERIFIED!")
