import logging
from typing import Any, Dict, List
from sqlalchemy import text, select, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from backend.db.session import AsyncSessionLocal
from pgvector.sqlalchemy import Vector

logger = logging.getLogger(__name__)
Base = declarative_base()

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    source_path = Column(String, index=True)
    content = Column(String)
    embedding = Column(Vector(1536)) # Example dimension, adjust based on model
    metadata_json = Column(String)

class PostgresVectorStore:
    """
    Vector store implementation using PostgreSQL and pgvector.
    Adapted from AI_Codex for semantic workspace memory.
    """
    def __init__(self, collection_name: str = "aidock_vectors", embedding_dim: int = 1536):
        self.collection_name = collection_name
        self.embedding_dim = embedding_dim

    async def add_chunks(self, chunks: List[Any], embeddings: List[List[float]]):
        async with AsyncSessionLocal() as session:
            for chunk, embedding in zip(chunks, embeddings):
                doc_chunk = DocumentChunk(
                    source_path=chunk.source_path,
                    content=chunk.content,
                    embedding=embedding,
                    metadata_json=str(chunk.metadata)
                )
                session.add(doc_chunk)
            await session.commit()
            logger.info(f"Added {len(chunks)} chunks to PostgresVectorStore")

    async def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as session:
            stmt = select(DocumentChunk).order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(top_k)
            result = await session.execute(stmt)
            chunks = result.scalars().all()
            
            return [
                {
                    "chunk_id": str(c.id),
                    "source_path": c.source_path,
                    "content": c.content
                } for c in chunks
            ]
