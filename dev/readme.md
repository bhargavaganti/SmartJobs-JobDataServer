# Development Files

Contains the files used to create the server as a service and to store and update the database.

**Note:** If necessary, change the paths in `.cmd` file is located.

## Start the server as a service

This are the instructions how to run the server as a service using nssm. This will watch the service and if the service (server) stops working it will automatically restart the service.

**Perequisites:** nssm must be found in the system path. The program can be [downloaded here.](https://nssm.cc/download) Add the path to the system environments.

Once the nssm folder is in the system environments path, run CreateService.cmd in the Command Prompt run as Administrator. This will make the server service under the name "Job Data Server Service".

## Updating the database

File `UpdateDatabase.cmd` updates the database on the server. It calls the corresponding paths in the API to manually store and update the database. If the server is down, it waits 5 minutes and checks again if the server is running. Add it to task scheduler.

### Request files

Files `restartBase.js` and `updateDatabase.js` are helper scripts that store and update the database.
