const feedbackController = require('./controllers/feedbackcontroller');
const passwordController = require ('./controllers/passwordcontroller');

/** 
 * Defines the routes used
*/
let routes = [
    { method: "post", uri: "/events/:id/feedback", controller: feedbackController.postFeedback },
    { method: "delete", uri: "/events/:id/feedback/:feedbackid", controller: feedbackController.deleteFeedback },
    { method: "get", uri: "/events/feedbacks", controller: feedbackController.getFeedback },
    { method: "put", uri: "/events/:id/feedback/:feedbackid/rating", controller: feedbackController.updateRating },
    { method: "put", uri: "/events/:id/feedback/:feedbackid/comment", controller: feedbackController.updateComment },
    { method: "get", uri: "/events/userdata", controller: feedbackController.getUserData },
    {method: "get", uri: "/events/password", controller: passwordController.confirmTokenPassword},
    {method: "post", uri: "/events/password", controller: passwordController.checkPassword},

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