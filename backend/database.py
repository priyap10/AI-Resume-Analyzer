
import os
from datetime import datetime, timezone
from pymongo import MongoClient, DESCENDING
from bson import ObjectId

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "resume_analyzer")
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _db = _client[db_name]
    return _db


def save_analysis(record: dict) -> str:
    db = get_db()
    record["created_at"] = datetime.now(timezone.utc)
    result = db.analyses.insert_one(record)
    return str(result.inserted_id)


def get_history(limit: int = 20) -> list:
    db = get_db()
    docs = db.analyses.find().sort("created_at", DESCENDING).limit(limit)
    out = []
    for d in docs:
        d["_id"] = str(d["_id"])
        out.append(d)
    return out


def get_analysis_by_id(analysis_id: str) -> dict | None:
    db = get_db()
    doc = db.analyses.find_one({"_id": ObjectId(analysis_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc
