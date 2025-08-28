import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Simple AI configuration - OpenAI only
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_MODEL = "gpt-5-mini"
MAX_TOKENS = 4000
