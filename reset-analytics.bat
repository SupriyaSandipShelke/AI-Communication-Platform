@echo off
echo ========================================
echo  Analytics Feature Reset Tool
echo ========================================
echo.
echo This will reset the Analytics feature to its previous state.
echo.
echo WARNING: This will discard all changes to:
echo   - client/src/pages/Analytics.tsx
echo   - src/server/routes/analytics.ts
echo   - ANALYTICS_ENHANCED.md
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo Resetting Analytics.tsx...
    git checkout HEAD -- client/src/pages/Analytics.tsx
    
    echo Resetting analytics.ts...
    git checkout HEAD -- src/server/routes/analytics.ts
    
    echo Removing documentation...
    if exist ANALYTICS_ENHANCED.md del ANALYTICS_ENHANCED.md
    
    echo.
    echo ========================================
    echo  Reset Complete!
    echo ========================================
    echo.
    echo The Analytics feature has been restored to its previous state.
    echo You may need to restart your development server.
) else (
    echo.
    echo Reset cancelled.
)

echo.
pause
