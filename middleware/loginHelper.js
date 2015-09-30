var db = require("../models");

// intercepts the request
// next is the callback

var loginHelpers = function (req, res, next) {
  req.login = function (user) {
    // sets session id = to user id
    
    req.session.id = user._id;
  };

  req.logout = function () {
    req.session.id = null;
  };

  next();
};

module.exports = loginHelpers;