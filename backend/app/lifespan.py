from contextlib import asynccontextmanager

from fastapi import FastAPI

from db.init_db import init_db
from db.session import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    with SessionLocal() as db:
        init_db(db)
    yield