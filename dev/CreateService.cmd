@ECHO OFF
SETLOCAL ENABLEEXTENSIONS

:: Creates the Service using nssm

:: Set path to node.exe
nssm install "Job Data Server Service" "C:\Program Files\nodejs"

:: Set path to app directory
nssm set "Job Data Server Service" AppDirectory "C:\work\edsa\jobanalysis-dataserver"

:: Set app parameters
nssm set "Job Data Server Service" AppParameters "server.js"

:: start the service
nssm start "Job Data Server Service"


:: Additional commands

:: To stop the service
:: nssm stop "Job Data Server Service"

:: To remove the service
:: nssm remove "Job Data Server Service"
