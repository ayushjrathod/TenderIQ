import os
import time
import json
import tempfile
from typing import Dict, List
from datetime import datetime, timedelta

import pytesseract
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from pdf2image import convert_from_path
from langchain.schema import Document

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

GROQ_API_KEY = "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"

# Configuration
MODEL_NAME = "gemma2-9b-it"
TOKENS_PER_MINUTE = 30000
APPROX_TOKENS_PER_REQUEST = 1000
BATCH_SIZE = TOKENS_PER_MINUTE // APPROX_TOKENS_PER_REQUEST
MIN_PAGE_WORDS = 30

class RateLimiter:
    def __init__(self):
        self.start_time = None
        self.token_count = 0

    def wait_if_needed(self, estimated_tokens):
        if not self.start_time:
            self.start_time = datetime.now()
            return

        if (self.token_count + estimated_tokens) > TOKENS_PER_MINUTE:
            elapsed = (datetime.now() - self.start_time).total_seconds()
            if elapsed < 60:
                sleep_time = 60 - elapsed
                time.sleep(sleep_time)
                self.reset_counter()
            else:
                self.reset_counter()

    def reset_counter(self):
        self.start_time = datetime.now()
        self.token_count = 0

    def add_tokens(self, tokens):
        self.token_count += tokens

def estimate_tokens(text):
    return max(len(text) // 4, 1)

def preprocess_text(text: str) -> str:
    lines = [
        line.strip()
        for line in text.split('\n')
        if line.strip() and not line.strip().isdigit()
    ]
    return '\n'.join(lines)

def is_relevant(text: str) -> bool:
    return len(text.split()) >= MIN_PAGE_WORDS

@app.post("/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        return {"success": False, "error": "Invalid file type - PDF required"}

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Initialize Groq with Mixtral model
        llm = ChatGroq(
            model_name=MODEL_NAME,
            groq_api_key=GROQ_API_KEY,
            temperature=0.2
        )

        # Convert PDF to images with OCR
        images = convert_from_path(tmp_path)
        rate_limiter = RateLimiter()
        page_summaries: Dict[int, str] = {}

        # Process each page with rate control
        total_pages = len(images)
        print(f"Processing {total_pages} pages...")
        
        for page_num, image in enumerate(images, start=1):
            print(f"Page {page_num}/{total_pages}")
            raw_text = pytesseract.image_to_string(image)
            clean_text = preprocess_text(raw_text)
            
            if not is_relevant(clean_text):
                print(f"Skipping page {page_num}")
                continue

            estimated_tokens = estimate_tokens(clean_text) + 500
            rate_limiter.wait_if_needed(estimated_tokens)
            
            print(f"Summarizing page {page_num}")
            page_prompt = PromptTemplate(
                template="""Summarize this tender document page focusing on key points:
                {text}

                CONCISE SUMMARY:""",
                input_variables=["text"]
            )

            docs = [Document(page_content=clean_text)]
            chain = load_summarize_chain(
                llm=llm,
                chain_type="stuff",
                prompt=page_prompt
            )
            
            summary = chain.run(docs)
            page_summaries[page_num] = summary
            rate_limiter.add_tokens(estimated_tokens)
            time.sleep(1.5)

        print("Generating final summary...")
        page_groups = []
        current_group = []
        for num in sorted(page_summaries.keys()):
            current_group.append(f"Page {num}:\n{page_summaries[num]}")
            if len(current_group) >= 3:
                page_groups.append("\n\n".join(current_group))
                current_group = []
        if current_group:
            page_groups.append("\n\n".join(current_group))

        map_prompt = PromptTemplate(
            template="Extract key structured details from these summaries:\n{text}\n\nKEY DETAILS:",
            input_variables=["text"]
        )
        combine_prompt = PromptTemplate(
            template="""Combine these key details into a final structured overview:
            {text}

            Structure your response with:
            - Overall Summary
            - Project Overview
            - Technical Specifications
            - Financial Breakdown
            - Timeline & Deadlines
            - Compliance Requirements""",
            input_variables=["text"]
        )

        final_chain = load_summarize_chain(
            llm=llm,
            chain_type="map_reduce",
            map_prompt=map_prompt,
            combine_prompt=combine_prompt,
            verbose=True
        )

        docs = [Document(page_content=group) for group in page_groups]
        final_summary = final_chain.run(docs)

        # Create summary dictionary
        summary_data = {
            "document_name": file.filename,
            "timestamp": datetime.now().isoformat(),
            "page_summaries": page_summaries,
            "final_summary": final_summary
        }

        # Write to JSON file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(script_dir, "Summary.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, indent=2, ensure_ascii=False)

        # Cleanup
        os.unlink(tmp_path)

        return {
            "success": True,
            "final_summary": final_summary,
            "summary_file": json_path,
            "error": None
        }

    except Exception as e:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return {
            "success": False,
            "error": f"Processing error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
