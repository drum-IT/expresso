const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(cors());

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`The server is now listening for requests on port ${PORT}.`)
});

module.exports = app;