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
  console.log('a user has connected');

  //on disconnection
  socket.on('disconnect', function (){
    console.log('a user has disconnected');
  });

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
      User.find({name: data.username}, function (err, docs){

        House.find({name:docs[0].houses}, function(err,docs){
          socket.emit('loggedin', {
                                users: docs[0].users[0],
                                weather: docs[0].weather,
                                windows: docs[0].windows,
                                location: docs[0].location,
                                country: docs[0].country,
                                name: docs[0].name,
                                id: docs[0]._id
                                  })
        })

        console.log(docs[0].houses);
        console.log(docs[0].name);
        console.log(docs[0]._id);

      })
  });

  socket.on('creatingwindow', function (data) {
      console.log(data.windowname);
      House.findById({_id: data.houseid}, function (err,doc){
        console.log('in Socket IO DB call')
        var win = {
                    "windowname": data.windowname,
                    "windowstatus": false,
                  };
        doc.windows.push(win);
        doc.save();
        socket.emit('createdwindow', {doc});

      })
  })


});

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server enable for socketio.
http.listen(port, function () {
  console.log('listening on *:' + port);
  console.log(process.env.PORT || 8080);
});