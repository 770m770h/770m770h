@echo off
REM ===================================================================
REM  Double-click this file to start Claude Desktop with Hebrew/Arabic
REM  right-to-left support.
REM
REM  Nothing is installed and no file inside Claude is modified.
REM  Close this window to stop; Claude keeps running.
REM ===================================================================
title Claude RTL
setlocal
set "HERE=%~dp0"

if not exist "%HERE%..\dist\claude-rtl.bundle.js" (
  echo.
  echo  Could not find dist\claude-rtl.bundle.js
  echo  Download the whole claude-rtl folder, not just this file.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%claude-rtl.ps1" -Watch
if errorlevel 1 (
  echo.
  echo  ---- Something went wrong. Diagnostics: ----
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%claude-rtl.ps1" -Diagnose
  pause
)
