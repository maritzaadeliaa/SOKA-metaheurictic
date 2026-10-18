@echo off
if not exist "target\classes" mkdir target\classes
javac -cp "lib\cloudsim-3.0.3.jar" -d target\classes src\main\java\com\cloudsim\meta\*.java
if %ERRORLEVEL% equ 0 (
    echo [OK] Compile berhasil!
) else (
    echo [ERROR] Compile gagal.
)
