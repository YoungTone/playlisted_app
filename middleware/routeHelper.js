var db = require("../models");

var routeHelpers = {
  ensureLoggedIn: function(req, res, next) {
    if (req.session.id !== null && req.session.id !== undefined) {
      return next();
    }
    else {
     res.redirect('/login');
    }
  },
 // authorization 
  ensureCorrectUser: function(req, res, next) {
    db.Song.findById(req.params.id, function(err,song){
      if (song.ownerId !== req.session.id) {
        res.redirect('/playlists');
      }
      else {
       return next();
      }
    });
  },
// if you are already logged in or signed up prevent it
  preventLoginSignup: function(req, res, next) {
    if (req.session.id !== null && req.session.id !== undefined) {
      res.redirect('/playlists');
    }
    else {
     return next();
    }
  }
};
module.exports = routeHelpers;