@ECHO OFF
SETLOCAL ENABLEEXTENSIONS

:: Creates the Service using nssm

:: Set path to node.exe
nssm install "Job Data Server Service" "C:\Program Files\nodejs\node.exe"

:: Set path to app directory
nssm set "Job Data Server Service" AppDirectory "C:\work\edsa\jobanalysis-dataserver"

:: Set app parameters
nssm set "Job Data Server Service" AppParameters "server.js"

:: Add port to the environment
nssm set "Job Data Server Service" AppEnvironmentExtra "PORT=2510"

:: start the service
nssm start "Job Data Server Service"


:: Additional commands

:: To stop the service
:: nssm stop "Job Data Server Service"

:: To remove the service
:: nssm remove "Job Data Server Service"
