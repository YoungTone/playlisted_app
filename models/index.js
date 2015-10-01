var mongoose = require("mongoose");
mongoose.connect( process.env.MONGOLAB_URI || "mongodb://localhost/playlisted_app")

mongoose.set('debug', true);


module.exports.User = require("./user");
module.exports.Song = require("./song");
module.exports.Playlist = require("./playlist");