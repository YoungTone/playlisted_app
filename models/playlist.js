var mongoose = require('mongoose');
var Song = require('./song');

var playlistSchema = new mongoose.Schema({
    location: String,

    // Child Association
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song"

    }],

    // Parent Association
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

playlistSchema.pre('remove', function(callback) {
    Song.remove({
        playlist: this._id
    }).exec();
    callback();
});

var Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;