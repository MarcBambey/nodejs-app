const Sequelize = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres', 'root', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    operatorsAliases: false,
});

/**
 * This defines the user table with its attributes
 * 
 */
const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }
})

/**
 * This define the Feedback table with its attributes
 */
const Feedback = sequelize.define('feedback', {
    eventid: Sequelize.INTEGER,
    comment: Sequelize.STRING,
    rating: Sequelize.INTEGER,
    eventname: Sequelize.STRING,
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: Sequelize.INTEGER,
        references: {
            model: 'users',
            key: 'id',
        }
    }
});

module.exports = {
    Feedback: Feedback,
    User: User,
    sequelize: sequelize,
};