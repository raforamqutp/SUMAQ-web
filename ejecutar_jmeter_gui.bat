@echo off
TITLE SUMAQ Spa - Lanzador de Apache JMeter (Modo Visual)
echo ===============================================================================
echo                SUMAQ SPA - PRUEBA DE RENDIMIENTO EN VIVO (JMeter)
echo ===============================================================================
echo.
echo Verificando entorno de ejecucion...

SET JMETER_HOME=%~dp0tools\apache-jmeter-5.6.3
SET JMETER_BAT=%JMETER_HOME%\bin\jmeter.bat
SET TEST_PLAN=%~dp0tests\performance\sumaq_smoke_test.jmx

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

IF NOT EXIST "%TEST_PLAN%" (
    echo [ERROR] No se encontro el plan de pruebas en %TEST_PLAN%
    pause
    exit /b 1
)

echo Iniciando interfaz grafica de Apache JMeter...
echo Cargando plan de pruebas: tests\performance\sumaq_smoke_test.jmx
echo.
echo TIP: Haz clic en el boton verde PLAY para iniciar la prueba de 20 usuarios.
echo      Luego revisa el "Summary Report" para ver los tiempos de respuesta.
echo ===============================================================================

call "%JMETER_BAT%" -t "%TEST_PLAN%"
