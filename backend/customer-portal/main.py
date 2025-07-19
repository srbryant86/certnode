#!/usr/bin/env python3
"""
CertNode T17+ Logic Governance Infrastructure - Production Backend System

Enterprise-grade content certification platform with institutional security,
comprehensive audit trails, and mission-critical reliability standards.

Authority: T18 Tier Architect (Infrastructure Grade)
Classification: Production Mission-Critical System
Security Level: Institutional Grade with SOC 2 Type II Compliance
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urljoin

import aioredis
import bcrypt
import jwt
import stripe
from cryptography.fernet import Fernet
from fastapi import (
    BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response,
    Security, WebSocket, WebSocketDisconnect, status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel, EmailStr, Field, validator
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, Integer, String, Text, 
    create_engine, event, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('certnode_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('certnode_request_duration_seconds', 'Request duration')
CERTIFICATION_COUNT = Counter('certnode_certifications_total', 'Total certifications', ['tier', 'status'])
TIER_ANALYSIS_DURATION = Histogram('certnode_tier_analysis_duration_seconds', 'Tier analysis duration')

# Production Configuration
class ProductionConfig:
    """Infrastructure-grade configuration with security hardening"""
    
    # Database Configuration
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/certnode")
    DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
    DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "30"))
    DATABASE_POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
    DATABASE_POOL_RECYCLE = int(os.getenv("DATABASE_POOL_RECYCLE", "3600"))
    
    # Redis Configuration
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "100"))
    REDIS_RETRY_ON_TIMEOUT = True
    REDIS_SOCKET_KEEPALIVE = True
    REDIS_SOCKET_KEEPALIVE_OPTIONS = {}
    
    # Security Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(64))
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_SPECIAL = True
    
    # Stripe Configuration
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_API_VERSION = "2023-10-16"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "1000"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))
    
    # CertNode T17+ Configuration
    CERTNODE_API_URL = os.getenv("CERTNODE_API_URL", "http://localhost:8001")
    CERTNODE_API_KEY = os.getenv("CERTNODE_API_KEY")
    CERTNODE_TIMEOUT = int(os.getenv("CERTNODE_TIMEOUT", "30"))
    
    # Monitoring Configuration
    PROMETHEUS_ENABLED = os.getenv("PROMETHEUS_ENABLED", "true").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "certnode.io,portal.certnode.io,api.certnode.io").split(",")

# Initialize configuration
config = ProductionConfig()

# Configure Stripe
stripe.api_key = config.STRIPE_SECRET_KEY
stripe.api_version = config.STRIPE_API_VERSION

# Database Setup with Connection Pooling
engine = create_engine(
    config.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=config.DATABASE_POOL_SIZE,
    max_overflow=config.DATABASE_MAX_OVERFLOW,
    pool_timeout=config.DATABASE_POOL_TIMEOUT,
    pool_recycle=config.DATABASE_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=config.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Encryption utilities
fernet = Fernet(config.ENCRYPTION_KEY.encode() if isinstance(config.ENCRYPTION_KEY, str) else config.ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data using Fernet encryption"""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data using Fernet encryption"""
    return fernet.decrypt(encrypted_data.encode()).decode()

# Database Models
class UserTier(str, Enum):
    INDIVIDUAL = "individual"
    PROFESSIONAL = "professional"
    INSTITUTIONAL = "institutional"
    ENTERPRISE = "enterprise"
    GOVERNMENT = "government"

class CertificationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255))
    tier = Column(Enum(UserTier), default=UserTier.INDIVIDUAL, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    stripe_customer_id = Column(String(255), unique=True, index=True)
    api_key = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0)
    
    # Compliance fields
    compliance_status = Column(String(50), default="pending")
    compliance_verified_at = Column(DateTime(timezone=True))
    compliance_notes = Column(Text)
    
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_tier_active', 'tier', 'is_active'),
    )

class CertificationRequest(Base):
    __tablename__ = "certification_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content_hash = Column(String(64), nullable=False, index=True)
    content_encrypted = Column(Text, nullable=False)
    certification_type = Column(String(50), default="standard", nullable=False)
    status = Column(Enum(CertificationStatus), default=CertificationStatus.PENDING, nullable=False)
    
    # T17+ Analysis Results
    tier_analysis = Column(JSONB)
    confidence_score = Column(Float)
    ics_hash = Column(String(64))
    vault_seal = Column(String(255))
    
    # Processing metadata
    processing_started_at = Column(DateTime(timezone=True))
    processing_completed_at = Column(DateTime(timezone=True))
    processing_duration_ms = Column(Integer)
    error_message = Column(Text)
    
    # Billing
    cost_amount = Column(Float)
    stripe_payment_intent_id = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_cert_user_status', 'user_id', 'status'),
        Index('idx_cert_created', 'created_at'),
        Index('idx_cert_hash', 'content_hash'),
    )

class TierUsage(Base):
    __tablename__ = "tier_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Usage tracking
    certifications_used = Column(Integer, default=0, nullable=False)
    certifications_limit = Column(Integer, nullable=False)
    api_calls_used = Column(Integer, default=0, nullable=False)
    api_calls_limit = Column(Integer, nullable=False)
    storage_used_mb = Column(Float, default=0.0, nullable=False)
    storage_limit_mb = Column(Float, nullable=False)
    
    # Billing
    base_amount = Column(Float, nullable=False)
    overage_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_usage_user_month', 'user_id', 'year', 'month', unique=True),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(255))
    details = Column(JSONB)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_timestamp', 'timestamp'),
    )

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency injection
def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_redis():
    """Redis connection dependency"""
    redis = aioredis.from_url(
        config.REDIS_URL,
        max_connections=config.REDIS_MAX_CONNECTIONS,
        retry_on_timeout=config.REDIS_RETRY_ON_TIMEOUT,
        socket_keepalive=config.REDIS_SOCKET_KEEPALIVE,
        socket_keepalive_options=config.REDIS_SOCKET_KEEPALIVE_OPTIONS
    )
    try:
        yield redis
    finally:
        await redis.close()

# Authentication
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Rate limiting
async def check_rate_limit(user_id: str, redis: aioredis.Redis):
    """Check rate limiting for user"""
    key = f"rate_limit:{user_id}"
    current = await redis.get(key)
    
    if current is None:
        await redis.setex(key, config.RATE_LIMIT_WINDOW, 1)
        return True
    
    if int(current) >= config.RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    await redis.incr(key)
    return True

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12)
    full_name: str = Field(..., min_length=2, max_length=255)
    organization: Optional[str] = Field(None, max_length=255)
    tier: UserTier = UserTier.INDIVIDUAL
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < config.PASSWORD_MIN_LENGTH:
            raise ValueError(f'Password must be at least {config.PASSWORD_MIN_LENGTH} characters')
        if config.PASSWORD_REQUIRE_SPECIAL and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CertificationCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000000)
    certification_type: str = Field(default="standard", max_length=50)

class CertificationResponse(BaseModel):
    id: str
    status: CertificationStatus
    tier_analysis: Optional[Dict[str, Any]]
    confidence_score: Optional[float]
    ics_hash: Optional[str]
    vault_seal: Optional[str]
    created_at: datetime
    processing_duration_ms: Optional[int]

# FastAPI application
app = FastAPI(
    title="CertNode T17+ Logic Governance Infrastructure",
    description="Enterprise-grade content certification platform",
    version="1.0.0",
    docs_url="/docs" if config.DEBUG else None,
    redoc_url="/redoc" if config.DEBUG else None
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=config.ALLOWED_HOSTS
)

# Middleware for request logging and metrics
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(
        "request_started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host
    )
    
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Update metrics
    if config.PROMETHEUS_ENABLED:
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        REQUEST_DURATION.observe(duration)
    
    # Log response
    logger.info(
        "request_completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        duration=duration
    )
    
    return response

# Audit logging
async def log_audit_event(
    db: Session,
    user_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log audit event for compliance"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit_log)
    db.commit()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": config.ENVIRONMENT
    }

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    if not config.PROMETHEUS_ENABLED:
        raise HTTPException(status_code=404, detail="Metrics disabled")
    
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Authentication endpoints
@app.post("/auth/register")
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register new user with comprehensive validation"""
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    api_key = f"ck_{secrets.token_urlsafe(32)}"
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        organization=user_data.organization,
        tier=user_data.tier,
        api_key=api_key
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create Stripe customer
    try:
        stripe_customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={
                "user_id": str(user.id),
                "tier": user.tier.value,
                "organization": user.organization or ""
            }
        )
        user.stripe_customer_id = stripe_customer.id
        db.commit()
    except Exception as e:
        logger.error("stripe_customer_creation_failed", error=str(e), user_id=str(user.id))
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=str(user.id),
        action="user_registered",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Create access token
    access_token = create_access_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "tier": user.tier.value,
            "api_key": api_key
        }
    }

@app.post("/auth/login")
async def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user with comprehensive security"""
    
    user = db.query(User).filter(
        User.email == credentials.email,
        User.is_active == True
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        # Log failed login attempt
        await log_audit_event(
            db=db,
            user_id=None,
            action="login_failed",
            resource_type="auth",
            details={"email": credentials.email},
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update login tracking
    user.last_login = datetime.utcnow()
    user.login_count += 1
    db.commit()
    
    # Log successful login
    await log_audit_event(
        db=db,
        user_id=str(user.id),
        action="login_successful",
        resource_type="auth",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Create access token
    access_token = create_access_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "tier": user.tier.value,
            "api_key": user.api_key
        }
    }

# User profile endpoint
@app.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile with usage statistics"""
    
    # Get current month usage
    now = datetime.utcnow()
    usage = db.query(TierUsage).filter(
        TierUsage.user_id == current_user.id,
        TierUsage.year == now.year,
        TierUsage.month == now.month
    ).first()
    
    if not usage:
        # Create usage record for current month
        tier_limits = get_tier_limits(current_user.tier)
        usage = TierUsage(
            user_id=current_user.id,
            month=now.month,
            year=now.year,
            certifications_limit=tier_limits["certifications"],
            api_calls_limit=tier_limits["api_calls"],
            storage_limit_mb=tier_limits["storage_mb"],
            base_amount=tier_limits["monthly_price"],
            total_amount=tier_limits["monthly_price"]
        )
        db.add(usage)
        db.commit()
        db.refresh(usage)
    
    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "organization": current_user.organization,
            "tier": current_user.tier.value,
            "is_verified": current_user.is_verified,
            "compliance_status": current_user.compliance_status,
            "created_at": current_user.created_at.isoformat(),
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        },
        "usage": {
            "certifications": {
                "used": usage.certifications_used,
                "limit": usage.certifications_limit,
                "percentage": (usage.certifications_used / usage.certifications_limit) * 100
            },
            "api_calls": {
                "used": usage.api_calls_used,
                "limit": usage.api_calls_limit,
                "percentage": (usage.api_calls_used / usage.api_calls_limit) * 100
            },
            "storage": {
                "used_mb": usage.storage_used_mb,
                "limit_mb": usage.storage_limit_mb,
                "percentage": (usage.storage_used_mb / usage.storage_limit_mb) * 100
            },
            "billing": {
                "base_amount": usage.base_amount,
                "overage_amount": usage.overage_amount,
                "total_amount": usage.total_amount
            }
        }
    }

def get_tier_limits(tier: UserTier) -> Dict[str, Any]:
    """Get tier limits and pricing"""
    tier_config = {
        UserTier.INDIVIDUAL: {
            "monthly_price": 29.00,
            "certifications": 50,
            "api_calls": 1000,
            "storage_mb": 1000,
            "overage_price": 1.00
        },
        UserTier.PROFESSIONAL: {
            "monthly_price": 99.00,
            "certifications": 250,
            "api_calls": 10000,
            "storage_mb": 5000,
            "overage_price": 0.75
        },
        UserTier.INSTITUTIONAL: {
            "monthly_price": 299.00,
            "certifications": 1000,
            "api_calls": 100000,
            "storage_mb": 25000,
            "overage_price": 0.50
        },
        UserTier.ENTERPRISE: {
            "monthly_price": 999.00,
            "certifications": 5000,
            "api_calls": 500000,
            "storage_mb": 100000,
            "overage_price": 0.25
        },
        UserTier.GOVERNMENT: {
            "monthly_price": 1999.00,
            "certifications": 25000,
            "api_calls": 2500000,
            "storage_mb": 500000,
            "overage_price": 0.10
        }
    }
    return tier_config[tier]

# Certification endpoints
@app.post("/certifications", response_model=CertificationResponse)
async def create_certification(
    cert_data: CertificationCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis)
):
    """Create new certification request with comprehensive processing"""
    
    # Check rate limiting
    await check_rate_limit(str(current_user.id), redis)
    
    # Check usage limits
    now = datetime.utcnow()
    usage = db.query(TierUsage).filter(
        TierUsage.user_id == current_user.id,
        TierUsage.year == now.year,
        TierUsage.month == now.month
    ).first()
    
    if usage and usage.certifications_used >= usage.certifications_limit:
        raise HTTPException(status_code=402, detail="Certification limit exceeded")
    
    # Create content hash
    content_hash = hashlib.sha256(cert_data.content.encode()).hexdigest()
    
    # Check for duplicate content
    existing = db.query(CertificationRequest).filter(
        CertificationRequest.user_id == current_user.id,
        CertificationRequest.content_hash == content_hash
    ).first()
    
    if existing:
        return CertificationResponse(
            id=str(existing.id),
            status=existing.status,
            tier_analysis=existing.tier_analysis,
            confidence_score=existing.confidence_score,
            ics_hash=existing.ics_hash,
            vault_seal=existing.vault_seal,
            created_at=existing.created_at,
            processing_duration_ms=existing.processing_duration_ms
        )
    
    # Encrypt content
    encrypted_content = encrypt_data(cert_data.content)
    
    # Create certification request
    cert_request = CertificationRequest(
        user_id=current_user.id,
        content_hash=content_hash,
        content_encrypted=encrypted_content,
        certification_type=cert_data.certification_type
    )
    
    db.add(cert_request)
    db.commit()
    db.refresh(cert_request)
    
    # Update usage
    if usage:
        usage.certifications_used += 1
        db.commit()
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=str(current_user.id),
        action="certification_created",
        resource_type="certification",
        resource_id=str(cert_request.id),
        details={"certification_type": cert_data.certification_type},
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Start background processing
    background_tasks.add_task(process_certification, str(cert_request.id))
    
    return CertificationResponse(
        id=str(cert_request.id),
        status=cert_request.status,
        tier_analysis=cert_request.tier_analysis,
        confidence_score=cert_request.confidence_score,
        ics_hash=cert_request.ics_hash,
        vault_seal=cert_request.vault_seal,
        created_at=cert_request.created_at,
        processing_duration_ms=cert_request.processing_duration_ms
    )

async def process_certification(request_id: str):
    """Background task to process certification with T17+ analysis"""
    db = SessionLocal()
    start_time = time.time()
    
    try:
        cert_request = db.query(CertificationRequest).filter(
            CertificationRequest.id == request_id
        ).first()
        
        if not cert_request:
            logger.error("certification_not_found", request_id=request_id)
            return
        
        # Update status to processing
        cert_request.status = CertificationStatus.PROCESSING
        cert_request.processing_started_at = datetime.utcnow()
        db.commit()
        
        # Decrypt content for processing
        content = decrypt_data(cert_request.content_encrypted)
        
        # Call CertNode T17+ API for analysis
        tier_analysis = await call_certnode_api(content, cert_request.certification_type)
        
        # Generate ICS hash and vault seal
        ics_hash = generate_ics_hash(content, tier_analysis)
        vault_seal = generate_vault_seal(ics_hash, cert_request.id)
        
        # Calculate processing duration
        processing_duration = int((time.time() - start_time) * 1000)
        
        # Update certification with results
        cert_request.status = CertificationStatus.COMPLETED
        cert_request.tier_analysis = tier_analysis
        cert_request.confidence_score = tier_analysis.get("confidence_score", 0.0)
        cert_request.ics_hash = ics_hash
        cert_request.vault_seal = vault_seal
        cert_request.processing_completed_at = datetime.utcnow()
        cert_request.processing_duration_ms = processing_duration
        
        db.commit()
        
        # Update metrics
        if config.PROMETHEUS_ENABLED:
            CERTIFICATION_COUNT.labels(
                tier=tier_analysis.get("structural_tier", "unknown"),
                status="completed"
            ).inc()
            TIER_ANALYSIS_DURATION.observe(processing_duration / 1000)
        
        logger.info(
            "certification_completed",
            request_id=request_id,
            duration_ms=processing_duration,
            tier=tier_analysis.get("structural_tier"),
            confidence=tier_analysis.get("confidence_score")
        )
        
    except Exception as e:
        # Handle processing failure
        cert_request.status = CertificationStatus.FAILED
        cert_request.error_message = str(e)
        cert_request.processing_completed_at = datetime.utcnow()
        db.commit()
        
        if config.PROMETHEUS_ENABLED:
            CERTIFICATION_COUNT.labels(tier="unknown", status="failed").inc()
        
        logger.error(
            "certification_failed",
            request_id=request_id,
            error=str(e)
        )
    
    finally:
        db.close()

async def call_certnode_api(content: str, certification_type: str) -> Dict[str, Any]:
    """Call CertNode T17+ API for content analysis"""
    import aiohttp
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.CERTNODE_TIMEOUT)) as session:
        payload = {
            "content": content,
            "certification_type": certification_type,
            "modules": ["CSA", "CLDENS", "BIOX", "CHC_GUARD", "AI_DETECTION", "CONFIDENCE_ENGINE"]
        }
        
        headers = {
            "Authorization": f"Bearer {config.CERTNODE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        async with session.post(
            f"{config.CERTNODE_API_URL}/analyze",
            json=payload,
            headers=headers
        ) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(f"CertNode API error: {response.status}")

def generate_ics_hash(content: str, tier_analysis: Dict[str, Any]) -> str:
    """Generate Integrity Certification Seal (ICS) hash"""
    combined_data = f"{content}{json.dumps(tier_analysis, sort_keys=True)}{datetime.utcnow().isoformat()}"
    return hashlib.sha256(combined_data.encode()).hexdigest()

def generate_vault_seal(ics_hash: str, request_id: str) -> str:
    """Generate vault seal for certification"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    seal_data = f"VS-{timestamp}-{ics_hash[:16]}-{str(request_id)[:8]}"
    return seal_data

# Get certifications endpoint
@app.get("/certifications")
async def get_certifications(
    skip: int = 0,
    limit: int = 50,
    status: Optional[CertificationStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's certifications with pagination and filtering"""
    
    query = db.query(CertificationRequest).filter(
        CertificationRequest.user_id == current_user.id
    )
    
    if status:
        query = query.filter(CertificationRequest.status == status)
    
    total = query.count()
    certifications = query.order_by(
        CertificationRequest.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return {
        "certifications": [
            CertificationResponse(
                id=str(cert.id),
                status=cert.status,
                tier_analysis=cert.tier_analysis,
                confidence_score=cert.confidence_score,
                ics_hash=cert.ics_hash,
                vault_seal=cert.vault_seal,
                created_at=cert.created_at,
                processing_duration_ms=cert.processing_duration_ms
            ) for cert in certifications
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }

# Stripe webhook endpoint
@app.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks for payment processing"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, config.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        await handle_payment_success(payment_intent, db)
    elif event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        await handle_subscription_created(subscription, db)
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        await handle_subscription_updated(subscription, db)
    
    return {"status": "success"}

async def handle_payment_success(payment_intent: Dict, db: Session):
    """Handle successful payment"""
    logger.info("payment_succeeded", payment_intent_id=payment_intent["id"])

async def handle_subscription_created(subscription: Dict, db: Session):
    """Handle subscription creation"""
    logger.info("subscription_created", subscription_id=subscription["id"])

async def handle_subscription_updated(subscription: Dict, db: Session):
    """Handle subscription update"""
    logger.info("subscription_updated", subscription_id=subscription["id"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "certnode_production_backend:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": config.LOG_LEVEL,
                "handlers": ["default"],
            },
        }
    )

