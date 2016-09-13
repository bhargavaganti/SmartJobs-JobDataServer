# Development Files

Contains the files used to restart the server if it isn't running and to store and update the database.

## Running the server

The file `run-server.cmd` checks if the server is down and restarts it. Used to automatically check if the server is running (task scheduler).

## Updating the database

File `ping-update.cmd` updates the database on the server. It calls the corresponding paths in the API to manually store and update the database. If the server is down, it waits 5 minutes and checks again if the server is running.

### Request files

The files `ping-restartbase.js` and `ping-update.js` are helper scripts that store and update the database.

**Note:** If necessary, change the path where the `.cmd` file is located.
