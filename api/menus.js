const express = require('express');
const menusRouter = express.Router();

const menuItemsRouter = require('./menuItems')

const sqlite3 = require('sqlite3'); //import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('id', (req, res, next, id) => {
  req.menuId = id;
  next();
});

menusRouter.use('/:id/menu-items', menuItemsRouter);

menusRouter.use('/', (req, res, next) => {
  if (req.body.menu) {
    req.menu = {
      $title: req.body.menu.title
    };
    if (!req.menu.$title) {
      res.status(400).send();
    } else {
      next();
    }
  } else {
    next();
  }
});

menusRouter.use('/:id', (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menuId}`, (err, menu) => {
    if (!menu) {
      res.status(404).send();
    } else {
      next();
    }
  });
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
    db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, menu) => {
      res.status(201).send({ menu: menu });
    });
  });
});

menusRouter.put('/:id', (req, res, next) => {
  db.run(`UPDATE Menu SET title = $title WHERE Menu.id = ${req.menuId}`, req.menu, function() {
    db.get(`SELECT * FROM Menu WHERE id = ${req.menuId}`, (err, menu) => {
      res.status(200).send({ menu: menu });
    });
  });
});

menusRouter.delete('/:id', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.menuId}`, (err, menuItems) => {
    if (menuItems.length > 0) {
      res.status(400).send();
    } else {
      db.run(`DELETE FROM Menu WHERE Menu.id = ${req.menuId}`, function() {
        res.status(204).send();
      });
    }
  });
});

module.exports = menusRouter;