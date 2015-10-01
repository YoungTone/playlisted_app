var mongoose = require('mongoose');

var songSchema = new mongoose.Schema({
    title: String,
    artist: String,
    album: String,
    year: String,
    genre: String,
    art: String,
    // Parent Association
    playlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }
});

var Song = mongoose.model('Song', songSchema);

module.exports = Song;