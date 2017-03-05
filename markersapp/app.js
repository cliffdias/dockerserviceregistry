const http = require('http'),
  fs = require('fs'),
  path = require('path'),
  env = process.env,
  express = require("express"),
  markersdb = require('./dbhandler.js');

var morgan = require('morgan');
var bodyParser = require('body-parser');

var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});

var RMGTrackITAPI = function () {
  // Scope.
  var self = this;

	/**
	 * Set up server IP address and port # using env variables/defaults.
	 */
  self.setupVariables = function () {
    // Set the environment variables we need.
    self.ipaddress = env.NODE_IP;
    self.port = process.env.NODECELLAR_PORT || 3000;

    if (typeof self.ipaddress === "undefined") {
      // Log errors on OpenShift but continue w/ 127.0.0.1 - this
      // allows us to run/test the app locally.
      console.warn('No env.NODE_IP var, using 127.0.0.1');
      self.ipaddress = "127.0.0.1";
    };
  };

  /**
   * Create GET Routes
   */
  self.createGetRoutes = function () {
    console.log('Initialising Get Routes');
    self.routes = {};

    self.routes['/locations/:id'] = markersdb.findById;

    self.routes['/health'] = function (req, res) {
      res.writeHead(200);
      res.end();
    };

    self.routes['/test'] = function (req, res) {
      res.send('<htlml>I am alive !!</html>');
    };

    self.routes['/'] = function (req, res) {
      res.writeHead(200);
      res.end();
    };

  }



  /**
   * Initialize the server (express) and create the routes and register the
   * handlers.
   */
  self.initializeServer = function () {

    self.createGetRoutes();

    self.app = express();

    self.app.use(bodyParser.urlencoded({ extended: false }));
    self.app.use(bodyParser.json());

    self.app.use(morgan('combined', {stream: accessLogStream}));

    self.app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    process.on('uncaughtException', function (err) {
      console.log(err);
    });

    console.log(self.routes.length);

    // Add handlers for the app (from the routes).
    for (var r in self.routes) {
      self.app.route(r).get(self.routes[r]);
    }

  };

  /**
   * terminator === the termination handler Terminate server on receipt of the
   * specified signal.
   * 
   * @param {string}
   *            sig Signal to terminate on.
   */
  self.terminator = function (sig) {
    if (typeof sig === "string") {
      console.log('%s: Received %s - terminating sample app ...',
        Date(Date.now()), sig);
      process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()));
  };


  /**
   * Setup termination handlers (for exit and a list of signals).
   */
  self.setupTerminationHandlers = function () {
    // Process on exit and signals.
    process.on('exit', function () { self.terminator(); });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
      'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function (element, index, array) {
      process.on(element, function () { self.terminator(element); });
    });
  };

  /**
   * Initializes the sample application.
   */
  self.initialize = function () {
    console.log('Initialising Server');

    self.setupVariables();
    self.setupTerminationHandlers();

    // Create the express server and routes.
    self.initializeServer();
  };


  /**
   * Start the server (starts up the sample application).
   */
  self.start = function () {
    http.createServer(self.app).listen(self.port, function () {
      console.log('Node server started on  ... ' + self.port);
    });

  };
}

var RMGTrackIT = new RMGTrackITAPI();

RMGTrackIT.initialize();
RMGTrackIT.start();
