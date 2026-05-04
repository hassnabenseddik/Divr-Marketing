from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# FastAPI app + /api router
app = FastAPI(title="Divr Marketing API")
api_router = APIRouter(prefix="/api")


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"service": "divr-marketing", "status": "ok"}


# ---------- Waitlist (Divers) ----------
class WaitlistCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    country: str = Field(min_length=1, max_length=120)
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
    # TODO: send confirmation email via SendGrid (deferred — keys to be added)
    return entry


# ---------- For Operators ----------
class OperatorCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=160)
    dive_center_name: str = Field(min_length=1, max_length=200)
    country_destination: str = Field(min_length=1, max_length=200)
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
    # TODO: send confirmation email via SendGrid (deferred — keys to be added)
    return entry


# ---------- For Independent Guides ----------
class GuideCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=160)
    specialty: Literal[
        "Freediving", "Technical Diving", "Underwater Photography",
        "Marine Biology", "Night Diving", "General Guiding", "Other",
    ]
    country_base: str = Field(min_length=1, max_length=200)
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
    # TODO: send confirmation email via SendGrid (deferred — keys to be added)
    return entry


# ---------- Admin: list submissions (no PII to logs) ----------
@api_router.get("/admin/waitlist", response_model=List[WaitlistEntry])
async def list_waitlist(limit: int = 200):
    docs = await db.waitlist_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/admin/operators", response_model=List[OperatorEntry])
async def list_operators(limit: int = 200):
    docs = await db.operator_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/admin/guides", response_model=List[GuideEntry])
async def list_guides(limit: int = 200):
    docs = await db.guide_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


# Mount the /api router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
