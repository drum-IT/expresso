const express = require('express');
const sqlite3 = require('sqlite3'); //import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// create a router for employees
menusRouter = express.Router();

menusRouter.param('id', (req, res, next, id) => {
  req.menuId = id;
  next();
});

menusRouter.use('/:id', (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menuId}`, (err, menu) => {
    if (!menu) {
      return res.status(404).send();
    }
  });
  if (req.body.menu) {
    const newMenu = req.body.menu;
    console.log(newMenu);
    req.menu = {
      $title: newMenu.title
    };
  }
  next();
});

menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    res.send({ menus: menus });
  });
});

menusRouter.get('/:id', (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menuId}`, (err, menu) => {
    res.send({ menu: menu });
  });
});

menusRouter.post('/', (req, res, next) => {
  console.log(req.menu);
  db.run(`INSERT INTO Menu (title) VALUES ($title)`, req.menu, function() {
    db.get(`SELECT * FROM Menu WHERE id = ${req.menuId}`, (err, menu) => {
      res.status(201).send({ menu: menu });
    });
  });
});

module.exports = menusRouter;