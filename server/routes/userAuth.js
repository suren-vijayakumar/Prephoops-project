var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var User = require('../models/userdb');



// User Authentication
//router.post('/login', passport.authenticate('local'), function(req, res){
//    console.log(req.user);
//    res.send(req.user);
//});

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return res.status(500).json({err: err});
        }
        if (!user) {
            return res.status(401).json({err: info});
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.status(500).json({err: 'Could not log in user'});
            }
            res.status(200).json({status: 'Login successful!'});
        });
    })(req, res, next);
});

// User Registration
router.post('/register', function(req,res,next) {
    User.create(req.body, function (err, post) {
        if (err)
            next(err);
        else
            res.redirect('/');
    })
});

// User Logout
router.get('/logout', function(req, res) {
    req.logout();
    res.status(200).json({status: 'Bye!'});
});

module.exports = router;