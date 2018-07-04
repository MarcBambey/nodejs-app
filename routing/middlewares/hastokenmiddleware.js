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
    console.log('1. Middleware');
    const bearerHeader = request.headers['x-access-token'];
    console.log(bearerHeader);
    if (typeof bearerHeader === 'undefined') {
        User
            .build()
            .save()
            .then(myuser => {
                var token = jwt.sign({ userid: myuser.id }, util.secret);
                console.log("This is myuser: " + myuser);
                console.log(token);
                console.log("vor settoken");
                request.token = jwt.decode(token, {complete: true});
                request.headers['x-access-token'] = token;
                response.setHeader('Access-Control-Expose-Headers', 'x-access-token');
                console.log(request.headers['x-access-token']);
                console.log("1. Middleware done");
                next();
            });
    }
    else {
        console.log("Token found");
        request.token  = jwt.decode(bearerHeader, { complete: true });
        next();
    }
    //next();
}

module.exports = {
    hasToken: hasToken,
};