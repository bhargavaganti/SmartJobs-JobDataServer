# SmartJobs Web API

This repository contains the source code for SmartJobs Web API. This enables the user to get the crawled job information.

## How To Run the Application

To run the application one must run `npm install` to get all of the dependencies needed to start the server. Then run `npm start` to start the server.

**Note:** Database must be created before the server is ran. This is created using `data/createBase.js`. The data is _not_ given in the repository. It must be given manually.

## Testing Routes

To test if the server is returning the correct information one can run tests using `mocha ./test/serverResponse.js` which runs the test files in the `test` folder. All tests should pass.

**Note:** `mocha` s a feature-rich JavaScript test framework running on Node.js and in the browser, making asynchronous testing simple and fun. To install it run `npm install -g mocha`.
