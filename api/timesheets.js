const express = require('express');
const timesheetsRouter = express.Router({ mergePrams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// attach the request id paramater to the request body as a timesheetId property
timesheetsRouter.param('id', (req, res, next, id) => {
  req.timesheetId = Number(id);
  next();
});

timesheetsRouter.use('/:id', (req, res, next) => {
  // if this is a put or delete request, make sure the timesheet exists
  console.log('this is a PUT or DELETE: ' + req.timesheetId);
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
    if (!timesheet) {
      console.log('no timesheet. should 404');
      res.status(404).send(); // if the timesheet id is not found, return a 404
    } else {
      next();
    }
  });
});

// check for valid employees, timesheets, and timesheet values
timesheetsRouter.use((req, res, next) => {
  const newTimesheet = req.body.timesheet;
  // if an employee with the current employee does not exist, return a 404 to stop routing
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
    if (!employee) {
      return res.status(404).send();
    }
  });
  // if the request has a timesheet attached, validate it
  if (newTimesheet) {
    if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.hours) {
      return res.status(400).send(); // if the timesheet is missing info, return a 404
    } else {
      // attach the updated timesheet to the request, along with the employee ID
      req.timesheet = newTimesheet;
      req.timesheet.employee_id = req.employeeId;
      // attach placeholders to request for use in SQL queries
      req.values = {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date
      };
    }
  }
  next();
});

// get all timesheets matching the current employee id
timesheetsRouter.get('/', (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
    if (employee) {
      db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.employeeId}`, (err, timesheets) => {
        res.status(200).send({ timesheets: timesheets });
      });
    } else {
      res.status(404).send();
    }
  });
});

// create a new timesheet for the current employee
timesheetsRouter.post('/', (req, res, next) => {
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, ${req.employeeId})`, req.values, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
      res.status(201).send({ timesheet: timesheet });
    });
  });
});

timesheetsRouter.put('/:id', (req, res, next) => {
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = ${req.timesheetId}`, req.values, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
      res.status(200).send({ timesheet: timesheet });
    });
  });
});

module.exports = timesheetsRouter;