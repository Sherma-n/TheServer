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
  currentweather: String,
  temperature: Number,
  img: String,
  skycode: Number,
  windows:[{
    windowname: String,
    windowstatus: Boolean,
  }]
});

// HouseSchema.pre('save', function (next) {
//   });

// module.exports = mongoose.model('House', HouseSchema);
var House = mongoose.model('House', HouseSchema);
module.exports = House;


