// Declare Mongoose Requirement
var mongoose = require('mongoose');

// Declare Schema for the Prep Hoops Article Collection of Mongo DB
var ParseDateSchema = new mongoose.Schema({
            date: Date
});
// Package and Export Article Database Model
module.exports = mongoose.model("ParseDate", ParseDateSchema);