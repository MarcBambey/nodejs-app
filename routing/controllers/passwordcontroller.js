var jwt = require('jsonwebtoken');
let util = require('../../util.js');

let passwordController = {};

passwordController.confirmTokenPassword = function (request,response){
    if (request.token.payload.hasOwnProperty("password")){
        response.status(200).send({
            'success' : 'Token with confirmed password provided',
        })
    }else {
        response.status(500).send({
            'failed': 'No Password in Token provided',
        })
    }
}

passwordController.checkPassword = function (request, response) {
if(request.body.password === util.password) {
    let payload = {
        'password': true,
    }
    util.assignPayload(payload,request,response);
    response.status(200).send({
        'success': 'User provided the correct password',
    })
}else {
    response.status(500).send({
        'failed' : 'Incorrect password',
    })
}
}

module.exports = passwordController