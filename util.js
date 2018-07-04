var jwt = require('jsonwebtoken');

const password = "password";
const secret = "secret";

/**
 *This function assigns a payload to a jwt token and returns the new token.
 *
 * @param {*} oldToken The currentToken of the user
 * @param {*} payload The payload that will be assigned to the token
 * @returns The new signed token with the new payload
 */
function assignPayload(payload,request, response) {
    console.log("The payload " + request.token.payload);
    Object.assign(request.token.payload, payload);
    response.setHeader('x-access-token', jwt.sign(request.token.payload, secret));
    response.setHeader('Access-Control-Expose-Headers', 'x-access-token' )
}

function deleteTokenKey(request,response, key){
    let res = Object.assign({}, request.token);
                    delete res.payload[key];
                    console.log(res);
                    console.log("Key: " + key);
                    let newToken = jwt.sign(res.payload, secret);
                    request.token = newToken;
                    response.setHeader('x-access-token', newToken);
                    response.setHeader('Access-Control-Expose-Headers', 'x-access-token')
    }

module.exports = {
    password: password,
    secret: secret,
    deleteTokenKey: deleteTokenKey,
    assignPayload: assignPayload,

};