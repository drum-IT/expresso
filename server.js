const express = require('express'); //import express for routing
const morgan = require('morgan'); //import morgan for logging
const bodyParser = require('body-parser'); //import body-parser for request body parsing
const sqlite3 = require('sqlite3'); //import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

//logging
app.use(morgan('dev'));

//body parsing
app.use(bodyParser.json());

//routers
const employeesRouter = require('./employees');
app.use('/api/employees', employeesRouter);

const menusRouter = require('./menus');
app.use('/api/menus', menusRouter);

app.listen(PORT, () => {
  console.log(`The server is now listening for requests on port ${PORT}.`)
});

module.exports = app;