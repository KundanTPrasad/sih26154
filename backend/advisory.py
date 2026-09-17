import random
import os
import json
import re
from groq import Groq
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _clean_json_response(raw_text: str) -> str:
    """Extract valid JSON substring if model includes markdown wrappers or extra text."""
    raw_text = raw_text.strip()
    match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    if match:
        return match.group(0)
    return raw_text

def generate_advisory(source_text: str, language: str = "English", audience_level: str = "organization") -> dict:
    level_instruction = ""
    if audience_level == "system":
        level_instruction = """AUDIENCE: Technical Operations & SOC Command. Include technical IOCs, CVE references, MITRE ATT&CK mapping, and system-level remediation steps.
JSON structure to return:
{
  "reference": "GENERATE_LATER",
  "severity": "Low, Medium, High, or Critical",
  "subject": "technical subject title",
  "summary": "technical summary of vulnerability or threat vector",
  "affected_parties": "affected systems, protocols, endpoints, infrastructure",
  "impact": "technical impact (RCE, privilege escalation, data exfiltration, etc.)",
  "recommended_actions": ["technical action 1", "technical action 2", "technical action 3"],
  "technical_details": {
    "cve_ids": ["CVE-2026-XXXX"],
    "mitre_attack": ["T1059 Command execution", "T1190 Exploit public app"],
    "iocs": ["IP / Domain / Hash indicator 1", "Indicator 2"],
    "affected_ports": "Ports / Services involved"
  }
}"""
    elif audience_level == "people":
        level_instruction = """AUDIENCE: General Public & Citizens. Use non-technical, easy to understand language. Include clear Do's and Don'ts and safety guidelines.
JSON structure to return:
{
  "reference": "GENERATE_LATER",
  "severity": "Low, Medium, High, or Critical",
  "subject": "simple public warning title",
  "summary": "clear 2-3 sentence explanation without technical jargon",
  "affected_parties": "general public, smartphone users, bank customers, etc.",
  "impact": "simple explanation of risks (financial loss, scam, data privacy)",
  "recommended_actions": ["simple safety step 1", "simple safety step 2", "simple safety step 3"],
  "citizen_guidelines": {
    "dos": ["Do step 1", "Do step 2"],
    "donts": ["Don't step 1", "Don't step 2"],
    "reporting_helpline": "1930 Cyber Fraud Helpline / Official Portal"
  }
}"""
    else:
        # organization (default)
        level_instruction = """AUDIENCE: Executives, CISOs, IT Management, & State Agencies. Focus on strategic impact, compliance risk, and organizational action plans.
JSON structure to return:
{
  "reference": "GENERATE_LATER",
  "severity": "Low, Medium, High, or Critical",
  "subject": "executive title of the advisory",
  "summary": "concise executive briefing",
  "affected_parties": "impacted business units, state services, organizational data",
  "impact": "operational, legal, compliance, and financial risk assessment",
  "recommended_actions": ["strategic action 1", "strategic action 2", "strategic action 3"],
  "executive_breakdown": {
    "compliance_risk": "compliance & regulatory risk evaluation",
    "resource_impact": "budget & manpower requirements",
    "urgency": "Immediate / 24-48 Hours / Short-term"
  }
}"""

    prompt = f"""You are a senior cyber advisory intelligence officer.

{level_instruction}

CRITICAL LANGUAGE REQUIREMENT:
All textual values (subjects, summaries, actions, impacts, details, guidelines) MUST be written in {language} language.
JSON keys MUST remain strictly in English.

Source text: {source_text}

Respond ONLY with the JSON object.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw_output = _clean_json_response(response.choices[0].message.content)
    try:
        advisory_data = json.loads(raw_output)
    except json.JSONDecodeError:
        # Fallback dictionary if model output failed strict JSON parsing
        advisory_data = {
            "reference": "ADV-2026-0000",
            "severity": "High",
            "subject": f"Security Advisory ({language})",
            "summary": raw_output[:300],
            "affected_parties": "All Users",
            "impact": "Security Risk",
            "recommended_actions": ["Review source document details"],
        }
    advisory_data["reference"] = f"ADV-2026-{random.randint(1000, 9999)}"
    return advisory_data


def generate_secondary_output(source_text: str, output_type: str, language: str = "English", audience_level: str = "organization") -> str:
    if output_type == "linkedin":
        prompt = f"""Write a professional LinkedIn post based on the content below.
Audience level: {audience_level.title()}.
Keep it under 150 words, engaging, and suitable for official communications. Maximum 3 relevant hashtags at the end.
CRITICAL LANGUAGE REQUIREMENT: Write the entire post strictly in {language} language.

Content: {source_text}"""

    elif output_type == "exec_summary":
        prompt = f"""Write a concise executive briefing based on the content below.
Audience level: {audience_level.title()}.
3-4 sentences, formal tone, suitable for leadership briefings. Focus on impact, strategic risks, and key outcomes.
CRITICAL LANGUAGE REQUIREMENT: Write the entire summary strictly in {language} language.

Content: {source_text}"""

    else:
        raise ValueError("Invalid output type")

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    return response.choices[0].message.content


def generate_action_plan(source_text: str, language: str = "English", audience_level: str = "organization") -> dict:
    """Generate a structured incident response / action plan tailored by language and audience level."""
    prompt = f"""You are a security incident response planner drafting an action plan for {audience_level.title()} audience.

Respond ONLY with valid JSON in this structure:
{{
  "title": "short action plan title",
  "priority": "Critical, High, Medium, or Low",
  "immediate_actions": [
    {{"action": "description", "responsible": "team/role", "deadline": "timeframe"}}
  ],
  "short_term_actions": [
    {{"action": "description", "responsible": "team/role", "deadline": "timeframe"}}
  ],
  "long_term_actions": [
    {{"action": "description", "responsible": "team/role", "deadline": "timeframe"}}
  ],
  "resources_needed": ["resource 1", "resource 2"],
  "estimated_timeline": "overall timeline estimate",
  "risk_if_not_addressed": "what happens if no action is taken"
}}

CRITICAL LANGUAGE REQUIREMENT: All textual field values MUST be written in {language} language. Keep JSON keys strictly in English.

Source text: {source_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw_output = _clean_json_response(response.choices[0].message.content)
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        return {
            "title": f"Action Plan ({language})",
            "priority": "High",
            "immediate_actions": [{"action": "Verify incident details", "responsible": "Incident Response Team", "deadline": "Immediate"}],
            "short_term_actions": [],
            "long_term_actions": [],
            "resources_needed": ["Security Audit Tools"],
            "estimated_timeline": "24-48 hours",
            "risk_if_not_addressed": "Potential security breach escalation",
        }