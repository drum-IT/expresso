const bodyParser = require(`body-parser`); // require some body parsing middleware
const cors = require(`cors`); // require some middleware for cross-origin resource sharing
const express = require(`express`); // require express for routing
const morgan = require(`morgan`); // require some logging middleware

const apiRouter = require(`./api/api`); // require apiRouter for all /api requests

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(`public`));

app.use(morgan(`dev`)); // logging

app.use(bodyParser.json()); // body parsing
app.use(cors()); // cross-origin resource sharing

app.use(`/api`, apiRouter); // use the apiRouter for /api requests

app.listen(PORT, () => {
  console.log(`The server is now listening for requests on port ${PORT}.`)
});

module.exports = app;