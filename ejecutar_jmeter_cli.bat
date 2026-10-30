@echo off
TITLE SUMAQ Spa - Ejecucion Automatizada de JMeter (Modo CLI)
echo ===============================================================================
echo            SUMAQ SPA - PRUEBA DE RENDIMIENTO AUTOMATIZADA (JMeter CLI)
echo ===============================================================================
echo.

SET JMETER_HOME=%~dp0tools\apache-jmeter-5.6.3
SET JMETER_BAT=%JMETER_HOME%\bin\jmeter.bat
SET TEST_PLAN=%~dp0tests\performance\sumaq_smoke_test.jmx
SET RESULT_FILE=%~dp0tests\performance\resultado_jmeter.jtl
SET REPORT_DIR=%~dp0tests\performance\reporte_html

IF NOT EXIST "%JMETER_BAT%" (
    echo [INFO] No se detecto Apache JMeter localmente.
    echo [INFO] Descargando y preparando Apache JMeter 5.6.3 automaticamente...
    powershell -Command "New-Item -ItemType Directory -Force -Path 'tools' | Out-Null; Write-Host 'Descargando paquete binario...'; curl.exe -L -o tools\apache-jmeter.zip https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.zip; Write-Host 'Descomprimiendo en carpeta tools...'; Expand-Archive -Path 'tools\apache-jmeter.zip' -DestinationPath 'tools' -Force; Remove-Item 'tools\apache-jmeter.zip' -Force"
)

IF NOT EXIST "%JMETER_BAT%" (
    echo [ERROR] No se pudo inicializar Apache JMeter en %JMETER_BAT%
    pause
    exit /b 1
)

IF EXIST "%RESULT_FILE%" del /f /q "%RESULT_FILE%"
IF EXIST "%REPORT_DIR%" rmdir /s /q "%REPORT_DIR%"

echo Ejecutando prueba de carga con 20 usuarios hacia SUMAQ Spa...
echo Por favor espera unos segundos...
echo.

call "%JMETER_BAT%" -n -t "%TEST_PLAN%" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"

echo.
echo ===============================================================================
echo Prueba completada con exito.
echo Reporte interactivo HTML generado en:
echo %REPORT_DIR%\index.html
echo ===============================================================================
pause
