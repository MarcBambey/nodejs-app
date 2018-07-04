const feedbackController = require('./controllers/feedbackcontroller');

/** 
 * Defines the routes used
*/
let routes = [
    { method: "post", uri: "/events/:id/feedback", controller: feedbackController.postFeedback },
    { method: "delete", uri: "/events/:id/feedback/:feedbackid", controller: feedbackController.deleteFeedback },
    { method: "get", uri: "/events/:id/feedbacks", controller: feedbackController.getFeedback },
    { method: "put", uri: "/events/:id/feedback/:feedbackid/rating", controller: feedbackController.updateRating },
    { method: "put", uri: "/events/:id/feedback/:feedbackid/comment", controller: feedbackController.updateComment },
    
];
/**
 *This function loads all the routes used.
 * @param {*} router the express router used
 */
function loadRoutes(express) {
    let router = express.Router();
    for (let route of routes) {
        router[route.method](route.uri, route.controller)
    }
     return router;
}

module.exports = {
    loadRoutes: loadRoutes,
}