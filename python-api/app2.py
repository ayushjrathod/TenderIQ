import numpy as np
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
import logging
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename=f'semantic_search_{datetime.now().strftime("%Y%m%d")}.log'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI()

# Add CORS middleware configuration right after app initialization
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API configuration
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.1-8b-instant"

class QuestionRequest(BaseModel):
    question: str

class TextProcessor:
    def __init__(self, max_chunk_size=300, embedding_model_name='multi-qa-mpnet-base-dot-v1'):
        self.max_chunk_size = max_chunk_size
        self.embedding_model = SentenceTransformer(embedding_model_name)
        self.chunks = []
        self.embeddings = None

    def chunk_text(self, text: str) -> List[str]:
        """Chunk the text into smaller pieces of max_chunk_size words."""
        words = text.split()
        self.chunks = [' '.join(words[i:i + self.max_chunk_size]) 
                      for i in range(0, len(words), self.max_chunk_size)]
        return self.chunks

    def compute_embeddings(self) -> np.ndarray:
        """Compute embeddings for all chunks with progress tracking."""
        embeddings = []
        total_chunks = len(self.chunks)
        start_time = time.time()
        
        logger.info(f"Starting embedding computation for {total_chunks} chunks")
        
        for i, chunk in enumerate(self.chunks):
            chunk_start_time = time.time()
            
            embedding = self.embedding_model.encode(chunk)
            embeddings.append(embedding)
            
            chunk_end_time = time.time()
            chunk_duration = chunk_end_time - chunk_start_time
            
            # Calculate progress metrics
            elapsed_time = time.time() - start_time
            avg_time_per_chunk = elapsed_time / (i + 1)
            remaining_chunks = total_chunks - (i + 1)
            estimated_remaining_time = avg_time_per_chunk * remaining_chunks
            
            log_message = (
                f"Processed chunk {i + 1}/{total_chunks} "
                f"(Time: {chunk_duration:.2f}s, "
                f"Estimated remaining: {estimated_remaining_time:.2f}s)"
            )
            logger.info(log_message)

        self.embeddings = np.vstack(embeddings)
        
        total_time = time.time() - start_time
        logger.info(f"Embedding computation completed in {total_time:.2f} seconds")
        
        return self.embeddings

    def find_similar_chunks(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Find similar chunks using dot product similarity."""
        query_embedding = self.embedding_model.encode(query)
        
        # Compute dot product similarity
        similarities = np.dot(self.embeddings, query_embedding)
        
        # Get top-k indices and scores
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        return [(self.chunks[idx], similarities[idx]) for idx in top_indices]

def query_groq_api(query: str, similar_chunks: List[Tuple[str, float]]) -> str:
    """Query the Groq API with the question and context."""
    chunks_content = "\n\n".join([
        f"Chunk {i + 1} (Similarity: {score:.4f}):\n{chunk}" 
        for i, (chunk, score) in enumerate(similar_chunks)
    ])
    
    prompt = f"""
    Based on the following context, please provide a detailed answer to this question:

    Question: {query}

    Context:
    {chunks_content}

    Instructions:
    - Provide a clear and concise answer based on the given context
    - If the context doesn't contain enough information, state that clearly
    - Use specific information from the provided chunks when possible
    """

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}]
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error querying Groq API: {str(e)}")
        raise HTTPException(status_code=500, detail="Error querying LLM API")

# Initialize the text processor
processor = TextProcessor()

# Load and process the text file
@app.on_event("startup")
async def startup_event():
    try:
        logger.info("Loading text file...")
        with open("extracted_text.txt", "r", encoding="utf-8") as file:
            text = file.read()
        
        logger.info("Chunking text...")
        processor.chunk_text(text)
        
        logger.info("Computing embeddings...")
        processor.compute_embeddings()
        
        logger.info("Initialization complete")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise

@app.post("/answer")
async def get_answer(request: QuestionRequest):
    try:
        # Find similar chunks
        similar_chunks = processor.find_similar_chunks(request.question)
        
        # Get answer from LLM
        answer = query_groq_api(request.question, similar_chunks)
        
        return {
            "question": request.question,
            "answer": answer,
            "similar_chunks": [
                {"text": chunk, "similarity": float(score)} 
                for chunk, score in similar_chunks
            ]
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
