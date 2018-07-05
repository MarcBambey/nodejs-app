const databasemodels = require('../../database/databasemodels.js');
const User = databasemodels.User;
var jwt = require('jsonwebtoken');
const util = require('../../util.js');

/**
 * This middleware checks whether a token is send in the header.
 * If there is no token a new token with the userid in the payloder is generated.
 * @param {*} request  The request
 * @param {*} response The response
 * @param {*} next     The next function is called
 */
function hasToken(request, response, next) {
    const bearerHeader = request.headers['x-access-token'];
    if (typeof bearerHeader === 'undefined') {
        User
            .build()
            .save()
            .then(myuser => {
                var token = jwt.sign({ userid: myuser.id }, util.secret);
                request.token = jwt.decode(token, {complete: true});
                request.headers['x-access-token'] = token;
                response.setHeader('Access-Control-Expose-Headers', 'x-access-token');
                next();
            });
    }
    else {
        request.token  = jwt.decode(bearerHeader, { complete: true });
        next();
    }
    //next();
}

module.exports = {
    hasToken: hasToken,
};