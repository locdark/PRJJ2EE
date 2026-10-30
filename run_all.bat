@echo off
chcp 65001 >nul
echo ====================================================================
echo   SMART LIBRARY MANAGEMENT SYSTEM - SPRING BOOT 3 AND GRAPHQL
echo   He Thong Quan Ly Thu Vien So (VNPay, SePay VietQR, Cloudflare, AI)
echo ====================================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

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
