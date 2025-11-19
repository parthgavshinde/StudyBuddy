# main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from utils.PdfTextExtractor import extract_text_from_pdf_bytes
from utils.text_splitter import split_text
from utils.embedding_generator import generate_embeddings
from utils.retriever import get_top_k_chunks

from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Create client (VERY important)
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOP_K = 3


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), query: str = Form(...)):

    file_bytes = await file.read()
    text = extract_text_from_pdf_bytes(file_bytes)

    if not text:
        return {"error": "No text extracted."}

    # 1️⃣ Split into chunks
    chunks = split_text(text, chunk_size=500)

    # 2️⃣ Embed chunks
    chunk_embeddings = generate_embeddings(chunks)

    # 3️⃣ Embed query
    query_embedding = generate_embeddings([query])[0]

    # 4️⃣ Retrieve relevant chunks
    top_chunks, _ = get_top_k_chunks(query_embedding, chunk_embeddings, chunks, k=TOP_K)

    context = "\n\n---\n\n".join(top_chunks)

    # 5️⃣ Build prompt
    messages = [
        {"role": "system", "content": "You summarize text using ONLY the provided context."},
        {"role": "user", "content": f"Context:\n{context}\n\nInstruction: {query}"}
    ]

    # 6️⃣ Call Chat API using new syntax
    chat_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=300,
        temperature=0.2
    )

    # 7️⃣ Correct extraction of content
    answer = chat_resp.choices[0].message.content.strip()

    print(answer)

    return {
        "selected_chunks": top_chunks,
        "answer": answer
    }
