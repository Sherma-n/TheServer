    // //functions
  // updatinguser = function (data) {
  //   socket.emit('showuser', {
  //     user: data[0].name,
  //     houses: data[0].houses,
  //     password: data[0].password,
  //     id: data[0]._id
  //   });
  // };

  // updatinghouse = function (data) {
  //         socket.emit('showhouse', {
  //             name: data[0].name,
  //             id: data[0]._id,
  //             users: data[0].users,
  //             country: data[0].country,
  //             location: data[0].location,
  //             pollution: data[0].pollution,
  //             weather: {
  //               currentweather: "SUNNY",
  //               // data[0].weather.currentweather,
  //               temperature: 28,
  //               // data[0].weather.temperature,
  //             },
  //             windows: data[0].windows
  //         });
  // };


    // //on saving a user
  // socket.on('userregistered', function(data){
  //   console.log('user is registering')
  // });

  //saving a house
  // socket.on('addedHouse', function(data) {

  //   var newHouse = new House({
  //                             name: data.house.name,
  //                             country: data.house.country,
  //                             location: data.house.location,
  //                             users: [data.user.user]
  //                           });
  // //        name: data.house.name,
  // //   users: [data.user.user],
  // //   country: data.house.country,
  // //   location: data.house.location,
  // //   pollution: '',
  // //   weather: {
  // //     currentweather: SUNNY,
  // //     temperature: 28,
  // //   },
  // //   windows:[{
  // //     windowname: ' ',
  // //     windowstatus: false,
  // //   }]
  // // });
  //   newHouse.save(function(err) {
  //     if (err) throw err;
  //     // console.log(newHouse);
  //     console.log('House Created');
  //   });

  //   User.findOneAndUpdate(
  //     {name: data.user.user},
  //     {$push: {houses: data.house.name}},
  //     {safe: true, upsert: true},
  //     function(err, model) {
  //   });

  //   User.find({name: data.user.user}, function (err,docs){
  //     if (err) throw (err);
  //     socket.emit('loadhouses', {
  //                                 house: docs[0].houses[0],
  //                                 name: docs[0].name,
  //                                 id: docs[0]._id
  //                               });
  //   });

  // });

  // //onlogging in
  // socket.on('loggingin', function (data){
  //     User.find({name: data.username}, function (err, doc) {
  //       console.log('Console Log House')
  //       console.log(doc[0].houses[0]);
  //         socket.emit('loggedinuser', {
  //           houses: doc[0].houses,
  //           name: doc[0].name,
  //           id: doc[0]._id
  //         });

  //       House.find({name:doc[0].houses[0]}, function(err,docs){
  //         // console.log('before going to loggedin');
  //         // console.log('data');
  //         // console.log(data);
  //         console.log('doc');
  //         console.log(doc);
  //         console.log('docs');
  //         console.log(docs);
  //         socket.emit('loggedin', {
  //             name: docs[0].name,
  //             id: docs[0]._id,
  //             users: docs[0].users,
  //             country: docs[0].country,
  //             location: docs[0].location,
  //             pollution: docs[0].pollution,
  //             weather: {
  //               currentweather: "SUNNY",
  //               // docs[0].weather.currentweather,
  //               temperature: 28,
  //               // docs[0].weather.temperature,
  //             },
  //             windows: docs[0].windows
  //         })
  //       });
  //     });

  // });

  // socket.on('addingauser', function (data) {
  //   console.log('userdataincomeing')
  //   House.findById({_id: data.houseid}, function (err,doc){
  //     doc.users.push(data.newuser);
  //     doc.save();
  //     console.log("new user added to house");
  //   });
  //   User.find({name: data.newuser}, function (err,doc){
  //     doc[0].houses.push(data.newuser);
  //     doc[0].save();
  //     console.log("house added to new user");
  //   });
  //   socket.emit('arefreshing', {user: data.newuser});
  // });

  // socket.on('creatingwindow', function (data) {

  //     House.findById({_id: data.houseid}, function (err,doc){
  //       console.log('in Socket IO DB call')
  //       var win = {
  //                   "windowname": data.windowname,
  //                   "windowstatus": false,
  //                 };

  //       doc.windows.push(win);
  //       doc.save();
  //       console.log('window is created');
  //       socket.emit('arefreshing', {user: data.username});

  //     });
  // });

  // function findviahousename (data) {
  //   console.log(data);
  //   House.findById({_id: data.houseid}, function (err,data){
  //         console.log("booooooooom");
  //         updatinghouse(docs);
  //       });
  // };

  // // socket.on('getData', function (data) {
  // //   User.find({name: data.user}, function (err, doc) {
  // //     console.log(doc[0].name);
  // //     House.find({users: doc[0].name}, function (err,doced){
  // //       updatinghouse(doced);
  // //     })
  // //   });
  // //   User.find({name: data.user}, function (err, doc) {
  // //     updatinguser(doc);
  // //   });

  // // });

  // socket.on('removinghouseuser', function(data) {
  //   User.find({name: data.remove}, function (err, doc) {
  //                                         // remembertochange
  //     var delhse = (doc[0].houses.indexOf(data.housename));
  //     doc[0].houses.splice(delhse, 1);
  //     doc[0].save();
  //     updatinguser(doc);
  //   });
  //   House.find({name: data.housename}, function (err, doc) {
  //                                       //remembertochange
  //     var deluse = (doc[0].users.indexOf(data.remove));
  //     doc[0].users.splice(deluse, 1);
  //     doc[0].save();
  //     updatinghouse(doc);
  //   })
  // });

  // socket.on('updatehousename', function(data) {
  //   console.log(data);
  //   House.findById({_id: data.houseid}, function (err,doced){
  //     // doced.name = data.newname;
  //     // doced.save();
  //     var houseUsers = doced.users;
  //       for(var i = 0; i < doced.users.length;i++) {
  //         User.find({name: doced.users[i]}, function(err, doc){
  //           for(var i = 0; i < doc[0].houses.length;i++) {
  //             if (doc[0].houses[i] == doced.name) {
  //               doc[0].houses[i] = data.newname;
  //               doc[0].save();
  //               doced.name = data.newname;
  //               doced.save();
  //               console.log(doced.name);
  //               socket.emit('arefreshing', {user: data.username});
  //             };
  //           };

  //         });
  //       }
  //   });
  // });


    //Socket Code
  socket.on('creatingnewhouse', function (data) {
    console.log('this is the creating new house data');
    console.log(data);
    var newHouse = new House  ({
      name: data.housename,
      country: data.country,
      location: data.location,
      users: [data.userid],
      pollution: '',
      weather: {
        currentweather: "SUNNY",
        temperature: 28
      },
      windows: []
    });

    newHouse.save(function(err, doc) {
      if (err) throw err;
      console.log('data user id');
      console.log(data.userid);
      User.findById({_id: data.userid}, function (err, user) {
        console.log("this is the found user");
        console.log(user);
        user.houses.push(data.userid);
        user.save();
        socket.emit('housecreated', {
          user: user,
          house: doc
        });
      });
       console.log('House Created');

    });

  })