const databasemodels = require ('../../database/databasemodels.js');
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
                //response.send({ token: token });
                console.log("vor settoken");
                response.set("token", token);
                request.headers['x-access-token'] = token;
                response.setHeader('Access-Control-Expose-Headers', 'x-access-token' );
                console.log(request.headers['x-access-token']);
                console.log("1. Middleware done");
                //response.set(token);
                next();
            });
    }
    else {
        console.log("Token found");
        next();
    }
    //next();
}

module.exports = {
    hasToken: hasToken,
};