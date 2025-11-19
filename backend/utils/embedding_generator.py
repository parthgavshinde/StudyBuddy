import os
from dotenv import load_dotenv
import openai

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY   # this line activates your key

EMBEDDING_MODEL = "text-embedding-3-small"

def generate_embeddings(texts):
    if not texts:
        return []

    response = openai.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )

    return [item.embedding for item in response.data]
