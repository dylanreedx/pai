from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from ollama import chat, ChatResponse
import io
import PyPDF2

app = FastAPI()
MODEL_NAME = "deepseek-r1:7b"


@app.get("/")
def read_root():
    return {"message": "Welcome to the Ollama API!"}


def create_prompt(context: str, question: str) -> str:
    """
    Create a prompt to instruct the LLM to provide a succinct, well-structured,
    and Markdown-formatted answer with a friendly and professional tone.
    """
    base_prompt = (
        "You are a helpful assistant with expertise in computer science. "
        "Please provide a succinct, well-structured, and Markdown-formatted answer. "
        "Maintain a friendly and professional tone throughout your response. "
        "Do not overthink your response, especially initially; no need to think a lot at first.\n\n"
        "Context:\n{context}\n\n"
        "Prompt:\n{question}\n\n"
    )
    return base_prompt.format(
        context=context.strip() if context else "No additional context.",
        question=question.strip(),
    )


def extract_text_from_pdf(contents: bytes) -> str:
    """
    Extract text from a PDF file using PyPDF2.
    """
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        extracted_text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        return extracted_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {e}")


@app.post("/chat")
async def chat_endpoint(message: str = Form(...), file: UploadFile | None = File(None)):
    # If a file is provided, extract its text to use as context.
    context = ""
    if file:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
        contents = await file.read()
        context = extract_text_from_pdf(contents)

    # Create a prompt that combines optional context with the user's question.
    final_prompt = create_prompt(context, message)

    try:
        stream: ChatResponse = chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": final_prompt}],
            stream=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama SDK call failed: {e}")

    def sse_generator():
        for chunk in stream:
            content = chunk["message"]["content"]
            # Skip empty or unwanted markers.
            if not content.strip() or content.strip() in {"<think>", "</think>"}:
                continue
            yield content
            print(content)  # logging

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
