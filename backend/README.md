# Konnect RAG Chatbot Backend

This folder contains a FastAPI backend implementing a minimal RAG pipeline using OpenAI and a scikit-learn fallback vector store.

Setup

1. Create a virtualenv and install requirements:

```
cd backend
python -m venv .venv
.venv\Scripts\activate  # PowerShell: . .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Set environment variables (see .env.example):

- OPENAI_API_KEY
- DATABASE_URL (optional)
- VECTOR_DB_PATH (optional)

3. Run the app:

```
uvicorn app.main:app --reload --port 8001
```

Notes

- FAISS is not included by default for Windows installs. The backend will use a scikit-learn/Numpy fallback to perform nearest-neighbor search.
