@echo off
chcp 65001 >nul
echo ====================================================================
echo   SMART LIBRARY MANAGEMENT SYSTEM - SPRING BOOT 3 AND GRAPHQL
echo   He Thong Quan Ly Thu Vien So (VNPay, SePay VietQR, Cloudflare, AI)
echo ====================================================================

REM Detect JAVA_HOME
if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "D:\IntelliJ IDEA Community Edition 2025.2.4\jbr\bin\java.exe" (
        set "JAVA_HOME=D:\IntelliJ IDEA Community Edition 2025.2.4\jbr"
    ) else if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    )
)

if exist "%JAVA_HOME%\bin\java.exe" (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Su dung Java tai: %JAVA_HOME%
) else (
    echo [CANH BAO] Khong tim thay JDK 21! Vui long kiem tra lai duong dan Java.
)

REM Kiem tra dependencies frontend
if not exist "frontend\node_modules" (
    echo [Thong tin] Dang cai dat dependencies cho frontend (npm install)...
    cd frontend && call npm install && cd ..
)

echo [1/2] Dang khoi dong Spring Boot Backend (Port 8080)...
start "SmartLibrary Backend - Spring Boot" cmd /k "cd backend && mvnw.cmd spring-boot:run"

echo [2/2] Dang khoi dong React Vite Frontend (Port 5173)...
start "SmartLibrary Frontend - React Vite" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================================
echo Dang cho cac server khoi dong va mo trinh duyet...
ping 127.0.0.1 -n 6 >nul
start http://localhost:5173

echo.
echo ====================================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   - Ung dung Web:    http://localhost:5173
echo   - GraphiQL IDE:    http://localhost:8080/graphiql
echo   - H2 DB Console:   http://localhost:8080/h2-console
echo ====================================================================
echo Nhan bat ky phim nao de dong cua so nay (2 cua so server van chay ngam)...
pause >nul
