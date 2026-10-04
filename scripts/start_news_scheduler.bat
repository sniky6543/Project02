@echo off
chcp 65001 > nul
echo ======================================================================
echo  [청년나침반] 청년 정책 뉴스 자동 동기화 스케줄러 (매일 10시 / 19시)
echo ======================================================================
cd /d "%~dp0\.."

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

"%PYTHON_EXE%" ai/policy_news_scheduler.py
pause
