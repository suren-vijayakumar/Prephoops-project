// Declare requirements for Router
var express = require('express');
var router = express.Router();
var Client = require('node-rest-client').Client;
var parseString = require('xml2js').parseString;
var saveArticle = require('./parseAPI');


// Declare Database models that will be used by Router
var Feeds = require('../models/rssdb');
var ParseDate = require('../models/parseDate');
var Articles = require('../models/articledb');

// Holds date/time of last time network was parsed
var lastParseDate;
// Holds date/time of new time network was parsed
var newParseDate;
// Keep track of the # of articles parsed
var articleCount = 0;
// Initializes an array that will hold the parsed objects
var holdingArray = [];
// Flag to wait until all RSS feeds are parsed before sending the to DB
var networksParsed = 0;
// Holding Array for the RSS Feeds to prevent multiple calls to the DB
var rssFeeds = [];

// Get call to just get last parse date for use on client side
router.get('/getLastDate', function(req, res, next){
    ParseDate.find({}, function(err, obj){
        res.send(obj)
    });
});

// This is the GET call to fire off the parse when localhost:3000/parseRSS is
// fed into the browser
router.get('/*', function(req, res, next){
    console.log("#1 Hit the router.get in parseRSS.js");
    // Find the Last Parse Date
    findLastParseDate();
    // Capture the time of Parsing execution
    newParseDate = dateToISO(Date.now());
    res.send('Parsing RSS');
});

module.exports = router;

// Find the last parse date in the DB
var findLastParseDate = function() {
    console.log("#2 Hit the findLastParseDate in parseRSS.js");
    ParseDate.findOne({}, {}, { sort: { 'date' : -1 } }, function(err, obj) {
        if (err){
            console.log('Error finding last parse date: ', err);
        }
        // If there is no last parse date create a new one
        else if(!obj){
            lastParseDate = '2000-01-01T00:00:00.000Z';
            ParseDate.create({date: newParseDate}, function (err, post) {
            })
        }
        else {
            // Working Variable for Parse
            lastParseDate = (dateToISO(obj.date));
            console.log("Last parse Date is: ", lastParseDate);
            // Get the RSS Feeds
            getSites();
        }
    });
};

// Get Site information from the Database
var getSites = function()  {
    console.log("#3 Hit the getSites function in parseRSS.js");
    Feeds.find({}).sort({siteID: 1}).exec(function (err, sites) {
        if (err) {
            console.log("Error in pull sites from database ", err);
        } else {
            rssFeeds = sites;
            console.log("Feeds #1: ", rssFeeds[0]);
            dateCollectionUpdate(rssFeeds);
        }
    });
};

// Need to get the last article collection date from the database
var dateCollectionUpdate = function(rssFeeds) {
    console.log("#4 Hit the dateCollectionUpdate function in parseRSS.js");
    Articles.find({}).sort({date: -1}).limit(1).exec(function (err, lastdate) {
        if (err) {
            console.log("Error pulling articles: ", err);
        } else {
            // Format last article collection date in Date for comparison to current date
            console.log("Last Date returned from collections: ", lastdate[0].date);
            var tempLastCollectionDate = new Date(lastdate[0].date);
            var lastCollectionDate = new Date(tempLastCollectionDate.setDate(tempLastCollectionDate.getDate() + 1));
            var MS_PER_DAY = 1000 * 60 * 60 * 24;
            var currentDate = new Date();
            console.log("Dates - last collection and current", lastCollectionDate, currentDate);
            // a and b are javascript Date objects
            var dateDiffInDays = function(a, b) {
                // Discard the time and time-zone information.
                var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                return Math.floor((utc2 - utc1) / MS_PER_DAY);
            };

            var daysSinceLastCollection = dateDiffInDays(lastCollectionDate, currentDate);
            console.log("Days since last collection: ", daysSinceLastCollection);

            var month = new Array();
            month[0] = "-01-";
            month[1] = "-02-";
            month[2] = "-03-";
            month[3] = "-04-";
            month[4] = "-05-";
            month[5] = "-06-";
            month[6] = "-07-";
            month[7] = "-08-";
            month[8] = "-09-";
            month[9] = "-10-";
            month[10] = "-11-";
            month[11] = "-12-";

            if (daysSinceLastCollection > 0) {
                for (var i = 0; i < daysSinceLastCollection; i++) {
                    var currentDateDayTemp = (currentDate.getDate()).toString();
                    if (currentDateDayTemp < 10) {
                        var currentDateDay = "0" + currentDateDayTemp;
                    } else {
                        var currentDateDay = currentDateDayTemp;
                    }
                    var currentDateMonth = month[currentDate.getMonth()];
                    var currentDateYear = ((currentDate.getYear()) + 1900).toString();
                    var currentDateString = currentDateYear + currentDateMonth + currentDateDay;

                    var dateArticleToAdd = {
                        date: currentDateString,
                        site: []
                    };

                    for (var j = 0; j < rssFeeds.length; j++) {
                        var sitePush = {
                            siteName: rssFeeds[j].siteFullName,
                            siteID: rssFeeds[j].siteID,
                            siteShortName: rssFeeds[j].siteShortName,
                            articles: []
                        };
                        dateArticleToAdd.site.push(sitePush);
                    }

                    Articles.create(dateArticleToAdd, function (err, post) {
                        if (err) {
                            console.log("Error on Article Create: ", err);
                        }
                    });
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
                    if((i+1) === daysSinceLastCollection){
                        console.log("Current Date at end of loop: ", currentDate);
                        console.log("Sending to the networkParser");
                        networkParser(rssFeeds);
                    } else {
                        console.log("Current Date at end of loop: ", currentDate);
                    }
                }
            } else {
                console.log("Days since last collection is 0?  Sending to networkParser");
                networkParser(rssFeeds);
            }
        }
    });
};

// Loop through each RSS Feed in the Network
var networkParser = function(sites){
    console.log("#5 Hit the Network Parser function");
    // For each Feed in the network send it to the parser
    for(i = 0; i < sites.length; i++){
        var el = sites[i];
        var networkCount = sites.length;
        parseFeed(el.rssURL, el.siteFullName, el.siteID, networkCount);
    }
};

// Parse an RSS Feed
var parseFeed = function(feedURL, siteName, siteID, numNetworks){
    console.log ("#6 Hit the parseFeed function.  Should see memory leak right after this.");
    client = new Client();

    // Connect to Remote RSS Feed
    client.get(feedURL, function(data, response){

        // Parse the returned xml
        parseString(data, function (err, result) {

            // The array of articles
            var articles = result.rss.channel[0].item;

            // Loop through articles array
            for(i = 0; i < articles.length; i++) {
                var el = articles[i];

                // Change  pubdate to ISO format
                var date = dateToISO(el.pubDate[0]);

                //Remove the time information from the ISO date
                var shortDate = date.substr(0, date.indexOf('T'));

                // Get article ID
                var articleID = getArticleID(el);

                // Get author
                var author = getAuthor(el);

                //// Store the parsed info in an obj
                var articleObj = {};

                //// Add data to obj that will be sent to mongoose
                articleObj.pubDate = date;
                articleObj.shortDate = shortDate;
                articleObj.siteID = siteID;
                articleObj.siteName = siteName;
                articleObj.title = el.title[0];
                articleObj.author = author;
                articleObj.url = el.link[0];
                articleObj.articleID = articleID;

                // If the articles pubDate is newer than the last parse date push it to array
                if (articleObj.pubDate > lastParseDate) {
                    holdingArray.push(articleObj);
                }
                articleCount++;
            }
            networksParsed++;
            // If all articles in network have been parsed send them to the DB
            if(networksParsed == numNetworks){
                console.log('Parsing Complete!');
                console.log(articleCount + ' articles parsed');
                console.log('There are ' + holdingArray.length + ' articles in the array');
                // Reset Counters
                networksParsed = 0;
                articleCount = 0;

                if (holdingArray.length > 0){
                    ParseDate.findOne({}, {}, { sort: { 'date' : -1 } }, function(err, obj) {
                        ParseDate.findByIdAndUpdate(obj.id, {date: newParseDate}, function (err, post) {
                            console.log('New parse date is', newParseDate);
                        });
                    });
                    saveArticle(holdingArray, 0);
                    holdingArray = [];
                }
            }
        });
    });
};

// Convert a date to ISO format
var dateToISO = function(date){
    var ISOdate = new Date(date).toISOString();
    return ISOdate;
};

// Grab the unique ID from a SportNgin article
var getSportNginArticleID = function(url){
    var articleID = url.substr(url.lastIndexOf('/') + 1);
    // Remove everything after the ?
    articleID = articleID.substr(0, articleID.indexOf('?'));
    return articleID;
};

// Get article author
var getAuthor = function(el){
    if(el['dc:creator']){
        var articleAuthor = el['dc:creator'];
        articleAuthor = articleAuthor.toString();
    }
    else {
        articleAuthor = el.author[0];
    }
    return articleAuthor;
};

// Get article ID
var getArticleID = function(el){
    if(el.link[0]) {
        var findID = getSportNginArticleID(el.link[0]);
    }
    else {
        findID = '';
    }
    return findID;
};