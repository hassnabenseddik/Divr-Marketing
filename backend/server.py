from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Literal, Optional

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
    email: EmailStr
    country: str = Field(min_length=2, max_length=120)
    dive_region: Literal[
        "Red Sea", "Southeast Asia", "Caribbean",
        "Indian Ocean", "Mediterranean", "Other",
    ]


class WaitlistEntry(WaitlistCreate):
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
    full_name: str = Field(min_length=1, max_length=160)
    dive_center_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=1, max_length=200)
    email: EmailStr
    whatsapp: str = Field(min_length=5, max_length=40)
    monthly_bookings: Literal["Under 10", "10 to 30", "30 to 100", "100+"]


class OperatorEntry(OperatorCreate):
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
    logger.info("operator application: %s — %s", entry.dive_center_name, entry.email)
    return entry


# ---------- guides ----------
class GuideCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=160)
    specialty: Literal[
        "Freediving", "Technical Diving", "Underwater Photography",
        "Marine Biology", "Night Diving", "General Guiding", "Other",
    ]
    country: str = Field(min_length=2, max_length=120)
    base_location: str = Field(min_length=1, max_length=200)
    certifications: str = Field(min_length=1, max_length=2000)
    email: EmailStr
    whatsapp: str = Field(min_length=5, max_length=40)


class GuideEntry(GuideCreate):
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
    logger.info("guide application: %s (%s)", entry.full_name, entry.specialty)
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
