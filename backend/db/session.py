import os
import logging
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/aidock")

db_logger = logging.getLogger("aidock.db_audit")

engine = create_async_engine(DATABASE_URL, echo=False)

@event.listens_for(engine.sync_engine, "begin")
def log_begin(conn):
    db_logger.info("AUDIT: DB Transaction - BEGIN")

@event.listens_for(engine.sync_engine, "commit")
def log_commit(conn):
    db_logger.info("AUDIT: DB Transaction - COMMIT (Success)")

@event.listens_for(engine.sync_engine, "rollback")
def log_rollback(conn):
    db_logger.warning("AUDIT: DB Transaction - ROLLBACK (Failed/Aborted)")

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    # Setup vector extension if needed
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # In a real app we would call base.metadata.create_all(conn) here
