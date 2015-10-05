// Declare Mongoose Requirement
var mongoose = require('mongoose');

// Declare Schema for the Prep Hoops Article Collection of Mongo DB
var ArticleSchema = new mongoose.Schema({
    date : String,
    site :
        [{
            siteName: String,
            siteShortName: String,
            siteID: Number,
            articles:
                [{
                    pubDate: Date,
                    author: String,
                    title: String,
                    url: String,
                    articleID: String,
                    paywalled: Boolean,
                    tags: Array
                }]
        }]
});

// Package and Export Article Database Model
module.exports = mongoose.model("Articles", ArticleSchema);
