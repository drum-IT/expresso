const express = require(`express`); // require express for routing
const employeesRouter = express.Router(); // create a router for employee requests
const timesheetsRouter = require(`./timesheets`); // require the timesheetsRouter for timesheet related requests

const sqlite3 = require(`sqlite3`); // required sqlite3 for DB management
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`); // connect to the DB file

// attach the employee ID parameter to the request
employeesRouter.param(`id`, (req, res, next, id) => {
  req.employeeId = Number(id);
  next();
});

// validate employee ID
employeesRouter.use('/:id', (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, { $employeeId: req.employeeId }, (err, employee) => {
    if (!employee) {
      res.status(404).send(); // send 404 if there is no employee with this ID.
    } else {
      req.employee = employee; // attach the employee to the request so I don't have to get it again.
      next();
    }
  });
});

employeesRouter.use(`/:id/timesheets`, timesheetsRouter); // use the timesheetsRouter for timesheet requests

// if the request body has an employee object attached, validate it.
employeesRouter.use((req, res, next) => {
  if (req.body.employee) {
    // make sure the employee object has all of the required info
    const newEmployee = req.body.employee;
    if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
      res.status(400).send(); // send a 404 if the employee object is missing any required info
    } else {
      // if the employee object is valid, attach it to the request body in a SQL placeholder format
      req.newEmployee = {
        $name: newEmployee.name,
        $position: newEmployee.position,
        $wage: newEmployee.wage
      };
      next();
    }
  } else {
    next(); // if there is no employee object, just move to the next route
  }
});

// query for and send back all employees
employeesRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE Employee.is_current_employee = 1`, (err, employees) => {
    if (err) {
      res.status(500).send();
    } else {
      res.status(200).send({ employees: employees });
    }

  });
});

// send a single employee back. Employee is already attached to the request, no need to query again.
employeesRouter.get(`/:id`, (req, res, next) => {
  res.status(200).send({ employee: req.employee });
});

// create a new employee record, and send the newly created employee back
employeesRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`, req.newEmployee, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (err, employee) => {
      if (err) {
        res.status(500).send();
      } else {
        res.status(201).send({ employee: employee });
      }
    });
  });
});

// update an existing employee record, and send the updated employee record back
employeesRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE Employee.id = ${req.employeeId}`, req.newEmployee, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
      if (err) {
        res.status(500).send();
      } else {
        res.status(200).send({ employee: employee });
      }
    });
  });
});

// set an employee's 'is_current_employee' property to 0 when deleting
employeesRouter.delete(`/:id`, (req, res, next) => {
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${req.employeeId}`, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employeeId}`, (err, employee) => {
      if (err) {
        res.status(500).send();
      } else {
        res.status(200).send({ employee: employee });
      }
    });
  });
});

module.exports = employeesRouter;