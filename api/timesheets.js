const express = require(`express`); // require express for routing
const timesheetsRouter = express.Router({ mergePrams: true }); // create a router for timesheet requests. merge parameters to allow access to parent route parameters

const sqlite3 = require(`sqlite3`); // required sqlite3 for DB management
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`); // connect to the DB file

// attache the timesheet ID parameter to the request body
timesheetsRouter.param(`id`, (req, res, next, id) => {
  req.timesheetId = Number(id);
  next();
});

// validate timesheet ID
timesheetsRouter.use(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
    if (!timesheet) {
      res.status(404).send(); // send 404 if there is no timesheet with this ID.
    } else {
      req.timesheet = timesheet; //attach the timesheet to the request so I don't have to get it again.
      next();
    }
  });
});

// if the request body has a timesheet object attached, validate it.
timesheetsRouter.use((req, res, next) => {
  if (req.body.timesheet) {
    // make sure the timesheet object has all of the required info
    const newTimesheet = req.body.timesheet;
    if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.hours) {
      res.status(400).send(); // send 400 if this timesheet is missing required info
    } else {
      // if the timesheet object is valid, attach it to the request body in a SQL placeholder format
      req.newtimesheet = {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date
      };
      next();
    }
  } else {
    next(); // if there is no timesheet object, just move to the next route
  }
});

// query for and send back all timesheets for current employee
timesheetsRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.employeeId}`, (err, timesheets) => {
    if (err) {
      res.status(500).send(); // send a 500 for any errors
    } else {
      res.status(200).send({ timesheets: timesheets });
    }
  });
});

// create a new timesheet record, and send the newly created timesheet back
timesheetsRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, ${req.employeeId})`, req.newtimesheet, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
      if (err) {
        res.status(500).send(); // send a 500 for any errors
      } else {
        res.status(201).send({ timesheet: timesheet });
      }
    });
  });
});

// update an existing timesheet record, and send the updated timesheet back
timesheetsRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = ${req.timesheetId}`, req.newtimesheet, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
      if (err) {
        res.status(500).send(); // send a 500 for any errors
      } else {
        res.status(200).send({ timesheet: timesheet });
      }
    });
  });
});

// delete a timesheet
timesheetsRouter.delete(`/:id`, (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, function() {
    res.status(204).send();
  });
});

module.exports = timesheetsRouter; // export the timesheetsRouter for use in employees.js