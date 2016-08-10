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
          res.json({success: true, token: 'JWT ' + token, user: user});
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
          res.json({
            success: true,
            user: user,
            mgs: "user is found"
          });

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

  // get house data on page validate user
  socket.on('getData', function (data) {
    console.log('getData');
    console.log(data);
    User.findById(data.id, function(err, user){
      // console.log('dauser');
      // console.log(user);
      // console.log('dadata');
      // console.log(data);
      if (err) {return err;}
      console.log(user.houses[0]);

      var houseName = user.houses;
      // (deniscode);
      House.findById({_id: user.houses[0]}, function(err, houses){

        houses.users.forEach(function (value) {
          User.findById({_id: value}, function (err, user) {
            console.log(user);
            var allusers = [];
            allusers.push(user.name);
            socket.emit('updateuserlist', {userlist: allusers});
          });
        console.log('waaaagh');
        console.log(value);
        });

        socket.emit('arefreshing', {houses: houses});
      });



      //deniscode
  //     House.find({name: {$in: houseName}}, function(err, houses){
  //       if (err) {return err;}
  //       console.log('houses');
  //       console.log(houses);
  //       console.log('user');
  //       console.log(user);
  //       console.log('data');
  //       console.log(data);
  //       socket.emit('arefreshing', {houses: houses[0]});
  //     })
    });
  });

  //Socket Code
  socket.on('addedHouse', function (data) {

    // console.log(data);
    House.findById({_id: data.houseid}, function (err, house) {
      house.name = data.housename;
      house.country = data.housecountry;
      house.location = data.houselocation;
      console.log('waaaagh');
      console.log(house);
    });
    // var newHouse = new House  ({
    //   name: data.housename,
    //   country: data.country,
    //   location: data.location,
    //   users: [data.userid],
    //   pollution: '',
    //   weather: {
    //     currentweather: "SUNNY",
    //     temperature: 28
    //   },
    //   windows: []
    // });

    // newHouse.save(function(err, doc) {
    //   if (err) throw err;
    //   console.log('data user id');
    //   console.log(data.userid);
    //   User.findById({_id: data.userid}, function (err, user) {
    //     console.log("this is the found user");
    //     console.log(user);
    //     user.houses.push(data.userid);
    //     user.save();
    //     socket.emit('housecreated', {
    //       user: user,
    //       house: doc
    //     });
    //   });
    //    console.log('House Created');

    // });
  }); //creating new house end

  socket.on('addedHouse', function(data) {

  })








});// sockets end

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server enable for socketio.
http.listen(port, function () {
  console.log('listening on *:' + port);
  console.log(process.env.PORT || 8080);
});