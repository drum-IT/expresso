const express = require(`express`); // require express for routing
const menuItemsRouter = express.Router({ mergePrams: true }); // create a router for timesheet requests. merge parameters to allow access to parent route parameters

const sqlite3 = require(`sqlite3`); // required sqlite3 for DB management
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`); // connect to the DB file

// attach the menu item ID to the request
menuItemsRouter.param(`id`, (req, res, next, id) => {
  req.menuItemId = Number(id);
  next();
});

// validate menu item ID
menuItemsRouter.use(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, (err, menuItem) => {
    if (!menuItem) {
      res.status(404).send(); // send 404 if there is no menu item with this ID.
    } else {
      req.menuItem = menuItem; //attach the menu item to the request so I don't have to get it again.
      next();
    }
  });
});

// if the request body has a menu object attached, validate it.
menuItemsRouter.use((req, res, next) => {
  if (req.body.menuItem) {
    // make sure the menu item object has all of the required info
    const newMenuItem = req.body.menuItem;
    if (!newMenuItem.name || !newMenuItem.description || !newMenuItem.inventory || !newMenuItem.price) {
      return res.status(400).send(); // send 400 if this menu item is missing required info
    } else {
      // if the menu item object is valid, attach it to the request body in a SQL placeholder format
      req.newMenuItem = {
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price
      };
      next();
    }
  } else {
    next(); // if there is no menu item object, just move to the next route
  }
});

// query for and send all menu items for the current menu
menuItemsRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.menuId}`, (err, menuItems) => {
    res.status(200).send({ menuItems: menuItems });
  });
});

// create a new menu item, send the newly created menu item back
menuItemsRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, ${req.menuId})`, req.newMenuItem, function() {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (err, menuItem) => {
      res.status(201).send({ menuItem: menuItem });
    });
  });
});

// update a menu item. send the updated menu item back
menuItemsRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE MenuItem.id = ${req.menuItemId}`, req.newMenuItem, function() {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, (err, menuItem) => {
      res.status(200).send({ menuItem: menuItem });
    });
  });
});

// delete a menu item
menuItemsRouter.delete(`/:id`, (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, function() {
    res.status(204).send();
  });
});

module.exports = menuItemsRouter; //export the menuItemsRouter for us in the menus.js