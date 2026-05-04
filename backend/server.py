from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Literal, Optional, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# ---------- logging ----------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


# ---------- mongo ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ---------- app ----------
app = FastAPI(title="Divr Marketing API")
api_router = APIRouter(prefix="/api")


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- auth helpers ----------
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 8  # 8 hours — single-user admin, longer session is fine


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- health ----------
@api_router.get("/")
async def root():
    return {"service": "divr-marketing", "status": "ok"}


# ---------- auth endpoints ----------
class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class AdminUser(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str


@api_router.post("/auth/login", response_model=AdminUser)
async def auth_login(payload: LoginPayload, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    token = create_access_token(user["id"], email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TTL_MIN * 60,
        path="/",
    )
    return AdminUser(id=user["id"], email=user["email"], name=user["name"], role=user["role"])


@api_router.post("/auth/logout")
async def auth_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me", response_model=AdminUser)
async def auth_me(current=Depends(get_current_admin)):
    return AdminUser(**current)


# ---------- waitlist (Divers) ----------
class WaitlistCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    country: str = Field(min_length=2, max_length=120)
    dive_region: Literal[
        "Red Sea", "Southeast Asia", "Caribbean",
        "Indian Ocean", "Mediterranean", "Other",
    ]


class WaitlistEntry(BaseModel):
    # response model — relaxed validation so legacy rows (no last_name) still serialise
    first_name: str = ""
    last_name: str = ""
    email: EmailStr
    country: str = ""
    dive_region: str = ""
    id: str
    source: Literal["waitlist"]
    created_at: str


@api_router.post("/waitlist", response_model=WaitlistEntry, status_code=201)
async def create_waitlist(payload: WaitlistCreate):
    entry = WaitlistEntry(
        id=str(uuid.uuid4()),
        source="waitlist",
        created_at=now_utc_iso(),
        **payload.model_dump(),
    )
    await db.waitlist_submissions.insert_one(entry.model_dump())
    logger.info("waitlist signup: %s (%s)", entry.email, entry.dive_region)
    return entry


# ---------- operators ----------
class OperatorCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    dive_center_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=1, max_length=200)
    email: EmailStr
    whatsapp: str = Field(min_length=5, max_length=40)
    monthly_bookings: Literal["Under 10", "10 to 30", "30 to 100", "100+"]


class OperatorEntry(BaseModel):
    first_name: str = ""
    last_name: str = ""
    dive_center_name: str = ""
    country: str = ""
    destination: str = ""
    email: EmailStr
    whatsapp: str = ""
    monthly_bookings: str = ""
    id: str
    source: Literal["for-operators"]
    created_at: str


@api_router.post("/operators", response_model=OperatorEntry, status_code=201)
async def create_operator(payload: OperatorCreate):
    entry = OperatorEntry(
        id=str(uuid.uuid4()),
        source="for-operators",
        created_at=now_utc_iso(),
        **payload.model_dump(),
    )
    await db.operator_applications.insert_one(entry.model_dump())
    logger.info("operator application: %s, %s", entry.dive_center_name, entry.email)
    return entry


# ---------- guides ----------
class GuideCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    specialty: Literal[
        "Freediving", "Technical Diving", "Underwater Photography",
        "Marine Biology", "Night Diving", "General Guiding", "Other",
    ]
    country: str = Field(min_length=2, max_length=120)
    base_location: str = Field(min_length=1, max_length=200)
    certifications: str = Field(min_length=1, max_length=2000)
    email: EmailStr
    whatsapp: str = Field(min_length=5, max_length=40)


class GuideEntry(BaseModel):
    first_name: str = ""
    last_name: str = ""
    specialty: str = ""
    country: str = ""
    base_location: str = ""
    certifications: str = ""
    email: EmailStr
    whatsapp: str = ""
    id: str
    source: Literal["for-guides"]
    created_at: str


@api_router.post("/guides", response_model=GuideEntry, status_code=201)
async def create_guide(payload: GuideCreate):
    entry = GuideEntry(
        id=str(uuid.uuid4()),
        source="for-guides",
        created_at=now_utc_iso(),
        **payload.model_dump(),
    )
    await db.guide_applications.insert_one(entry.model_dump())
    logger.info("guide application: %s %s (%s)", entry.first_name, entry.last_name, entry.specialty)
    return entry


# ---------- protected admin listings ----------
@api_router.get("/admin/waitlist", response_model=List[WaitlistEntry])
async def list_waitlist(limit: int = 500, _admin=Depends(get_current_admin)):
    docs = await db.waitlist_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/admin/operators", response_model=List[OperatorEntry])
async def list_operators(limit: int = 500, _admin=Depends(get_current_admin)):
    docs = await db.operator_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/admin/guides", response_model=List[GuideEntry])
async def list_guides(limit: int = 500, _admin=Depends(get_current_admin)):
    docs = await db.guide_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/admin/summary")
async def admin_summary(_admin=Depends(get_current_admin)):
    return {
        "waitlist_count": await db.waitlist_submissions.count_documents({}),
        "operator_count": await db.operator_applications.count_documents({}),
        "guide_count": await db.guide_applications.count_documents({}),
    }


# ---------- update payloads (all optional) ----------
class WaitlistUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[EmailStr] = None
    country: Optional[str] = Field(default=None, min_length=2, max_length=120)
    dive_region: Optional[Literal[
        "Red Sea", "Southeast Asia", "Caribbean",
        "Indian Ocean", "Mediterranean", "Other",
    ]] = None


class OperatorUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    dive_center_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    country: Optional[str] = Field(default=None, min_length=2, max_length=120)
    destination: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    whatsapp: Optional[str] = Field(default=None, min_length=5, max_length=40)
    monthly_bookings: Optional[Literal["Under 10", "10 to 30", "30 to 100", "100+"]] = None


class GuideUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    specialty: Optional[Literal[
        "Freediving", "Technical Diving", "Underwater Photography",
        "Marine Biology", "Night Diving", "General Guiding", "Other",
    ]] = None
    country: Optional[str] = Field(default=None, min_length=2, max_length=120)
    base_location: Optional[str] = Field(default=None, min_length=1, max_length=200)
    certifications: Optional[str] = Field(default=None, min_length=1, max_length=2000)
    email: Optional[EmailStr] = None
    whatsapp: Optional[str] = Field(default=None, min_length=5, max_length=40)


# ---------- generic helper ----------
async def _patch_doc(collection, entry_model, entry_id: str, payload: BaseModel):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await collection.find_one_and_update(
        {"id": entry_id},
        {"$set": update},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry_model(**result)


async def _delete_doc(collection, entry_id: str):
    result = await collection.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True, "id": entry_id}


# ---------- waitlist edit/delete ----------
@api_router.patch("/admin/waitlist/{entry_id}", response_model=WaitlistEntry)
async def update_waitlist(entry_id: str, payload: WaitlistUpdate, _admin=Depends(get_current_admin)):
    return await _patch_doc(db.waitlist_submissions, WaitlistEntry, entry_id, payload)


@api_router.delete("/admin/waitlist/{entry_id}")
async def delete_waitlist(entry_id: str, _admin=Depends(get_current_admin)):
    return await _delete_doc(db.waitlist_submissions, entry_id)


# ---------- operator edit/delete ----------
@api_router.patch("/admin/operators/{entry_id}", response_model=OperatorEntry)
async def update_operator(entry_id: str, payload: OperatorUpdate, _admin=Depends(get_current_admin)):
    return await _patch_doc(db.operator_applications, OperatorEntry, entry_id, payload)


@api_router.delete("/admin/operators/{entry_id}")
async def delete_operator(entry_id: str, _admin=Depends(get_current_admin)):
    return await _delete_doc(db.operator_applications, entry_id)


# ---------- guide edit/delete ----------
@api_router.patch("/admin/guides/{entry_id}", response_model=GuideEntry)
async def update_guide(entry_id: str, payload: GuideUpdate, _admin=Depends(get_current_admin)):
    return await _patch_doc(db.guide_applications, GuideEntry, entry_id, payload)


@api_router.delete("/admin/guides/{entry_id}")
async def delete_guide(entry_id: str, _admin=Depends(get_current_admin)):
    return await _delete_doc(db.guide_applications, entry_id)


# ---------- mount + middleware ----------
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- startup: indexes + admin seed ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)

    # one-shot migration: old operator/guide docs had combined country fields
    async for doc in db.operator_applications.find({"country_destination": {"$exists": True}}):
        raw = str(doc.get("country_destination") or "").strip()
        # split on common separators (em-dash, en-dash, hyphen)
        for sep in (" — ", " – ", " - "):
            if sep in raw:
                country, destination = raw.split(sep, 1)
                break
        else:
            country, destination = raw, raw
        await db.operator_applications.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {"country": country.strip() or "Unknown", "destination": destination.strip() or raw},
                "$unset": {"country_destination": ""},
            },
        )

    async for doc in db.guide_applications.find({"country_base": {"$exists": True}}):
        raw = str(doc.get("country_base") or "").strip()
        for sep in (" — ", " – ", " - "):
            if sep in raw:
                country, base = raw.split(sep, 1)
                break
        else:
            country, base = raw, raw
        await db.guide_applications.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {"country": country.strip() or "Unknown", "base_location": base.strip() or raw},
                "$unset": {"country_base": ""},
            },
        )

    # split legacy `full_name` into first_name + last_name on operators & guides
    for coll in (db.operator_applications, db.guide_applications):
        async for doc in coll.find({"full_name": {"$exists": True}}):
            raw = str(doc.get("full_name") or "").strip()
            parts = raw.split(None, 1)  # split on first whitespace run
            first = parts[0] if parts else ""
            last = parts[1] if len(parts) > 1 else ""
            await coll.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {"first_name": first or "Unknown", "last_name": last or "Unknown"},
                    "$unset": {"full_name": ""},
                },
            )

    # backfill last_name on legacy waitlist rows so admin list/edit always works
    await db.waitlist_submissions.update_many(
        {"last_name": {"$exists": False}},
        {"$set": {"last_name": ""}},
    )

    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL/ADMIN_PASSWORD not set — admin not seeded")
        return

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Divr Admin",
            "role": "admin",
            "created_at": now_utc_iso(),
        })
        logger.info("seeded admin user: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}},
        )
        logger.info("rotated admin password for: %s", admin_email)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
