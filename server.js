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
var weather     = require('weather-js');


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

getweather = function(country, location, houseid) {
  weather.find({search: country, location, degreeType: 'C'}, function(err, result) {
    if(err) console.log(err);
    var nowweather = result[0].current;
    // console.log(nowweather.temperature);

    House.findById({_id: houseid}, function (err, house) {
      house.currentweather = nowweather.skytext;
      house.temperature    = nowweather.temperature;
      house.img            = nowweather.imageUrl;
      house.skycode        = nowweather.skycode;
      house.save()
    })

    // console.log(nowweather.skycode);
  });
};

// getweather('Hong Kong', 'HK', "57ab7e415e4a3165def5aea0");

windowstate = function (skycode, houseid) {

    House.findById({_id: houseid}, function (err, house){
      house.windows.forEach(function(windo){
        if (skycode < 22) {
          windo.windowstatus = false;
        } else {
          windo.windowstatus = true;
        };
        // console.log(windo)
      });
      house.save();
    });

};

// windowstate(25, "57ab7e415e4a3165def5aea0");



//Socket io
io.on('connect', function(socket){
  console.log('a user has connected');

  //on disconnection
  socket.on('disconnect', function (){
    console.log('a user has disconnected');
  });

  // get house data on page validate user
  socket.on('getData', function (data) {
    User.findById(data.id, function(err, user){
      if (err) {return err;}
      console.log(user)
      var houseName = user.houses;
      // (deniscode);
      House.findById({_id: user.houses[0]}, function(err, houses){
        // console.log(houses);
          var allusers = [];
        houses.users.forEach(function (value) {
          User.findById({_id: value}, function (err, user) {

            allusers.push(user.name);
            socket.emit('updateuserlist', {userlist: allusers});
          });
        });
        console.log(houses)
        getweather(houses.country, houses.location, houses._id);
        windowstate(houses.skycode ,houses._id)
        io.emit('arefreshing', {houses: houses});
      });
    });
  });

  //Socket Code
  socket.on('addedHouse', function (data) {
    // console.log(data);
    House.findById({_id: data.houseid}, function (err, house) {
      house.name = data.housename;
      house.country = data.housecountry;
      house.location = data.houselocation;
      house.save();
      io.emit('newestupdate',{});
    });
  }); //creating new house end

  socket.on('creatingwindow', function (data){
    console.log('showing creatingwindow')
    console.log(data);
    House.findById({_id: data.houseid}, function(err, house){
      // console.log(data.windows);

      house.windows.push({
        windowname: data.newwindow,
        windowstatus: false
      });
      house.save();
      console.log(house.windows);
      io.emit('newestupdate',{});
    });
  });

  socket.on('removingwindow', function(data) {
    // console.log(data)
    House.findById({_id: data.houseid}, function(err, house){
      // console.log(house);
      house.windows.forEach(function (wind){
        // wind.forEach(function (windname){
          // console.log(windname);
          if (wind.windowname == data.removewindow) {
            house.windows.splice(house.windows.indexOf(wind, 1));
          house.save();
          io.emit('newestupdate',{});
          } else {};


        // })
      })
    })
  });

  socket.on('changewindowstate', function (data) {

    var selecteditem = null;
    House.findById({_id: data.houseid}, function(err, house) {
      // console.log('showing the window array')

      house.windows.forEach(function (item) {
        if (item.windowname == data.windowname) {
          selecteditem = item;
        } else {};
      });
        // console.log(selecteditem.windowstatus)
        selecteditem.windowstatus = !selecteditem.windowstatus;
        house.save();
        // console.log('Show me my house man')
        // console.log(house.windows)
        io.emit('updatethewindows', {
          housewindows: house.windows
        });
    })
  })

  socket.on('getleatestwindows', function(data) {
    House.findById({_id: data.houseid}, function(err, house){
      socket.emit('doingthewindows', { housewindows:house.windows});
    });
  });

  socket.on('removinguser', function (data) {
        User.find({name: data.removeuser}, function(err,user){
          // console.log(user);
          user[0].houses.forEach(function(item){
            if (item == data.houseid) {
              user[0].houses.splice(user[0].houses.indexOf(item, 1));
              // console.log(user[0]);
              // console.log(user[0].houses);
              // user[0].save();
              io.emit('newestupdate', {});
            } else {};
          });
        });
        House.findById({_id: data.houseid}, function(err,house){
          house.users.forEach(function(item){
            // console.log(house.users);
            User.findById({_id:item}, function(err, single){
              // console.log(single);
              if (single.name == data.removeuser) {
                house.users.splice(house.users.indexOf(single, 1));
              // console.log(house.users);
              house.save();
              io.emit('newestupdate', {});
              } else  {}
            })
          });
        });
  });



  //creating a new user
  socket.on('addingnewuser', function (data) {
     User.find({name: data.newuser}, function(err, user) {


      House.findById({_id: data.houseid}, function (err, house){

        house.users.push(user[0].id);
        user[0].houses.push(data.houseid);
        user[0].save();
        house.save();
        io.emit('newestupdate', {});
      });
    });
  });

  socket.on('allupdate', function (data) {
     User.find({name: data.currentusername}, function (err, user){
      User.findById({_id: data.currenthouseid}, function (err, house) {
        io.emit('newestupdate', {
          newuser: user[0],
          newhouse: house
        });
      });
    });
  })









});// sockets end

// connect the api routes under /api/*
app.use('/api', apiRoutes);

// Start the server enable for socketio.
http.listen(port, function () {
  console.log('listening on *:' + port);
  console.log(process.env.PORT || 8080);
});