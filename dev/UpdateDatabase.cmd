@ECHO OFF
SETLOCAL ENABLEEXTENSIONS

:loop
netstat -o -n -a | findstr 0.0:2510
IF %ERRORLEVEL% EQU 0 (
    ECHO Updating database...
    cd "C:\work\edsa\jobanalysis-dataserver\dev\"
    :: Restart the base
    node restartBase.js
    :: Update the init data.
    node updateInit.js
    EXIT
) ELSE (
    ECHO Server is down.
    ping 127.0.0.1 -n 300 > nul
    GOTO loop
)
