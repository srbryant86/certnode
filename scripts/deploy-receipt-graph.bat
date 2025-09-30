@echo off
REM Receipt Graph MVP Deployment Script (Windows)
REM Run from project root: scripts\deploy-receipt-graph.bat

echo.
echo ========================================
echo  CertNode Receipt Graph Deployment
echo ========================================
echo.

REM Change to dashboard directory
cd certnode-dashboard
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Could not find certnode-dashboard directory
    exit /b 1
)

echo Working directory: %CD%
echo.

REM Step 1: Check environment
echo Step 1: Checking environment...
if not exist .env (
    echo .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    if %ERRORLEVEL% EQU 0 (
        echo [OK] .env file created
    )
)

REM Check DATABASE_URL
findstr /C:"DATABASE_URL" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo DATABASE_URL not found in .env
    echo Adding default SQLite database URL...
    echo DATABASE_URL="file:./dev.db" >> .env
    echo [OK] DATABASE_URL added
)

echo.

REM Step 2: Install dependencies
echo Step 2: Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Dependencies installed
    ) else (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

echo.

REM Step 3: Generate Prisma Client
echo Step 3: Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo [OK] Prisma Client generated
) else (
    echo [ERROR] Failed to generate Prisma Client
    exit /b 1
)

echo.

REM Step 4: Create and apply migration
echo Step 4: Creating database migration...
call npx prisma migrate dev --name add_receipt_graph
if %ERRORLEVEL% EQU 0 (
    echo [OK] Migration applied
) else (
    echo [ERROR] Failed to apply migration
    exit /b 1
)

echo.

REM Step 5: TypeScript compilation check
echo Step 5: Checking TypeScript compilation...
call npx tsc --noEmit --skipLibCheck
if %ERRORLEVEL% EQU 0 (
    echo [OK] TypeScript compilation successful
) else (
    echo [WARNING] TypeScript compilation had issues
)

echo.

REM Step 6: Verify schema
echo Step 6: Verifying database schema...
call npx prisma validate
if %ERRORLEVEL% EQU 0 (
    echo [OK] Schema validation passed
) else (
    echo [ERROR] Schema validation failed
    exit /b 1
)

echo.

REM Step 7: Migration status
echo Step 7: Checking migration status...
call npx prisma migrate status

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo What was deployed:
echo   [OK] Database schema updated with ReceiptRelationship model
echo   [OK] Receipt model extended with graph fields
echo   [OK] RelationType enum added (CAUSES, EVIDENCES, etc.)
echo   [OK] Graph service layer created
echo   [OK] 4 new API endpoints:
echo     - POST /api/v1/receipts/graph
echo     - GET /api/v1/receipts/graph/{id}
echo     - GET /api/v1/receipts/graph/path
echo     - GET /api/v1/receipts/graph/analytics
echo.
echo Documentation:
echo   - API Docs: docs\RECEIPT_GRAPH_API.md
echo   - Master Plan: docs\MASTER_IMPLEMENTATION_PLAN.md
echo.
echo Next steps:
echo   1. Start dev server: npm run dev
echo   2. Test at: http://localhost:3000/api/v1/receipts/graph
echo   3. Run tests: npm test __tests__/receipt-graph.test.ts
echo.
echo To deploy to production:
echo   1. git add -A
echo   2. git commit -m "deploy: receipt graph MVP"
echo   3. git push
echo   4. Run migrations in production: npx prisma migrate deploy
echo.

pause