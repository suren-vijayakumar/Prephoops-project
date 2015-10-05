var express = require('express');
var router = express.Router();
var path = require('path');
var Feeds = require('../models/rssdb');
var Articles = require('../models/articledb');
var util = require('util');

Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
};

// Add Site
router.post('/addsite', function(req,res,next) {
    console.log("This is the request: ", req.body);
    var sitePush = {
        siteName: req.body.siteFullName,
        siteID: req.body.siteID,
        siteShortName: req.body.siteShortName,
        articles: []
    };
    //res.send("In Testing - Site Added to Feeds Database");
    Feeds.create(req.body, function (err, post) {
        if (err)
            next(err);
        else
            res.send('Site Added to Feeds Database');
    });
    Articles.find({}, function(err, date){
        if (err) {
            console.log("Error pulling date array from Articles Container: ", err);
        }
        for(var i = 0; i < date.length; i++){
            date[i].site.push(sitePush);
            date[i].save(function(err){
                if (err) {
                    console.log("Site not written correctly! ", err);
                }
            });
        }
    })
});

// Delete Site
router.delete('/deletesite/:id', function(req, res, next){
    var deleteSiteID = 0;
    console.log("Delete Hit! ID: ", req.params.id);
    Feeds.findById(req.params.id, function(err, res){
        if (err) {
            console.log("Error on getting siteID: ", err);
        }
        deleteSiteID = res.siteID;
        console.log("Site ID to Delete: ", deleteSiteID);
    });

    Feeds.findByIdAndRemove(req.params.id, req.body, function(err, post){
        if(err) {
            console.log("Error on Site Delete: ", err);
        }
        res.json(post);
    });

    Articles.find({}, function(err, date){
        if (err) {
            console.log("Error pulling date array from Articles Container: ", err);
        }
        for(var i = 0; i < date.length; i++){
            var siteArrayIndex = date[i].site.getIndexBy("siteID", deleteSiteID);
            var deleteSiteObjId = date[i].site[siteArrayIndex].id;
            date[i].site.pull(deleteSiteObjId);
            date[i].save(function(err, date){
                if (err) {
                    console.log("Save Error ", err);
                } else {
                    console.log(date);
                }
            });
        }
    });
});

// Edit Site
router.put('/editsite/:id', function(req, res, next){
    console.log("Edit Hit! ID: ", req.params.id);
    console.log(req.body);
    Feeds.findByIdAndUpdate(req.params.id, {"siteFullName": req.body.editFullName, "siteShortName": req.body.editShortName, "rssURL": req.body.editRssURL}, function(err, post){
        if(err) {
            console.log("Error on Site Edite: ", err);
        }
        res.send('Updated');
    });
});


// Find last siteID
router.get('/lastid', function(req, res, next){
    console.log('finding last id');
    Feeds.findOne({}, {}, { sort: { 'siteID' : -1 } }, function(err, post) {
        res.send(post);
    });
});

//Get feed info from database
router.get('/getFeeds', function(req, res, next){
    console.log('Getting feeds info');
    Feeds.find({}).
       sort({'siteID':1}).
       exec(function(err, feeds){
       res.send(feeds);
   });
});

// Get the list of Sites in the Network
router.get('/*', function(req, res, next){
    console.log('Getting List of Sites');
    Feeds.find({}).
        sort({'siteID':1}).
        exec(function(err, feeds){
            res.send(feeds);
    });
});

module.exports = router;