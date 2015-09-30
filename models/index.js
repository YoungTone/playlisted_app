var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/playlisted_app");

mongoose.set('debug', true);


module.exports.User = require("./user");
module.exports.Song = require("./song");
modules.exports.Playlist = require("./playlist");
