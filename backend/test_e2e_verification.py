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


def run_test_3():
    print("=== STARTING TEST RUN 3: Full 8-Deliverable Batch Transformation Test ===")

    intel_text = (
        "NATIONAL CYBER THREAT ALERT - CRITICAL VULNERABILITY\n"
        "Reference: CERT-IN-2026-ALERT-044\n"
        "A critical Remote Code Execution (RCE) vulnerability (CVE-2026-9921) has been discovered "
        "in government gateway routers running firmware v4.2. Exploitation allows unauthenticated "
        "threat actors to gain root shell access and exfiltrate operational telemetry.\n"
        "Mitigation: Upgrade firmware immediately to v4.2.1-patch, restrict WAN access on port 8443, "
        "and audit system logs for unauthorized IP connections."
    )

    all_outputs = ["advisory", "exec_summary", "action_plan", "linkedin", "twitter", "video", "infographic", "presentation"]

    analyze_payload = {
        "source_text": intel_text,
        "output_types": all_outputs,
        "language": "English",
        "audience_level": "system",
        "tone": "Urgent Alert",
        "detail_level": "Detailed Technical Audit",
        "communication_objective": "Incident Mitigation"
    }


    analyze_res = client.post("/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200, f"8-Deliverable batch analyze failed: {analyze_res.text}"
    results = analyze_res.json()["results"]

    for fmt in all_outputs:
        assert fmt in results, f"Missing deliverable output format: {fmt}"
        print(f"[PASS] Successfully generated deliverable format: '{fmt}'")

    print("=== TEST RUN 3 PASSED ===\n")


def run_test_4():
    print("=== STARTING TEST RUN 4: Phase 3 Cybersecurity PII Sanitization & Blockchain Integrity ===")

    threat_log_with_pii = (
        "CONFIDENTIAL SECURITY LOG - INCIDENT DISCOVERY\n"
        "Incident Contact: officer.verma@security.agency.gov | Phone: +91 98765 43210\n"
        "Internal Gateway: 192.168.1.105 connecting to database cluster at 10.0.4.22\n"
        "Compromised credential found: password=SuperSecretPassword123\n"
        "API Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123\n"
        "Git Token leaked: ghp_9876543210abcdefghij1234567890\n"
        "Attack Pattern: Lateral movement detected exploiting SMBv3 vulnerability on internal network."
    )

    payload = {
        "source_text": threat_log_with_pii,
        "output_types": ["advisory", "action_plan"],
        "language": "English",
        "audience_level": "system",
        "tone": "Formal & Authoritative",
        "detail_level": "Standard Operational Brief",
        "communication_objective": "Incident Mitigation"
    }

    res = client.post("/analyze", json=payload)
    assert res.status_code == 200, f"Analyze failed: {res.text}"
    data = res.json()

    # 1. Verify Cybersecurity Sanitization
    assert "sanitization" in data, "Missing sanitization metadata in response"
    sanitization = data["sanitization"]
    print(f"[PASS] Sanitization Redactions Count: {sanitization.get('redactions_count')}")
    print(f"[PASS] Sanitized Categories: {sanitization.get('redacted_types')}")
    assert sanitization["redactions_count"] >= 4, f"Expected at least 4 redactions, got {sanitization['redactions_count']}"
    assert "Internal Network IP" in sanitization["redacted_types"]
    assert "Credentials/Keys" in sanitization["redacted_types"]
    assert "Personal PII (Email)" in sanitization["redacted_types"]

    # 2. Verify Blockchain Cryptographic Hashes & Ledger Anchor
    results = data["results"]
    advisory_res = results["advisory"]
    assert "content_hash" in advisory_res, "Missing content_hash in advisory result"
    assert "blockchain_tx" in advisory_res, "Missing blockchain_tx in advisory result"
    assert len(advisory_res["content_hash"]) == 64, "content_hash must be a 64-char SHA-256 hex string"
    assert advisory_res["blockchain_tx"].startswith("0x"), "blockchain_tx must start with 0x"
    print(f"[PASS] Generated SHA-256: {advisory_res['content_hash']}")
    print(f"[PASS] Blockchain Anchor Tx: {advisory_res['blockchain_tx']}")

    # 3. Verify /verify-integrity Endpoint (VALID proof)
    verify_payload = {
        "result_id": advisory_res["id"],
        "expected_hash": advisory_res["content_hash"]
    }
    verify_res = client.post("/verify-integrity", json=verify_payload)
    assert verify_res.status_code == 200, f"Verification request failed: {verify_res.text}"
    v_data = verify_res.json()
    print(f"[PASS] Ledger Verification Status: {v_data['status']}")
    print(f"[PASS] Merkle Leaf Integrity Match: {v_data['integrity_match']}")
    print(f"[PASS] Block Height: #{v_data['block_height']}")
    assert v_data["status"] == "VALID"
    assert v_data["integrity_match"] is True

    # 4. Verify /verify-integrity Tamper Detection
    tampered_payload = {
        "content": "MALICIOUSLY TAMPERED ADVISORY TEXT INJECTION",
        "expected_hash": advisory_res["content_hash"]
    }
    tamper_res = client.post("/verify-integrity", json=tampered_payload)
    assert tamper_res.status_code == 200, f"Tamper verification failed: {tamper_res.text}"
    t_data = tamper_res.json()
    print(f"[PASS] Tamper Detection Test Status: {t_data['status']}")
    assert t_data["status"] == "TAMPERED"
    assert t_data["integrity_match"] is False

    print("=== TEST RUN 4 PASSED ===\n")


def run_test_5():
    print("=== STARTING TEST RUN 5: Phase 4 Threat Intel Hallucination Defense & Mission Dossier Export ===")

    # 1. Test /demo-presets endpoint
    presets_res = client.get("/demo-presets")
    assert presets_res.status_code == 200, f"Demo presets failed: {presets_res.text}"
    presets = presets_res.json()
    assert len(presets) == 3, f"Expected 3 demo presets, got {len(presets)}"
    print(f"[PASS] Successfully fetched {len(presets)} curated demo presets for hackathon live judging:")
    for p in presets:
        print(f"       - [{p['id']}] {p['title']} ({p['category']})")

    # 2. Test CVE & MITRE ATT&CK validation in advisory
    from advisory import validate_threat_intel
    sample_advisory = {
        "technical_details": {
            "cve_ids": ["CVE-2026-9921", "cve-2024-1234", "INVALID_CVE_XYZ"],
            "mitre_attack": ["T1059 Command execution", "T1190 Exploit public app"],
            "iocs": ["192.168.1.105", "admin_root"]
        }
    }
    validated = validate_threat_intel(sample_advisory)
    val_meta = validated["technical_details"]["intel_validation"]
    print(f"[PASS] Intel Validation Status: {val_meta['status']}")
    print(f"[PASS] Validated CVEs: {val_meta['verified_cves']}, Flagged: {val_meta['flagged_anomalies']}")
    print(f"[PASS] Hallucination Risk Score: {val_meta['hallucination_risk']}")
    assert val_meta["verified_cves"] == 2
    assert val_meta["flagged_anomalies"] == 1

    # 3. Test /export-mission-dossier endpoint
    dossier_payload = {
        "results": {
            "advisory": {
                "content": {"subject": "Critical Gateway Alert", "severity": "CRITICAL"},
                "content_hash": "5db0deda6325847cd028c56a210e15519adbad1819ffa7f787031e518d977334",
                "blockchain_tx": "0x1d66e54ce081ef2e4693b414c9b20bb8e6d391629b7dc2962013e3e18fd682d5"
            },
            "exec_summary": {
                "content": "Executive Summary of critical router breach.",
                "content_hash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
                "blockchain_tx": "0x9876543210abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            }
        },
        "sanitization": {
            "redactions_count": 4,
            "redacted_types": ["Internal Network IP", "Credentials/Keys"]
        },
        "language": "English",
        "audience_level": "system"
    }

    dossier_res = client.post("/export-mission-dossier", json=dossier_payload)
    assert dossier_res.status_code == 200, f"Dossier export failed: {dossier_res.text}"
    dossier_data = dossier_res.json()
    assert "filename" in dossier_data and dossier_data["filename"].endswith(".md")
    assert "dossier_markdown" in dossier_data
    assert "TRANSVEXA TACTICAL INTELLIGENCE MISSION DOSSIER" in dossier_data["dossier_markdown"]
    assert "BLOCKCHAIN CRYPTOGRAPHIC LEDGER PROOF" in dossier_data["dossier_markdown"]
    print(f"[PASS] Successfully generated Mission Dossier: '{dossier_data['filename']}' ({len(dossier_data['dossier_markdown'])} bytes)")

    print("=== TEST RUN 5 PASSED ===\n")


if __name__ == "__main__":
    run_test_1()
    run_test_2()
    run_test_3()
    run_test_4()
    run_test_5()
    print("SUCCESS: ALL 5 TEST RUNS (PHASES 1, 2, 3, AND 4) COMPLETED AND VERIFIED!")

