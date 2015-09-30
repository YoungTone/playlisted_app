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

// Root
app.get('/', routeMiddleware.ensureLoggedIn, function(req, res) {
    res.render('users/index');
});

// Signup/Login

app.get('/signup', routeMiddleware.preventLoginSignup, function(req, res) {
    res.render('users/signup');
});

app.post("/signup", function(req, res) {
    var newUser = req.body.user;
    console.log(newUser);
    db.User.create(newUser, function(err, user) {
        console.log(err);
        console.log("user is", user);
        if (user) {
            console.log(user);
            req.login(user);
            res.redirect("/playlists");
        } else {
            res.render("users/signup");
        }
    });
});

app.get("/login", routeMiddleware.preventLoginSignup, function(req, res) {
    res.render("users/login");
});

app.post("/login", function(req, res) {
    db.User.authenticate(req.body.user,
        function(err, user) {
            if (!err && user !== null) {
              console.log('LOGIN USER id', user.id);
                req.login(user);
                res.redirect("/playlists");
            } else {
                res.render("users/login");
            }
        });
});

app.get('/playlists', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Playlist.find({}, function(err, playlist) {
        res.render('playlists/index', {
            playlist: playlist
        });
    });
});

// GET request for new playlist
app.get('/playlists/new', function(req, res) {
    res.render('playlists/new');
});

// CREATE new playlist
app.post('/playlists', routeMiddleware.ensureLoggedIn, function(req, res) {
    var playlist = new db.Playlist(req.body.playlist);
    playlist.user = req.session.id;
    playlist.save(function(err, playlist) {
        res.redirect("/playlists");
    });
});

// displaying form to edit
app.get('/playlists/:id/edit', function(req, res) {
    db.Playlist.findById(req.params.id, function(err, playlist) {
        err ? res.send(err) : res.render('playlists/edit', {
            playlist: playlist
        });
    });

});

// update a specific playlist with data from edit
app.put('/playlists/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res) {
    db.Playlist.findByIdAndUpdate(req.params.id, req.body.playlist, function(err, playlist) {
        err ? res.send(err) : res.redirect('/playlists');
    });
});

// deleting a playlist
app.delete('/playlists/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res) {
    db.Playlist.findByIdAndRemove(req.params.id, function(err, playlist) {
        res.redirect('/playlists');
    });
});


// logout
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});

// start server
app.listen(9000, function() {
    console.log('power level over 9000');
});