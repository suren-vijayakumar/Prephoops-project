// Declare requirements for Router
var express = require('express');
var router = express.Router();
var path = require('path');
var testDate = false;
var testSite = false;
var x = 0;

Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
};

// Declare Database models that will be used by Router
var Articles = require('../models/articledb');

var saveFeedArticle = function(feedArray, x){
    var saveObject = feedArray[x];

    // Since a collection for each date should be in the database as well as an empty article collection for each
    // site - we simply need to find the Date collection and array index of the site to place the article into the
    // database
    Articles.find({date: saveObject.shortDate}, function (err, dates) {
        if (err) {
            console.log("This is the error! ", err);
        }
        if (dates.length > 0) {
            // Because the Date exists - now call the site check to enumerate the sites
            // You cannot have a date collection without at least one site/article in it.
            var queryArticleInfo = Articles.findOne({date: saveObject.shortDate});
            queryArticleInfo.select('id site');
            queryArticleInfo.exec(function (err, article) {
                if (err) console.log("This is the queryArticleInfo Error: ", err);
                var mongoDateID = article.id;
                var mongoDateSites = article.site.length;
                testDate = true;

                // Find array index of site in the sites array.
                // The we can append the article to the proper site.
                // indexOf will return -1 if the site is not found.
                // Otherwise the array index of the site will be returned.
                //var test = article.site;
                //console.log(test);

                var siteArrayIndex = article.site.getIndexBy("siteID", saveObject.siteID);

                console.log("Looking for site: ", saveObject.siteID, " Got return of: ", siteArrayIndex);
                if (siteArrayIndex == null) {
                    // Since the date exists but the site does not,
                    // we will append the site and article within the Date
                    var siteArticleToAdd = {
                        siteName: saveObject.siteName,
                        siteID: saveObject.siteID,
                        articles: [{
                            pubDate: saveObject.pubDate,
                            author: saveObject.author,
                            title: saveObject.title,
                            url: saveObject.url,
                            articleID: saveObject.articleID,
                            paywalled: false,
                            tags: []
                        }]
                    };

                    Articles.findById(mongoDateID, function (err, item) {
                        item.site.push(siteArticleToAdd);
                        item.save(function (err, item) {
                            if (err) {
                                console.log("Error on Article Create: ", err);
                            } else {
                                x++;
                                if (x < feedArray.length) {
                                    saveFeedArticle(feedArray, x)
                                }
                            }
                        });
                    });
                } else {
                    testSite = true;
                    // Since the date and the site exist, we will append the article
                    // to the site within the Date
                    var articleToAdd = {
                        pubDate: saveObject.pubDate,
                        author: saveObject.author,
                        title: saveObject.title,
                        url: saveObject.url,
                        articleID: saveObject.articleID,
                        paywalled: false,
                        tags: []
                    };

                    Articles.findById(mongoDateID, function (err, item) {
                        item.site[siteArrayIndex].articles.push(articleToAdd);
                        item.save(function (err, item) {
                            if (err) {
                                console.log("Error on Article Create: ", err);
                            } else {
                                x++;
                                if (x < feedArray.length) {
                                    saveFeedArticle(feedArray, x)
                                }
                            }
                        });
                    });
                }
            });
        } else {
            //Need to format the new record for the MongoDB
            var dateArticleToAdd = {
                date: saveObject.shortDate,
                site: [{
                    siteName: saveObject.siteName,
                    siteID: saveObject.siteID,
                    articles: [{
                        pubDate: saveObject.pubDate,
                        author: saveObject.author,
                        title: saveObject.title,
                        url: saveObject.url,
                        articleID: saveObject.articleID,
                        paywalled: false,
                        tags: []
                    }]
                }]
            };
            // Since there is no date created yet - we will create the document
            Articles.create(dateArticleToAdd, function (err, post) {
                if (err) {
                    console.log("Error on Article Create: ", err);
                } else {
                    x++;
                    if (x < feedArray.length) {
                        saveFeedArticle(feedArray, x)
                    }
                }
            });
        }
    });
};
module.exports = saveFeedArticle;