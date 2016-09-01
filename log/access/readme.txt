The format of the log files:

:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms

:remote-addr   - The remote address of the request. This will use 'req.ip', otherwise the standard 'req.connection.remoteAddress' value (socket address).
:remote-user   - The user authenticated as part of Basic auth for the request.
:method        - The HTTP method of the request.
:url           - The URL of the request. This will use 'req.originalUrl' if exists, otherwise 'req.url'.
:http-version  - The HTTP version of the request.
:status        -  The status code of the response. If the request/response cycle completes before a response was sent to the client (for example, the TCP socket closed prematurely by a client aborting the request), then the status will be empty (displayed as "-" in the log).
:res[header]   - The given 'header' of the response.
:response-time - The time between the request coming into 'morgan' and when the response headers are written, in milliseconds.
