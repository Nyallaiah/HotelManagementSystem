import asyncio
import logging
from typing import Dict, Any, List, Optional
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from backend.config import settings

logger = logging.getLogger("hotel_erp.database")
logging.basicConfig(level=logging.INFO)

class InMemoryAsyncCollection:
    """Async in-memory MongoDB-compatible collection for local testing/fallback."""
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        self.docs.append(doc_copy)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        ids = []
        for doc in documents:
            res = await self.insert_one(doc)
            ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(ids)

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not any(self._matches(doc, cond) for cond in v):
                    return False
            elif k == "$and":
                if not all(self._matches(doc, cond) for cond in v):
                    return False
            elif isinstance(v, dict):
                # Handle operators like $in, $ne, $gte, $lte
                field_val = doc.get(k)
                for op, op_val in v.items():
                    if op == "$in" and field_val not in op_val:
                        return False
                    elif op == "$ne" and field_val == op_val:
                        return False
                    elif op == "$gte" and not (field_val is not None and field_val >= op_val):
                        return False
                    elif op == "$lte" and not (field_val is not None and field_val <= op_val):
                        return False
                    elif op == "$regex":
                        import re
                        pattern = re.compile(op_val, re.IGNORECASE)
                        if not field_val or not pattern.search(str(field_val)):
                            return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for doc in self.docs:
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Dict[str, Any] = None):
        query = query or {}
        matched = [dict(d) for d in self.docs if self._matches(d, query)]

        class AsyncCursor:
            def __init__(self, items):
                self._items = items

            def sort(self, key_or_list, direction=1):
                if isinstance(key_or_list, list):
                    for key, direct in reversed(key_or_list):
                        self._items.sort(key=lambda x: x.get(key, 0) or 0, reverse=(direct == -1))
                elif isinstance(key_or_list, str):
                    self._items.sort(key=lambda x: x.get(key_or_list, 0) or 0, reverse=(direction == -1))
                return self

            def limit(self, n: int):
                self._items = self._items[:n]
                return self

            def skip(self, n: int):
                self._items = self._items[n:]
                return self

            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self._items[:length]
                return self._items

            def __aiter__(self):
                self._iter = iter(self._items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return AsyncCursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        target = None
        for doc in self.docs:
            if self._matches(doc, query):
                target = doc
                break

        class UpdateResult:
            def __init__(self, matched, modified):
                self.matched_count = matched
                self.modified_count = modified

        if target:
            if "$set" in update:
                target.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    target[k] = target.get(k, 0) + v
            if "$push" in update:
                for k, v in update["$push"].items():
                    if k not in target or not isinstance(target[k], list):
                        target[k] = []
                    target[k].append(v)
            return UpdateResult(1, 1)
        elif upsert:
            new_doc = dict(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            await self.insert_one(new_doc)
            return UpdateResult(0, 1)

        return UpdateResult(0, 0)

    async def delete_one(self, query: Dict[str, Any]):
        for idx, doc in enumerate(self.docs):
            if self._matches(doc, query):
                self.docs.pop(idx)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResultZero:
            deleted_count = 0
        return DeleteResultZero()

    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        query = query or {}
        return sum(1 for d in self.docs if self._matches(d, query))

    async def create_index(self, *args, **kwargs):
        return True


class MockAsyncDatabase:
    """Mock MongoDB database routing to in-memory collections."""
    def __init__(self, name: str):
        self.name = name
        self.collections: Dict[str, InMemoryAsyncCollection] = {}

    def __getitem__(self, collection_name: str) -> InMemoryAsyncCollection:
        if collection_name not in self.collections:
            self.collections[collection_name] = InMemoryAsyncCollection(collection_name)
        return self.collections[collection_name]


class DatabaseManager:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db: Any = None
    is_mock: bool = False

    async def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at: {settings.MONGODB_URI}")
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Ping to verify active connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = False
            logger.info(f"Successfully connected to MongoDB Database: [{settings.DATABASE_NAME}]")
            await self._create_indexes()
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(f"Could not connect to external MongoDB ({str(e)}). Activating in-memory mock MongoDB storage engine.")
            self.db = MockAsyncDatabase(settings.DATABASE_NAME)
            self.is_mock = True

    async def _create_indexes(self):
        if not self.is_mock:
            try:
                await self.db.users.create_index("email", unique=True)
                await self.db.rooms.create_index("room_number", unique=True)
                await self.db.bookings.create_index("booking_reference", unique=True)
                await self.db.bookings.create_index([("check_in", 1), ("check_out", 1)])
                await self.db.orders.create_index("order_id", unique=True)
            except Exception as ex:
                logger.warning(f"Index creation warning: {ex}")

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB client closed.")

db_manager = DatabaseManager()

def get_database():
    return db_manager.db

def serialize_mongo(doc):
    """Recursively converts MongoDB ObjectId and documents to JSON-serializable dictionaries."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_mongo(item) for item in doc]
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if k == "_id":
                res["id"] = str(v)
            elif v.__class__.__name__ == "ObjectId":
                res[k] = str(v)
            elif isinstance(v, (dict, list)):
                res[k] = serialize_mongo(v)
            else:
                res[k] = v
        return res
    return doc
