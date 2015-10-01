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

// PLAYLIST ROUTES

app.get('/playlists', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Playlist.find({}, function(err, playlist) {
        res.render('playlists/index', {
            playlist: playlist
        });
    });
});

// GET request for new playlist
app.get('/playlists/new', routeMiddleware.ensureLoggedIn, function(req, res) {
    res.render('playlists/new');
});

// look up song by id and display it
app.get('/playlists/:id/', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Playlist.findById(req.params.id).populate("songs").exec(function(err, playlist) {
        res.render("playlists/show", {
            playlist: playlist
        });
    });
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
app.get('/playlists/:id/edit', routeMiddleware.ensureLoggedIn, function(req, res) {
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

// SONG ROUTES 

// Index
app.get('/playlists/:id/songs', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Playlist.findById(req.params.playlist_id).populate('songs').exec(function(err, playlist) {
        res.render('songs/index', {
            playlist: playlist
        });
    });
});

// New

app.get('/playlists/:id/songs/new', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Playlist.findById(req.params.id,
        function(err, playlist) {
            req.session.playlistId = playlist._id;
            res.render('songs/new', {
                playlist: playlist
            });
        });
});

// CREATE

app.post('/playlists/:id/songs', routeMiddleware.ensureLoggedIn, function(req, res) {
    console.log("POSTING SONG NOW");
    db.Song.create(req.body.song, function(err, song) {
        if (err) {
            console.log(err);
            res.render('songs/new');
        } else {
            console.log("SONG CREATED! SONG:", song);
            db.Playlist.findById(req.params.id, function(err, playlist) {
                playlist.songs.push(song);
                song.playlist = playlist._id;
                song.save();
                playlist.save();
                res.redirect('/playlists/' + req.params.id);
            });
        }
    });
});

// SHOW

app.get('/playlists/:id/songs/:songs_id', routeMiddleware.ensureLoggedIn, function(req, res) {
    db.Song.findById(req.params.songs_id)
        .populate('playlist')
        .exec(function(err, song) {
            res.render('songs/show', {
                song: song,
                
            });
        });
});

//  DISPLAYING EDIT FORM
app.get('/playlists/:id/songs/:songs_id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res) {
    db.Song.findById(req.params.songs_id)
        .populate('playlist')
        .exec(function(err, song) {
            res.render('songs/edit', {
                song: song,
                id: req.params.id
            });
        });
});

// UPDATE

app.put('/playlists/:id/songs/:songs_id/', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res) {
    db.Song.findByIdAndUpdate(req.params.songs_id, {
        title: req.body.song.title,
        artist: req.body.song.artist,
        album: req.body.song.album,
        year: req.body.song.year,
        genre: req.body.song.genre,
        art: req.body.song.art
    }, function(err, song) {
        if (err) {
            res.render('songs/edit');
        } else {
            res.redirect('/playlists/' + req.params.id);
        }
    });
});

// DESTORY

app.delete('/playlists/:id/songs/:songs_id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res) {
    db.Song.findByIdAndRemove(req.params.songs_id,
        function(err, song) {
            if (err) {
                console.log(err);
                res.render('songs/edit');
            } else {
                res.redirect('/playlists/' + req.params.id);
            }
        });
});

// searching api for a song
app.get("/searchresults", function(req, res) { // res our servers object that allows us to respond/ express objec that allows us to respond
    var search = encodeURIComponent(req.query.query);
    console.log(req.query);
    request.get('https://itunes.apple.com/search?term=' + search, function(error, response, body) { // response we have recieved from api/ data
        if (error) {
            res.status(500).send("You got an error - " + error);
        } else if (!error && response.statCode >= 300) {
            res.status(500).send("Something went wrong! Status: " + response.statusCode);
        }
        if (!error && response.statusCode === 200) {
            var body = JSON.parse(body);
            var song = body.results[0];
            res.render('songs/searchresults', {
                song: song,
                playlistId: req.session.playlistId,
            });
        }
    });
});

// logout
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});

// start server

app.listen(process.env.PORT || 3000, function() {
    console.log('running 3000');
});