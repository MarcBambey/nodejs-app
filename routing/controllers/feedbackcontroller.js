var jwt = require('jsonwebtoken');
const databasemodels = require('../../database/databasemodels.js');
const Feedback = databasemodels.Feedback;
const util = require('../../util.js');

function assignPayload(oldToken, payload) {
    var decoded = jwt.decode(oldToken, { complete: true });
    Object.assign(decoded.payload, payload);
    return jwt.sign(decoded.payload, util.secret);
}

let feedbackController = {};

feedbackController.postFeedback = function (request, response) {
    console.log("Comment: " + request.body.comment);
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });

    console.log("Userid: " + decoded.payload.userid);
    if (!decoded.payload.hasOwnProperty(request.body.eventid)) {
        request.body.userid = decoded.payload.userid;
        Feedback
            .build({
                eventid: request.body.eventid,
                eventname: request.body.eventname,
                comment: request.body.comment,
                rating: request.body.rating,
                userId: request.body.userid
            })
            .save()
            .then(myFeedback => {
                let payload = {
                    [request.body.eventid]: true,
                }
                let payloadToken = assignPayload(token, payload);
                console.log(jwt.decode(payloadToken, { complete: true }));
                console.log('Successfully added Commment')
                response.status(200).send({
                    'Success': 'Added Comment Successfully',
                    token: payloadToken
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured'
                })
            })
    } else {
        response.status(403).send({
            'failed': 'You already made a comment on this topic'
        })
    }

};

feedbackController.deleteFeedback = function (request, response) {
    console.log(request.body.id);
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    console.log("Check content of jwt: " + decoded.payload.hasOwnProperty(request.body.eventid));
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        request.body.userid = decoded.payload.userid;
        console.log(decoded.payload.userid);
        Feedback.destroy({
            where: {
                eventid: request.body.eventid,
                userId: request.body.userid
            }
        }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
            if (rowDeleted === 1) {
                console.log('Deleted successfully');
                let res = Object.assign({}, decoded);
                delete res[request.body.eventid];
                let newToken = jwt.sign(res.payload, util.secret);
                console.log("removeComment Token: " + jwt.decode(newToken, { complete: true }))
                response.status(200).send({
                    'success': 'Deleted Feedback',
                    'token': newToken
                })
            }
        },
            function (error) {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured for this deletion'
                })
            });
    } else {
        response.status(403).send({
            'failed': 'You can only delete your own feedback',
            'token': token
        })
    }
}

feedbackController.getFeedback = function(request, response){
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    Feedback.findAll({
        where: {
            eventid: request.body.eventid,
            eventname: request.body.eventname
        }
    }).then(feedbacks => {
        if (feedbacks.length > 0) {
            response.status(200);
            response.send({
                'success': feedbacks,
                'token': token
            });
        } else {
            response.status(404).send({
                'failed': 'No matching comments',
                'token': token
            })
        }
    }).catch(error => {
        console.log(error);
        response.status(500).send({
            'failed': 'Error occured while fetching',
            'token': token
        })
    })
};

feedbackController.updateRating = function(request,response){
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        Feedback.update({
            rating: request.body.rating
        },
            {
                where: { id: request.body.id }
            }
        )
            .then(function (result) {
                response.status(200).send({
                    'success': 'Rating updated',
                    'token': token
                })
            }).catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',
                    'token': token
                })
            })

    } else {
        response.status(403).send({
            'failed': 'You can only edit your own ratings',
            'token': token
        })
    }

}

feedbackController.updateComment = function(request,response){
    var token = request.body.token || request.query.token || request.headers['x-access-token'];
    console.log(' Das Token' + token);
    if (!token) return response.status(401).send({ auth: false, message: 'No token provided.' });
    var decoded = jwt.decode(token, { complete: true });
    if (decoded.payload.hasOwnProperty(request.body.eventid)) {
        Feedback.update({
            comment: request.body.comment
        },
            {
                where: { id: request.body.id }
            }
        )
            .then(function (result) {
                response.status(200).send({
                    'success': 'Comment updated',
                    'token': token
                })
            }).catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',
                    'token': token
                })
            })

    } else {
        response.status(403).send({
            'failed': 'You can only edit your own comments',
            'token': token
        })
    }

};


module.exports = {
    feedbackController: feedbackController,
}
