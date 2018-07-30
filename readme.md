# Configuration

## Database Setup

You need to setup a PostGres Database and enter the details in the databasemodels.js to match your database. Currently PostGres is used but it can be replaced with any other database.

```
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'yourhost',
  dialect: 'mysql'|'sqlite'|'postgres'|'mssql',

```

## Starting the Server
To start the server simply run "npm start".