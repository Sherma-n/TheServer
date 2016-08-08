var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

// Thanks to http://blog.matoski.com/articles/jwt-express-node-mongoose/

// set up a mongoose model
var HouseSchema = new Schema({
  name: String,
  users: [],
  country: String,
  location: String,
  pollution: String,
  weather: {
    currentweather: String,
    temperature: Number,
  },
  windows:[{
    windowname: String,
    windowstatus: Boolean,
  }]
});

module.exports = mongoose.model('House', HouseSchema);