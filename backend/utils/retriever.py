# utils/retriever.py
import numpy as np

def cosine_similarity(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def get_top_k_chunks(query_embedding, chunk_embeddings, chunks, k=3):
    """
    Return top-k chunk strings and their similarity scores.
    """
    if not chunk_embeddings or not chunks:
        return [], []

    scores = [cosine_similarity(query_embedding, emb) for emb in chunk_embeddings]
    idxs = np.argsort(scores)[::-1][:k]
    top_chunks = [chunks[i] for i in idxs]
    top_scores = [scores[i] for i in idxs]
    return top_chunks, top_scores
