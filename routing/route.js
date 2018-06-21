const feedbackController = require('./controllers/feedbackcontroller');

let routes = [
    { method: "post", uri: "/feedback", controller: feedbackController.feedbackController.postFeedback },
    { method: "delete", uri: "/feedback", controller: feedbackController.feedbackController.deleteFeedback },
    { method: "post", uri: "/getfeedback", controller: feedbackController.feedbackController.getFeedback },
    {method: "post", uri: "/updateRating", controller: feedbackController.feedbackController.updateRating},
    {method: "post", uri: "/updateComment", controller: feedbackController.feedbackController.updateComment},
];
function loadRoutes(router) {
    for (let route of routes) {
        router[route.method](route.uri, route.controller)
    }
}

module.exports = {
    loadRoutes: loadRoutes,
}