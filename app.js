// Boilerplate code
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');
var session = require("cookie-session");

var morgan = require("morgan");

var db = require('./models');

var request = require('request');
app.use(bodyParser.urlencoded({
    extended: true
}));
var loginMiddleware = require("./middleware/loginHelper");
var routeMiddleware = require("./middleware/routeHelper");

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(morgan('tiny'));
app.use(express.static(__dirname + '/public'));

// creating the session
app.use(session({
    maxAge: 3600000,
    secret: 'itsasecret',
    name: "snickerdoodle"
}));

// use loginMiddleware everywhere!
app.use(loginMiddleware);



// start server
app.listen(6000, function() {
    console.log('server running on port 6000');
});