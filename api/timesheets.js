const express = require(`express`);
const timesheetsRouter = express.Router({ mergePrams: true });

const sqlite3 = require(`sqlite3`);
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`);

timesheetsRouter.param(`id`, (req, res, next, id) => {
  req.timesheetId = Number(id);
  next();
});

timesheetsRouter.use(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
    if (!timesheet) {
      res.status(404).send();
    } else {
      next();
    }
  });
});

timesheetsRouter.use((req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
    if (!employee) {
      return res.status(404).send();
    }
  });
  if (newTimesheet) {
    if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.hours) {
      return res.status(400).send();
    } else {
      req.timesheet = newTimesheet;
      req.timesheet.employee_id = req.employeeId;
      req.values = {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date
      };
    }
  }
  next();
});

timesheetsRouter.get(`/`, (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
    if (employee) {
      db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.employeeId}`, (err, timesheets) => {
        res.status(200).send({ timesheets: timesheets });
      });
    } else {
      return res.status(404).send();
    }
  });
});

timesheetsRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, ${req.employeeId})`, req.values, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
      res.status(201).send({ timesheet: timesheet });
    });
  });
});

timesheetsRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE Timesheet.id = ${req.timesheetId}`, req.values, function() {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, (err, timesheet) => {
      res.status(200).send({ timesheet: timesheet });
    });
  });
});

timesheetsRouter.delete(`/:id`, (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${req.timesheetId}`, function() {
    res.status(204).send();
  });
});

module.exports = timesheetsRouter;