const express = require(`express`);
const menuItemsRouter = express.Router({ mergePrams: true });

const sqlite3 = require(`sqlite3`);
const db = new sqlite3.Database(process.env.TEST_DATABASE || `./database.sqlite`);

menuItemsRouter.param(`id`, (req, res, next, id) => {
  req.menuItemId = Number(id);
  next();
});

menuItemsRouter.use(`/:id`, (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, (err, menuItem) => {
    if (!menuItem) {
      return res.status(404).send();
    } else {
      next();
    }
  });
});

menuItemsRouter.use((req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.menuId}`, (err, menu) => {
    if (!menu) {
      return res.status(404).send();
    } else {
      if (req.body.menuItem) {
        const newMenuItem = req.body.menuItem;
        if (!newMenuItem.name || !newMenuItem.description || !newMenuItem.inventory || !newMenuItem.price) {
          return res.status(400).send();
        } else {
          req.menuItem = {
            $name: newMenuItem.name,
            $description: newMenuItem.description,
            $inventory: newMenuItem.inventory,
            $price: newMenuItem.price
          }
        }
      }
      next();
    }
  });
});

menuItemsRouter.get(`/`, (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.menuId}`, (err, menuItems) => {
    res.status(200).send({ menuItems: menuItems });
  });
});

menuItemsRouter.post(`/`, (req, res, next) => {
  db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, ${req.menuId})`, req.menuItem, function() {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (err, menuItem) => {
      res.status(201).send({ menuItem: menuItem });
    });
  });
});

menuItemsRouter.put(`/:id`, (req, res, next) => {
  db.run(`UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE MenuItem.id = ${req.menuItemId}`, req.menuItem, function() {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, (err, menuItem) => {
      res.status(200).send({ menuItem: menuItem });
    });
  });
});

menuItemsRouter.delete(`/:id`, (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE MenuItem.id = ${req.menuItemId}`, function() {
    res.status(204).send();
  });
});

module.exports = menuItemsRouter;