var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport    = require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user');
var House       = require('./app/models/house')
var port        = process.env.PORT || 8080;
var jwt         = require('jwt-simple');


//Require socket it
var http      =  require('http').Server(app);
var io        = require('socket.io')(http);

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/index', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

// connect to database
mongoose.connect(config.database);

// pass passport for configuration
require('./config/passport')(passport);

// bundle our routes
var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token, user: req.body.name});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
          return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
          res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

//Socket io
io.on('connect', function(socket){
  //1
  socket.emit('arefreshing', {user: "testing"});

  console.log('a user has connected');

  //on disconnection
  socket.on('disconnect', function (){
    console.log('a user has disconnected');
  });

  //functions
  updatinguser = function (data) {
    socket.emit('showuser', {
                              user: data[0].name,
                              houses: data[0].houses,
                              password: data[0].password,
                              id: data[0]._id
    });
  };

  updatinghouse = function (data) {
          socket.emit('showhouse', {
              name: data[0].name,
              id: data[0]._id,
              users: data[0].users,
              country: data[0].country,
              location: data[0].location,
              pollution: data[0].pollution,
              weather: {
                currentweather: "SUNNY",
                // data[0].weather.currentweather,
                temperature: 28,
                // data[0].weather.temperature,
              },
              windows: data[0].windows
          });
  };

  //on saving a user
  socket.on('userregistered', function(data){
    console.log('user is registering')
  });

  //saving a house
  socket.on('addedHouse', function(data) {

    var newHouse = new House({
                              name: data.house.name,
                              country: data.house.country,
                              location: data.house.location,
                              users: [data.user.user]
                            });
  //        name: data.house.name,
  //   users: [data.user.user],
  //   country: data.house.country,
  //   location: data.house.location,
  //   pollution: '',
  //   weather: {
  //     currentweather: SUNNY,
  //     temperature: 28,
  //   },
  //   windows:[{
  //     windowname: ' ',
  //     windowstatus: false,
  //   }]
  // });
    newHouse.save(function(err) {
      if (err) throw err;
      // console.log(newHouse);
      console.log('House Created');
    });

    User.findOneAndUpdate(
      {name: data.user.user},
      {$push: {houses: data.house.name}},
      {safe: true, upsert: true},
      function(err, model) {
    });

    User.find({name: data.user.user}, function (err,docs){
      if (err) throw (err);
      socket.emit('loadhouses', {
                                  house: docs[0].houses[0],
                                  name: docs[0].name,
                                  id: docs[0]._id
                                });
    });

  });

  //onlogging in
  socket.on('loggingin', function (data){
      User.find({name: data.username}, function (err, doc) {

        console.log(doc);
        console.log('Console Log House')
        console.log(doc[0].houses[0]);

        House.find({name:doc[0].houses[0]}, function(err,docs){

          console.log(docs);

          socket.emit('loggedin', {
              name: docs[0].name,
              id: docs[0]._id,
              users: docs[0].users,
              country: docs[0].country,
              location: docs[0].location,
              pollution: docs[0].pollution,
              weather: {
                currentweather: "SUNNY",
                // docs[0].weather.currentweather,
                temperature: 28,
                // docs[0].weather.temperature,
              },
              windows: docs[0].windows
          })
        });
      });

  });

  socket.on('addingauser', function (data) {
    console.log('userdataincomeing')
    House.findById({_id: data.houseid}, function (err,doc){
      doc.users.push(data.newuser);
      doc.save();
      console.log("new user added to house");
    });
    User.find({name: data.newuser}, function (err,doc){
      doc[0].houses.push(data.newuser);
      doc[0].save();
      console.log("house added to new user");
    });
    socket.emit('arefreshing', {user: "testing"});
  });

  socket.on('creatingwindow', function (data) {

      House.findById({_id: data.houseid}, function (err,doc){
        console.log('in Socket IO DB call')
        var win = {
                    "windowname": data.windowname,
                    "windowstatus": false,
                  };

        doc.windows.push(win);
        doc.save();
        console.log('window is created');
        socket.emit('arefreshing', {user: "testing"});

      });
  });

  function findviahousename (data) {
    console.log(data);
    House.findById({_id: data.houseid}, function (err,data){
          console.log("booooooooom");
          console.log(docs);
          updatinghouse(docs);
        });
  };

  socket.on('getData', function (data) {
    User.find({name: data.user}, function (err, doc) {
      console.log(doc[0].name);
      House.find({users: doc[0].name}, function (err,doced){
        updatinghouse(doced);
      })
    });
    User.find({name: data.user}, function (err, doc) {
      updatinguser(doc);
    });

  });

  socket.on('removinghouseuser', function(data) {
    User.find({name: data.remove}, function (err, doc) {
                                          // remembertochange
      var delhse = (doc[0].houses.indexOf(data.housename));
      doc[0].houses.splice(delhse, 1);
      doc[0].save();
      updatinguser(doc);
    });
    House.find({name: data.housename}, function (err, doc) {
                                        //remembertochange
      var deluse = (doc[0].users.indexOf(data.remove));
      doc[0].users.splice(deluse, 1);
      doc[0].save();
      updatinghouse(doc);
    })
  });

  socket.on('updatehousename', function(data) {
    House.findById({_id: data.houseid}, function (err,doced){
      // doced.name = data.newname;
      // doced.save();
      var houseUsers = doced.users;
        for(var i = 0; i < doced.users.length;i++) {
          User.find({name: doced.users[i]}, function(err, doc){
            for(var i = 0; i < doc[0].houses.length;i++) {
              if (doc[0].houses[i] == doced.name) {
                doc[0].houses[i] = data.newname;
                doc[0].save();
                doced.name = data.newname;
                doced.save();
                console.log(doced.name);
              };
            };

          });
          // console.log("first for loop");
        //   var eachUser = houseUsers[i];
        //     User.find({name: houseUsers[i]}, function (err, doc) {
        //       var housetochange = doced.name;
        //       var userhouses = doc[0].houses;
        //       console.log('Whaatsadjahkdgfjhsdgf');
        //       console.log(doc[0].houses);
        //       console.log(doced.users);


        //       // doc[0].houses.find({name: doced.name}) = data.newname;
        //       // doc[0].save();

        //       // function searchStringInArray (str, strArray) {
        //       //     for (var j=0; j<strArray.length; j++) {
        //       //         if (strArray[j].match(str)) return j;
        //       //     }
        //       //     return -1;
        //       // }
        //     });
        }
    });
  });




});// sockets end

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server enable for socketio.
http.listen(port, function () {
  console.log('listening on *:' + port);
  console.log(process.env.PORT || 8080);
});