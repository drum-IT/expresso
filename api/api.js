const express = require(`express`); // require express for routing
const apiRouter = express.Router(); // create a router for all requests to the /api endpoint

const employeesRouter = require(`./employees.js`); // require the employeesRouter for all employee related requests
const menusRouter = require(`./menus.js`); // require the menussRouter for all menu related requests

apiRouter.use(`/employees`, employeesRouter); // use the employeesRouter for all employee related requests
apiRouter.use(`/menus`, menusRouter); // use the menussRouter for all menu related requests

module.exports = apiRouter; // export the api router for use in server.js