var jwt = require('jsonwebtoken');
const databasemodels = require('../../database/databasemodels.js');
const Feedback = databasemodels.Feedback;
let util = require('../../util.js');


/**
 * The feedbackController object
 */
let feedbackController = {};

/**
 * This function checks if a token is sent and if not returns an errormessage
 * The token gets decoded and its paylod is checked for the eventid to make sure
 * the user can't post 2 feedbacks on the same event.
 * The new Feedback is written to the database
 *  A new token is generated with updated information regarding the users feedbacks
 * On success a success message and the new token is returned in the response.
 * On a database failure it returns an error message.
 * On an attempt of a duplicate comment it returns another error message accordingly.
 * @param {*} request the request
 * @param {*} response the response that will be send
 */
feedbackController.postFeedback = function (request, response) {
    if (!request.token.payload.hasOwnProperty(request.body.eventid)) {
        request.body.userid = request.token.payload.userid;
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
                util.assignPayload(payload, request, response);
                response.status(200).send({
                    'Success': 'Added Comment Successfully',
                })
            })
            .catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured',
                })
            })
    } else {
        response.status(403).send({
            'failed': 'You already made a comment on this topic',
        })
    }
};



/**
 * This function checks if a token is sent and if not returns an errormessage
 * The token gets decoded and the payloads content is checked on whether the user has
 * made a Feedback on the event he wants to delete from.
 * If not an error message is returned.
 * The feedback matching the eventid and the userId is getting removed from the database.
 * A new token with updated information is created and send in the response together with a success message.
 * On database error an error message is returned.
 * @param {*} request The request
 * @param {*} response The response
 */
feedbackController.deleteFeedback = (request, response) => {
    if (request.token.payload.hasOwnProperty(request.params.id)) {
        Feedback.destroy({
            where: {
                eventid: request.params.id,
                userId: request.token.payload.userid
            }
        }).then((rowDeleted) => {
            if (rowDeleted === 1) {
                util.deleteTokenKey(request, response, request.params.id);
                response.status(200).send({
                    'success': 'Deleted Feedback'
                })
            }
        }, (error) => {
            response.status(500).send({
                'failed': 'Error occured for this deletion'
            })
        });
    } else {
        response.status(403).send({
            'failed': 'You can only delete your own feedback'
        })
    }
}

/**
 * This function finds all Feedback entries that match the search criterias in the request body.
 * It returns a success message and the found feedbacks in the response
 * If no matches are found or a database error occurs a error message is returned instead.
 * @param {*} request The request
 * @param {*} response The response
 */
feedbackController.getFeedback = function (request,response) {
    console.log("In GetFeedback");
    Feedback.findAll()
    .then(feedbacks => {
        if (feedbacks.length > 0) {
            response.status(200);
            response.send({
                'success': feedbacks,
            });
        } else {
            response.status(404).send({
                'failed': 'No matching comments',
            })
        }
    }).catch(error => {
        console.log(error);
        response.status(500).send({
            'failed': 'Error occured while fetching',
        })
    })
};

/** 
 * This function checks if a token is sent and if not returns an errormessage
 * The token gets decoded and the payloads content is checked on whether the user has
 * made a Feedback on the event he wants to update.
 * If there is no match in the token a error message is returned.
 * The matching database entry gets their rating updated.
 * If a databse error occurs an apporpriate error is returned.
 * On success a success message is returned.
*/
feedbackController.updateRating = function (request, response) {
    if (request.token.payload.hasOwnProperty(request.params.id)) {
        Feedback.update({
            rating: request.body.rating
        },
            {
                where: { id: request.params.feedbackid }
            }
        )
            .then(function (result) {
                response.status(200).send({
                    'success': 'Rating updated',
                })
            }).catch(error => {
                console.error(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',
                })
            })
    } else {
        response.status(403).send({
            'failed': 'You can only edit your own ratings',
        })
    }
}

/** 
 * This function checks if a token is sent and if not returns an errormessage
 * The token gets decoded and the payloads content is checked on whether the user has
 * made a Feedback on the event he wants to update.
 * If there is no match in the token a error message is returned.
 * The matching database entry gets their comment updated.
 * If a databse error occurs an apporpriate error is returned.
 * On success a success message is returned.
*/
feedbackController.updateComment = function (request, response) {
    if (request.token.payload.hasOwnProperty(request.params.id)) {
        Feedback.update({
            comment: request.body.comment
        },
            {
                where: { id: request.params.feedbackid }
            }
        )
            .then(function (result) {
                response.status(200).send({
                    'success': 'Comment updated',

                })
            }).catch(error => {
                console.log(error);
                response.status(500).send({
                    'failed': 'Error occured while updating',

                })
            })

    } else {
        response.status(403).send({
            'failed': 'You can only edit your own comments',

        })
    }

};


module.exports = feedbackController;
