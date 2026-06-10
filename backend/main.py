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

    print("query" + query)
    file_bytes = await file.read()
    text = extract_text_from_pdf_bytes(file_bytes)

    if not text:
        return {"error": "No text extracted."}

    # 1️⃣ Split into chunks
    chunks = split_text(text, chunk_size=300)

    # 2️⃣ Embed chunks
    chunk_embeddings = generate_embeddings(chunks)

    # 3️⃣ Embed query
    query_embedding = generate_embeddings([query])[0]

    # 4️⃣ Retrieve relevant chunks
    top_chunks, _ = get_top_k_chunks(query_embedding, chunk_embeddings, chunks, k=TOP_K)

    print("chunks: ")
    for i in top_chunks: 
        print(i)
        print("-"*50)

    context = "\n\n---\n\n".join(top_chunks)

    print("context: " + context)

    # 5️⃣ Build prompt
    system_instruction = (
        "You are an expert AI study assistant. Answer the user's query thoroughly and descriptively using ONLY the provided context. "
        "Provide a comprehensive, highly detailed answer. "
        "CRITICAL: You MUST format your answer clearly using Markdown with:\n"
        "- Proper headings (e.g., ### Section Title)\n"
        "- Bullet points for lists and key takeaways\n"
        "- **Bold keywords** to emphasize important concepts and terms.\n"
        "Do not leave the answer short or generic."
    )
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": f"Context:\n{context}\n\nInstruction: {query}"}
    ]

    # 6️⃣ Call Chat API using new syntax
    chat_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=2000,
        temperature=0.2
    )

    # 7️⃣ Correct extraction of content
    answer = chat_resp.choices[0].message.content.strip()

    print(answer)

    return {
        "selected_chunks": top_chunks,
        "answer": answer
    }


@app.post("/generate-flashcards")
async def generate_flashcards(file: UploadFile = File(None), text: str = Form(None)):
    import json
    content = ""
    if file:
        file_bytes = await file.read()
        extracted = extract_text_from_pdf_bytes(file_bytes)
        if extracted:
            content += extracted
    if text:
        content += "\n" + text

    content = content.strip()
    if not content:
        return {"flashcards": []}

    # Limit content length to avoid exceeding context window
    content_slice = content[:25000]

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert educational AI assistant. Your ONLY job is to generate flashcards.\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. Generate between 5 and 10 high-quality flashcards based on the provided text.\n"
                "2. Even if the provided text is very small or brief, you MUST extract whatever concepts are available and creatively extrapolate to generate meaningful flashcards.\n"
                "3. You MUST return ONLY a raw JSON object. Do NOT wrap the JSON in markdown code blocks (e.g., ```json). Do NOT add any conversational text or explanations.\n"
                "4. Follow EXACTLY this JSON structure:\n"
                "{\n"
                '  "flashcards": [\n'
                '    {"question": "Question text here?", "answer": "Answer text here."}\n'
                "  ]\n"
                "}\n"
            )
        },
        {"role": "user", "content": f"Text content to generate flashcards from:\n{content_slice}"}
    ]

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.3
        )
        answer_json = resp.choices[0].message.content.strip()

        # CLEAN JSON
        if answer_json.startswith("```"):
            answer_json = answer_json.replace("```json", "").replace("```", "").strip()

        try:
            import json
            data = json.loads(answer_json)
        except:
            print("FLASHCARD ERROR:", answer_json)
            return {"flashcards": []}

        if "flashcards" not in data:
            return {"flashcards": []}

        return data
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        return {"flashcards": []}


@app.post("/generate-test")
async def generate_test(file: UploadFile = File(...)):
    import json
    file_bytes = await file.read()
    text = extract_text_from_pdf_bytes(file_bytes)

    if not text:
        return {"mcqs": [], "error": "No text extracted"}

    # Step 2: Select important content
    study_target = "important concepts definitions summary key facts examination review"
    chunks = split_text(text, chunk_size=400)
    
    if chunks and len(chunks) > 0:
        try:
            chunk_embeddings = generate_embeddings(chunks)
            query_emb = generate_embeddings([study_target])[0]
            top_chunks, _ = get_top_k_chunks(query_emb, chunk_embeddings, chunks, k=5)
            selected_content = "\n\n".join(top_chunks)
        except Exception as e:
            print("Embedding selection error:", e)
            selected_content = text[:20000]
    else:
        selected_content = text[:20000]

    if not selected_content.strip():
        selected_content = text[:20000]

    # Step 3: Send to OpenAI
    messages = [
        {
            "role": "system",
            "content": (
                "Generate high-quality multiple choice questions (MCQs) from the following text.\n\n"
                "Rules:\n"
                "- Generate exactly 5 MCQs\n"
                "- Each question must have 4 options (A, B, C, D)\n"
                "- Only ONE correct answer\n"
                "- Make questions conceptual, not trivial\n"
                "- Avoid duplicate or vague questions\n\n"
                "Return STRICT JSON ONLY in this format:\n\n"
                "{\n"
                '  "mcqs": [\n'
                "    {\n"
                '      "question": "string",\n'
                '      "options": ["A", "B", "C", "D"],\n'
                '      "correct_answer": "A"\n'
                "    }\n"
                "  ]\n"
                "}"
            )
        },
        {"role": "user", "content": f"Text:\n{selected_content}"}
    ]

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.3
        )
        answer_json = resp.choices[0].message.content.strip()

        # 1. Extract JSON safely
        print("RAW MCQ RESP:", answer_json)
        start = answer_json.find("{")
        end = answer_json.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in response")
        clean_json = answer_json[start:end]
        print("CLEAN MCQ JSON:", clean_json)

        # 2. Parse
        data = json.loads(clean_json)
        if "mcqs" not in data:
            return {"mcqs": [], "error": "Invalid format"}
        return data
    except Exception as e:
        print(f"Error generating test: {e}")
        return {"mcqs": [], "error": str(e)}
