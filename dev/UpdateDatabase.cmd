@ECHO OFF
SETLOCAL ENABLEEXTENSIONS

:loop

netstat -o -n -a | findstr 0.0:2510
IF %ERRORLEVEL% EQU 0 (
    ECHO Updating database...
    :: Restart the base
    node -e "var request = require('request'); request.get('http://localhost:2510/api/v1/database_update');"
) ELSE (
    ECHO Server is down.
    ping 127.0.0.1 -n 300 > nul
    GOTO loop
)
