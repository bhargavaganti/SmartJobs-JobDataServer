
exports = module.exports = {};

/**
 * Response when there is data to return.
 * @param  {Object} req     - The request.
 * @param  {Object} res     - The response.
 * @param  {String | Object} data - THe data returned to the client.
 */
exports.successHandler = function (req, res, data) {
    res.status(200).send(data);
}

/**
 * Response when there is data to return.
 * @param  {Object} req     - The request.
 * @param  {Object} res     - The response.
 * @param  {Object} data - THe data returned to the client.
 */
exports.successJSONHandler = function (req, res, data) {
    res.status(200).json(data);
}

/**
 * Response when there is a client error.
 * @param  {Object} req     - The request.
 * @param  {Object} res     - The response.
 * @param  {string} message - The message returned to the client.
 */
exports.clientErrorHandler = function (req, res, message) {
    res.status(400).send(message);
}

/**
 * Response when there is a server error.
 * @param  {Object} req     - The request.
 * @param  {Object} res     - The response.
 * @param  {string} message - The message returned to the client.
 */
exports.serverErrorHandler = function (req, res, message) {
    res.status(500).send(message);
}

exports.successJSONHandler = function (req, res, data) {
    res.status(200).json(data);
}
