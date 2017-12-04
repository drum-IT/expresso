const express = require(`express`);
const employeesRouter = express.Router();

const timesheetsRouter = require(`./timesheets`);

const sqlite3 = require(`sqlite3`);
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`);

employeesRouter.param(`id`, (req, res, next, id) => {
  req.employeeId = Number(id);
  next();
});

employeesRouter.use(`/:id/timesheets`, timesheetsRouter);

employeesRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE Employee.is_current_employee = 1`, (err, employees) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({ employees: employees });
    }
  });
});

employeesRouter.get(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, { $employeeId: req.params.id }, (err, employee) => {
    if (employee) {
      res.status(200).send({ employee: employee });
    } else {
      return res.status(404).send();
    }
  });
});

employeesRouter.post(`/`, (req, res, next) => {
  const newEmployee = req.body.employee;
  const values = {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage
  };
  if (!values.$name || !values.$position || !values.$wage) {
    return res.status(400).send();
  }
  db.run(`INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`, values, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (err, employee) => {
      if (err) {
        return res.status(400).send();
      } else {
        res.status(201).send({ employee: employee });
      }
    });
  });
});

employeesRouter.put(`/:id`, (req, res, next) => {
  const employeeId = req.params.id;
  const updatedEmployee = req.body.employee;
  const values = {
    $name: updatedEmployee.name,
    $position: updatedEmployee.position,
    $wage: updatedEmployee.wage
  };
  if (!values.$name || !values.$position || !values.$wage) {
    return res.status(400).send();
  }
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE Employee.id = ${employeeId}`, values, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (err, employee) => {
      if (err) {
        return res.status(400).send();
      } else {
        res.status(200).send({ employee: employee });
      }
    });
  });
});

employeesRouter.delete(`/:id`, (req, res, next) => {
  const employeeId = req.params.id;
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${employeeId}`, function() {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (err, employee) => {
      if (err) {
        return res.status(400).send();
      } else {
        res.status(200).send({ employee: employee });
      }
    });
  });
});

module.exports = employeesRouter;