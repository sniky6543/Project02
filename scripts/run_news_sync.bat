@echo off
chcp 65001 > nul
echo ======================================================================
echo  [청년나침반] 청년 정책 뉴스 즉시 1회 동기화 실행
echo ======================================================================
cd /d "%~dp0\.."

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" ai/policy_news_sync.py
pause
