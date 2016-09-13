@ECHO OFF
SETLOCAL ENABLEEXTENSIONS

netstat -o -n -a | findstr 0.0:2510
IF %ERRORLEVEL% EQU 0 (
    :: Do nothing! Server is already running.
    ECHO Server is running on port 2510.
    EXIT
) ELSE (
    ECHO Server is down! Running server...
    cd "C:\work\edsa\jobanalysis-dataserver\"
    CALL npm start
)
