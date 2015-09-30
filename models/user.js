var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var mongoose = require('mongoose');
var Playlist = require('./playlist');

var userSchema = new mongoose.Schema({
    userName: String,
    avatar: String,
    email: {
        type: String,
        // field is now case insensitive
        lowercase: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }]

});

userSchema.pre('remove', function(callback) {
    Playlist.remove({
        user: this._id
    }).exec();
    callback();
});

// Encryption

userSchema.pre('save', function(next) {
    // must be called save because it is a pre schema is defining structure and pre is a method on that schema, its called a pre save hook. Before you save any doccument related to the schema run this function. 

    var user = this;
    // this refers to whatever instance is being saved
    // if the password has not been changed, save the user and move on...
    // catch for new password
    if (!user.isModified('password')) {
        return next();
    }
    // db.User.create(req.body.user, function(){});
    // when calling next()...this is what happens
    // var user = new db.User(req.body.user)
    // user.save(function(err,user){})
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) {
                return next(err);
            }
            // define what the password is for the user
            user.password = hash;
            // everything looks good, let's save this!
            next();
        });
    });
});

userSchema.statics.authenticate = function(formData, callback) {
    // this refers to the model

    this.find({
            $or: [{
                    email: formData.email
                }, {
                    userName: formData.email
                }
            ]
        },
        function(err, users) {
            users.forEach(function(user) {
                if (user === null) {
                    callback('Invalid username or password', null);
                } else {
                    user.checkPassword(formData.password, callback);
                }
            });

        });
};

// in my app.js, when a user tries to log in
// submitting the "login" form...this will happen:
// db.User.authenticate(req.body.user, function(err,user){})

// CREATE IS A CLASS METHOD!
// db.User.create({});

// SAVE IS AN INSTANCE METHOD
// var user = new db.User({email:"test@test.com"});
// user.save()

// methods === INSTANCE METHODS!
userSchema.methods.checkPassword = function(password, callback) {
    var user = this;
    // this refers to actual instance beacuse it is a method rather than a static
    bcrypt.compare(password, user.password, function(err, isMatch) {
        if (isMatch) {
            callback(null, user);
        } else {
            callback(err, null);
        }
    });
};

var User = mongoose.model("User", userSchema);

module.exports = User;