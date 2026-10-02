import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Grand Azure Palace & Resort ERP"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    MONGODB_URI: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    DATABASE_NAME: str = Field(default="hotel_erp_db", alias="DATABASE_NAME")
    
    # Supabase Realtime & Auth Configuration
    SUPABASE_URL: str = Field(default="", alias="SUPABASE_URL")
    SUPABASE_KEY: str = Field(default="", alias="SUPABASE_KEY")
    SUPABASE_ANON_KEY: str = Field(default="", alias="SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_JWT_SECRET: str = Field(default="", alias="SUPABASE_JWT_SECRET")

    # Security & Auth
    JWT_SECRET: str = Field(default="super_secret_indian_hospitality_erp_jwt_key_2026", alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CLERK_SECRET_KEY: str = Field(default="", alias="CLERK_SECRET_KEY")
    CLERK_PUBLISHABLE_KEY: str = Field(default="", alias="CLERK_PUBLISHABLE_KEY")
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    # Payment Gateway (Razorpay for India, Stripe, or instant Mock Sandbox in INR)
    PAYMENT_PROVIDER: str = Field(default="razorpay", alias="PAYMENT_PROVIDER")  # "razorpay" | "mock" | "stripe"
    RAZORPAY_KEY_ID: str = Field(default="rzp_test_mock_hotel_key", alias="RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: str = Field(default="mock_secret_key", alias="RAZORPAY_KEY_SECRET")
    STRIPE_SECRET_KEY: str = Field(default="", alias="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", alias="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", alias="STRIPE_WEBHOOK_SECRET")
    
    # Hotel Profile & India Billing / GST Details
    HOTEL_NAME: str = "Grand Azure Palace & Resort"
    HOTEL_TAGLINE: str = "Royal Heritage & Coastal Luxury"
    HOTEL_ADDRESS: str = "Lake Palace Road, Udaipur, Rajasthan 313001, India"
    HOTEL_PHONE: str = "+91 294 242 8800"
    HOTEL_EMAIL: str = "reservations@grandazurepalace.in"
    HOTEL_WEBSITE: str = "https://www.grandazurepalace.in"
    HOTEL_CURRENCY: str = "INR"
    HOTEL_CURRENCY_SYMBOL: str = "₹"
    HOTEL_GSTIN: str = "08AAACG1234F1Z5"
    TAX_RATE: float = 0.12  # 12% GST (6% CGST + 6% SGST)
    SERVICE_FEE_RATE: float = 0.05  # 5% Resort Service Charge
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"

settings = Settings()
