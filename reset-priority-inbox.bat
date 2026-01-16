@echo off
echo ========================================
echo  Priority Inbox Reset Tool
echo ========================================
echo.
echo This will reset the Priority Inbox to its previous state.
echo.
echo WARNING: This will discard all changes to:
echo   - client/src/pages/PriorityInbox.tsx
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo Resetting PriorityInbox.tsx...
    git checkout HEAD -- client/src/pages/PriorityInbox.tsx
    
    echo.
    echo ========================================
    echo  Reset Complete!
    echo ========================================
    echo.
    echo The Priority Inbox has been restored to its previous state.
    echo You may need to restart your development server.
) else (
    echo.
    echo Reset cancelled.
)

echo.
pause
