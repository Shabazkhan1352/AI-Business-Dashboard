import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# --- Environment Variable Loading (Unchanged) ---
load_dotenv()
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# --- AI Configuration (Unchanged) ---
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print("CRITICAL WARNING: GOOGLE_API_KEY not found in environment variables. AI features will not work.")


# --- REFACTOR: The model finding logic is updated to use the latest correct model name. ---
def find_available_model():
    """Finds the best available Gemini model, using the stable '2.5 flash' version."""
    # Using the latest model name as of late 2025 to avoid '404 Not Found' errors.
    model_name = 'gemini-2.5-flash'
    print(f"✅ Using stable model: {model_name}")
    return model_name


def generate_deep_dive_insights(projects: list, leads: list, employees: list) -> dict:
    """
    Analyzes business data using the Google Gemini Pro model.
    This function will always attempt a live API call.
    """
    if not GOOGLE_API_KEY:
        return {"error": "The Google AI API key is not configured on the server. Please check the .env file."}

    model_name = find_available_model()
    model = genai.GenerativeModel(model_name)

    # The prompt remains unchanged.
    prompt = f"""
    You are a world-class business analyst for a tech consultancy named "Thingslista Automation LLP".
    Your task is to provide a "Deep Dive" analysis based on raw data samples.
    Analyze the following data sets and provide your analysis as a single JSON object.

    DATA:
    - Sample of At-Risk or Delayed Projects: {json.dumps(projects[:5], default=str)}
    - Sample of Recent High-Value Leads: {json.dumps(leads[:5], default=str)}
    - Sample of Employee Performance: {json.dumps(employees[:5], default=str)}

    REQUIRED JSON OUTPUT FORMAT:
    {{
      "executive_summary": "A concise, 1-2 sentence high-level overview of the entire business.",
      "project_analysis": {{ "title": "Project Health Analysis", "observation": "...", "recommendation": "..." }},
      "sales_analysis": {{ "title": "Sales & Lead Funnel Analysis", "observation": "...", "recommendation": "..." }},
      "workforce_analysis": {{ "title": "Workforce & Productivity Analysis", "observation": "...", "recommendation": "..." }}
    }}
    """
    try:
        print(f"🚀 Calling Google AI API ({model_name}) for fresh insights...")
        response = model.generate_content(prompt)
        
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        insights = json.loads(cleaned_response)
        
        print("✅ Successfully received insights from Google AI.")
        return insights

    except Exception as e:
        print(f"🔥 Error calling Google AI API: {e}")
        return {"error": f"Failed to get insights from Google AI. Reason: {str(e)}"}

