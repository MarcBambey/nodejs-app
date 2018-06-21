const databasemodels = require('../database/databasemodels');
const User = databasemodels.User;
const Feedback = databasemodels.Feedback;

/**
 *This function initializes the database.
 *It creates the Feedback and User table and drops any previously existing tables of that kind
 *The foreign key in Feedback is also set.
 *
 */
function initiateDatabase() {
    User.sync({ force: true }).then(() => {
    });
    Feedback.sync({ force: true }).then(() => {
        // Table created
        console.log("Table created");
    });
 User.hasOne(Feedback);
}

module.exports = {
    initiateDatabase: initiateDatabase,
};
