const express = require('express');
const sqlite3 = require('sqlite3'); //import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// create a router for employees
menusRouter = express.Router();

menusRouter.get('/', (req, res, next) => {
  res.send();
});

module.exports = menusRouter;