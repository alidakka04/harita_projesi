import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# PostgreSQL Docker-compose bilgilerine gore guncellendi
# Eger .env dosyasinda veya sunucuda DATABASE_URL varsa onu kullanir, yoksa localhost'u dener.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://harita_user:harita_pass@localhost:5432/harita_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
