const databasemodels = require('../database/databasemodels');
const User = databasemodels.User;
const Feedback = databasemodels.Feedback;

function initiateDatabase() {
    User.sync({ force: true }).then(() => {
        // Table created
        return User.id;
    });
    
    
    Feedback.sync({ force: true }).then(() => {
        // Table created
        console.log("Table created");
    });
    
    User.hasOne(Feedback);
}

module.exports = {
    initiateDatabase : initiateDatabase,
};
