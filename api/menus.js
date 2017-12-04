const express = require(`express`); // require express for routing
const menuItemsRouter = require(`./menuItems`); // require the menuItemsRouter for menu item related requests
const menusRouter = express.Router();// create a router for menu requests

const sqlite3 = require(`sqlite3`); // import sqlite3 for database management
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`); // connect to the DB file

// attach the menu ID parameter to the request
menusRouter.param(`id`, (req, res, next, id) => {
  req.menuId = id;
  next();
});

// validate menu ID
menusRouter.use(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menuId}`, (err, menu) => {
    if (!menu) {
      res.status(404).send();  // send 404 if there is no menu with this ID.
    } else {
      req.menu = menu; // attach the menu to the request so I don't have to get it again.
      next();
    }
  });
});

menusRouter.use(`/:id/menu-items`, menuItemsRouter); // use the timesheetsRouter for timesheet requests

// if the request body has a menu object attached, validate it.
menusRouter.use((req, res, next) => {
  if (req.body.menu) {
    // make sure the menu object has all of the required info
    const newMenu = req.body.menu;
    if (!newMenu.title) {
      res.status(400).send(); // send a 404 if the menu object is missing any required info
    } else {
      // if the menu object is valid, attach it to the request body in a SQL placeholder format
      req.newMenu = {
        $title: newMenu.title
      };
      next();
    }
  } else {
    next(); // if there is no menu object, just move to the next route
  }
});

// query for and send back all menus
menusRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    res.send({ menus: menus });
  });
});

// send a single menu back. menu is already attached to the request, no need to query again.
menusRouter.get(`/:id`, (req, res, next) => {
  res.send({ menu: req.menu });
});

// create a new menu record, and send the newly created menu back
menusRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO Menu (title) VALUES ($title)`, req.newMenu, function() {
    db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, menu) => {
      res.status(201).send({ menu: menu });
    });
  });
});

// update a menu record. send the updated menu record back
menusRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE Menu SET title = $title WHERE Menu.id = ${req.menuId}`, req.newMenu, function() {
    db.get(`SELECT * FROM Menu WHERE id = ${req.menuId}`, (err, menu) => {
      res.status(200).send({ menu: menu });
    });
  });
});

// delete a menu record if there are no items on it
menusRouter.delete(`/:id`, (req, res, next) => {
  // query for all menu items on this menu
  db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.menuId}`, (err, menuItems) => {
    if (menuItems.length > 0) {
      return res.status(400).send(); // if there are menu items on this menu, send a 400 response
    } else {
      // if there are no menu items on this menu, delete it
      db.run(`DELETE FROM Menu WHERE Menu.id = ${req.menuId}`, function() {
        res.status(204).send();
      });
    }
  });
});

module.exports = menusRouter;