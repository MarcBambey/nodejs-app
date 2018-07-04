const feedbackController = require('./controllers/feedbackcontroller');

/** 
 * Defines the routes used
*/
let routes = [
    { method: "post", uri: "/feedback", controller: feedbackController.postFeedback },
    { method: "delete", uri: "/feedback", controller: feedbackController.deleteFeedback },
    { method: "post", uri: "/getfeedback", controller: feedbackController.getFeedback },
    { method: "put", uri: "/updateRating", controller: feedbackController.updateRating },
    { method: "put", uri: "/updateComment", controller: feedbackController.updateComment },
];
/**
 *This function loads all the routes used.
 * @param {*} router the express router used
 */
function loadRoutes(router) {
    for (let route of routes) {
        router[route.method](route.uri, route.controller)
    }
}

module.exports = {
    loadRoutes: loadRoutes,
}