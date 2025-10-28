var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');  // <-- agregado cors

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var tasksRoute = require('./routes/task');
var boletaInscripcionRouter = require('./routes/boletaInscripcion');

var apiRouter = require('./routes/api');

var workerRouter = require('./routes/worker');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors()); // <-- habilita CORS aquí
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use("/api", apiRouter);

app.use("/tasks", tasksRoute);

app.use("/worker", workerRouter);

app.use("/boleta", boletaInscripcionRouter);

module.exports = app;
