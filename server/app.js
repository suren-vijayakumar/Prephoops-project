var express = require('express');
var app = express();

var bodyParser = require('body-parser');

// Route requires
var indexRoute = require('./routes/index');
var apiRoute = require('./routes/api');
var parseRssRoute = require('./routes/parseRSS');
var userAuthRoute = require('./routes/userAuth');
var networkRoute = require('./routes/network');


// Authentication requires
var passport = require('passport');
var session = require('express-session');
var localStrategy = require('passport-local').Strategy;
var User = require('./models/userdb');

// Mongo setup
var mongoose = require("mongoose");

// Turn on the debug feature for mongoose - additional information sent to server console
mongoose.set("debug",true);

//Mongo Labs DB
 var mongoURI = "mongodb://localhost:27017/prephoops";

//Connect to DB
 var MongoDB = mongoose.connect(mongoURI).connection;

 MongoDB.on('error', function (err) {
     console.log('mongolab connection error', err);
 });

 MongoDB.once('open', function () {
     console.log('mongolab connection open');
 });

// Server setup
app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Passport session
app.use(session({
    secret: '1234554321',
    key: 'user',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 60000, secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use('local', new localStrategy({ passReqToCallback : true, usernameField: 'username' },
    function(req, username, password, done) {
    }
));

// Routes
app.use('/userauth', userAuthRoute);
app.use('/network', networkRoute);
app.use('/parserss', parseRssRoute);
app.use('/api', apiRoute);
app.use('/', indexRoute);

app.listen(app.get('port'), function() {
    console.log('Prep Hoops is running on port', app.get('port'));
});

// Passport
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err,user){
        if(err) done(err);
        done(null,user);
    });
});

passport.use('local', new localStrategy({
        passReqToCallback : true,
        usernameField: 'username'
    },
    function(req, username, password, done){
        console.log('looking for username');
        User.findOne({ username: username }, function(err, user) {
            if (err) {
                throw err;
            }
            if (!user) {
                console.log('Could Not Find User');
                return done(null, false, {message: 'Incorrect username and password.'});
            }

            // test a matching password
            user.comparePassword(password, function(err, isMatch) {
                if (err) throw err;
                if(isMatch)
                    return done(null, user);
                else
                    done(null, false, { message: 'Incorrect username and password.' });
            });
        });
    }));

module.exports = app;
