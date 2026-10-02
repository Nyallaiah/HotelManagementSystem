import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.database import db_manager, get_database
from backend.routes.auth import router as auth_router
from backend.routes.rooms import router as rooms_router
from backend.routes.bookings import router as bookings_router
from backend.routes.payments import router as payments_router
from backend.routes.pos import router as pos_router
from backend.routes.analytics import router as analytics_router
from backend.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hotel_erp.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect DB and run auto-seeder if empty
    logger.info("Initializing Hotel ERP Backend...")
    await db_manager.connect()
    
    db = get_database()
    room_count = await db.rooms.count_documents({})
    if room_count == 0:
        logger.info("Database appears fresh. Auto-seeding initial hotel data...")
        try:
            await seed_database()
            logger.info("Auto-seeding completed.")
        except Exception as e:
            logger.warning(f"Auto-seeding encountered an issue: {e}")
            
    yield
    # Shutdown
    await db_manager.close()
    logger.info("Hotel ERP Backend gracefully stopped.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Hospitality ERP & Property Management System (PMS) for Medium Hotels",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(rooms_router, prefix=settings.API_PREFIX)
app.include_router(bookings_router, prefix=settings.API_PREFIX)
app.include_router(payments_router, prefix=settings.API_PREFIX)
app.include_router(pos_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "hotel": settings.HOTEL_NAME,
        "tagline": settings.HOTEL_TAGLINE,
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX
    }

@app.get(f"{settings.API_PREFIX}/health")
async def health_check():
    db = get_database()
    rooms_count = await db.rooms.count_documents({}) if db is not None else 0
    return {
        "status": "healthy",
        "database": "mock_memory_engine" if db_manager.is_mock else "mongodb_connected",
        "database_name": settings.DATABASE_NAME,
        "payment_provider": settings.PAYMENT_PROVIDER,
        "active_rooms": rooms_count,
        "hotel": settings.HOTEL_NAME
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred in the Hospitality ERP engine."}
    )
