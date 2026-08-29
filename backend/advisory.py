import random
import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_advisory(source_text: str) -> dict:
    prompt = f"""You are a cybersecurity analyst drafting an official 
government advisory in CERT-In format.

Analyze the text below and respond ONLY with valid JSON in this exact 
structure, no extra text before or after:

{{
  "reference": "GENERATE_LATER",
  "severity": "Low, Medium, High, or Critical",
  "subject": "short title of the issue",
  "summary": "2-3 sentence summary of the issue",
  "affected_parties": "who is impacted",
  "impact": "what could happen if not addressed",
  "recommended_actions": ["action 1", "action 2", "action 3"]
}}

Source text: {source_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw_output = response.choices[0].message.content
    advisory_data = json.loads(raw_output)
    advisory_data["reference"] = f"ADV-2026-{random.randint(1000, 9999)}"
    return advisory_data

    def generate_secondary_output(source_text: str, output_type: str) -> str:
    if output_type == "linkedin":
        prompt = f"""Write a professional LinkedIn post based on the 
following content. Keep it under 150 words, engaging, and suitable 
for a government/security communications account. No hashtags spam, 
max 3 relevant hashtags at the end.

Content: {source_text}"""

    elif output_type == "exec_summary":
        prompt = f"""Write a concise executive summary based on the 
following content. 3-4 sentences, formal tone, suitable for senior 
leadership briefing. Focus on what happened, impact, and what's being done.

Content: {source_text}"""

    else:
        raise ValueError("Invalid output type")

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    return response.choices[0].message.content