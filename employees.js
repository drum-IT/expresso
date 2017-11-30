const express = require('express');
const sqlite3 = require('sqlite3'); //import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// create a router for employees
employeesRouter = express.Router();

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (err, rows) => {
    res.send({employees: rows});
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.get('SELECT * FROM Employee WHERE id = $employeeId', {$employeeId: employeeId}, (err, row) => {
    if (row) {
      res.status(200).send({employee: row});
    } else {
      res.status(404).send();
    } 
  });
});

employeesRouter.post('/', (req, res, next) => {
  const employee = req.body.employee;
  console.log(employee);
  db.run('INSERT INTO Employee (name, position, wage) VALUES (employee.name, employee.position, employee.wage)', function() {
  });
  res.status(201).send({employee: employee});
});

module.exports = employeesRouter;