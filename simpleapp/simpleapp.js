var fs = fs || {};
var count = 0;

var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
          evt.type === "focusout") {
            // blur/return/enter = ok/submit if non-empty
            var value = String(evt.target.value || "");
            if (value)
              ok.call(this, value, evt);
            else
              cancel.call(this, evt);
          }
    };

  return events;
};
fs.sound = null;

fs.isPlay = null;

musicStream = new Meteor.Stream('music');

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.subscribe("allUsers");
    SC.initialize({
      client_id: '5c2d3c252900dbde483590be9bd8135a'
    });

    Meteor.setTimeout(function() {
        console.log(Meteor.user());
        userlink = UserRoomLinks.findOne({useremail: Meteor.user().emails});
        if (userlink.roomname != "") {

            var rname = userlink.roomname;
            var fragment = Meteor.render( function() {  
                return Template.roomMainTemplate({'name': rname});
            });
            $("#content").html(fragment);
            var position = 0;
            musicStream.on(rname, function(message) {
                if (message == "change") {
                    Meteor.setTimeout(function(){
                        position = 0;
                        var music = Music.findOne({"room": rname}, {timestamp: 1});
                        if (music != null) {
                            fs.isPlay = true;
                            if (music.type == "video") {
                                var fragment = Meteor.render(function(){
                                    return Template.videoTemplate({"id": music.id, "position": position});
                                });

                                $("#video").html(fragment);

                            } else {
                                SC.stream("/tracks/"+music.id,function(sound){
                                    fs.sound = sound;
                                    fs.sound.play();
                                });
                            }
                        }


                    }, 500);
                }else {
                    position = message;
                    if (fs.isPlay == null) {
                        var music = Music.findOne({"room": rname}, {timestamp: 1});
                        if (music != null) {
                            fs.isPlay = true;
                            if (music.type == "video") {
                                var fragment = Meteor.render(function(){
                                    return Template.videoTemplate({"id": music.id, "position": position});
                                });

                                $("#video").html(fragment);

                            } else {
                                SC.stream("/tracks/"+music.id, {"position": position * 1000}, function(sound){
                                    fs.sound = sound;
                                    fs.sound.play();
                                });
                            }
                        }


                    }
                }
            });
        }
    }, 500);

  });

  Template.loggedOutTemplate.events({

      'submit #login-form' : function(e, t){
          e.preventDefault();
          // retrieve the input field values
      var email = t.find('#login-email').value;
      var password = t.find('#login-password').value;
      // Trim and validate your fields here.... 

      // If validation passes, supply the appropriate fields to the
      // Meteor.loginWithPassword() function.
      Meteor.loginWithPassword(email, password, function(err){
        if (err)
        console.log("not logged in should probably do something here");
      // The user might not have been found, or their passwword incorrect
      // could be incorrect. Inform the user that their
      // login attempt has failed. 
        else
        window.location = "/";
      // The user has been logged in.
      });
      return false; 
    },

      'click #register-button': function(e, t) {
        var email = t.find('#login-email').value;
        var password = t.find('#login-password').value;  
        Accounts.createUser({email: email, password: password}, function(){
          window.location = "/";
        });
      }

  });


  Template.navigation.events({
    'click #logout_button' : function() { 
      Meteor.logout(function() { window.location = "/";});
    }
  });


  Template.roomsTemplate.events(okCancelEvents(
        '#new-room',
        {
          ok: function (name, evt) {
            if (Rooms.findOne({"name": name})){
              alert("room already exists");
              return;
            }
            Rooms.insert({
              name: name,
            created_by: Meteor.user(),
            });
            evt.target.value = '';
          }
        }));

  Template.roomsTemplate.events({
    'click .join-button': function(e) {
      var rname = $(e.currentTarget).attr("data-name");
      joining_room = Rooms.findOne({name: rname});
      userlinkid = UserRoomLinks.findOne({useremail: Meteor.user().emails})._id;
      UserRoomLink = UserRoomLinks.update({_id: userlinkid}, {$set: {room: joining_room._id, roomname: joining_room.name}});

      var fragment = Meteor.render( function() {  
        return Template.roomMainTemplate({'name': rname});
      });
      $("#content").html(fragment);
      var position = 0;
      musicStream.on(rname, function(message) {
        if (message == "change") {
          Meteor.setTimeout(function(){
            position = 0;
            var music = Music.findOne({"room": rname}, {timestamp: 1});
            if (music != null) {
              fs.isPlay = true;
              if (music.type == "video") {
                var fragment = Meteor.render(function(){
                  return Template.videoTemplate({"id": music.id, "position": position});
                });

                $("#video").html(fragment);

              } else {
                SC.stream("/tracks/"+music.id,function(sound){
                  fs.sound = sound;
                  fs.sound.play();
                });
              }
            }


            }, 500);
        }else {
          position = message;
          if (fs.isPlay == null) {
            var music = Music.findOne({"room": rname}, {timestamp: 1});
            if (music != null) {
              fs.isPlay = true;
              if (music.type == "video") {
                var fragment = Meteor.render(function(){
                  return Template.videoTemplate({"id": music.id, "position": position});
                });

                $("#video").html(fragment);

              } else {
                SC.stream("/tracks/"+music.id, {"position": position * 1000}, function(sound){
                  fs.sound = sound;
                  fs.sound.play();
                });
              }
            }


          }
        }
      });
    }
  });

  Template.roomMainTemplate.events({
    'click #add-video-btn': function(e, t) {
      e.preventDefault();
      // retrieve the input field values
      var video_id = t.find('#video-id').value;
      Meteor.http.get("https://gdata.youtube.com/feeds/api/videos/" + video_id + "?v=2&alt=json", function (error, result) {
        if(error) {
          console.log('http get FAILED!');
        } else {
          var data = JSON.parse(result.content);
          var name = data.entry.title.$t;
          var duration = data.entry.media$group.media$content[0].duration;
          var roomname = UserRoomLinks.findOne({useremail: Meteor.user().emails}).roomname; 
          Music.insert({
            id: video_id,
            room: roomname,
            duration: duration * 1000,
            name: name,
            type: "video",
            timestamp: new Date().getTime()
          })
        }
      });
    }
  });

  Template.resultsAreaTemplate.events({
    'click .add-song': function(e) {
      var song_id = $(e.currentTarget).attr('data-id');
      var roomname = UserRoomLinks.findOne({useremail: Meteor.user().emails}).roomname;
      var song_duration = $(e.currentTarget).attr('data-duration');
      var song_name = $(e.currentTarget).attr('data-songname');
      count+=1;
      if (count % 2){
          var music = Music.insert({
              id: song_id,
              room: roomname,
              duration: song_duration,
              timestamp: new Date().getTime(),
              name: song_name,
              type: "audio"
          });
      }
    }
  });

  Template.roomTemplate.events({
    'click .leave-button': function(e) {
      if (fs.sound != null) {
        fs.sound.stop();
      }
      var rname = $(e.currentTarget).attr("data-name");

      userlinkid = UserRoomLinks.findOne({useremail: Meteor.user().emails})._id;
      UserRoomLink = UserRoomLinks.update({_id: userlinkid}, {$set: {room: "", roomname: ""}});
      var fragment = Meteor.render(function() {
        return Template.roomsTemplate();
      });

      $("#content").html(fragment);

    }});

  Template.roomTemplate.members = function(e) {

    this_room = UserRoomLinks.findOne({useremail: Meteor.user().emails}).room;

    var alluserlinks = UserRoomLinks.find({room: this_room});

    a = [];
    alluserlinks.forEach(function (alu) {
      a.push(Meteor.users.findOne({emails: alu.useremail}));
    });

    return a;
  }

  Template.roomsTemplate.rooms = function() {
    return Rooms.find();
  }

  Template.playListTemplate.music = function() {
    var roomname = UserRoomLinks.findOne({useremail: Meteor.user().emails}).roomname;
    return Music.find({"room": roomname}, {timestamp: 1});
  }

  var searchResults = [];
  Template.searchTemplate.events(okCancelEvents(
        '#search-box',
        {
          ok: function(searchTerm, evt) {
            SC.get('/tracks', { q: searchTerm, limit: 15 }, function(tracks) {
              window.searchResults = tracks;
              $('#resultsArea').html(Meteor.render(Template.resultsAreaTemplate));
            });

          }
        }));

  Template.resultsAreaTemplate.results = function() {
    return window.searchResults;
  }
}

if (Meteor.isServer) {
  var list = {};

  Meteor.startup(function () {
    var self = this;
    var rooms = Rooms.find();
    rooms.forEach(function(room){
      var music = Music.findOne({"room": room.name}, {timestamp: 1});
      if (music != null) {
        list[music._id] = 0;
      }
    });
    Accounts.onCreateUser(function(option, user) {
      UserRoomLinks.insert({
        useremail: user.emails,
        room: "",
        roomname: ""
      });
      return user;
    });
  });

  Meteor.setInterval(function() {
    var rooms = Rooms.find().fetch();
    rooms.forEach(function(room){
      var music = Music.findOne({"room": room.name}, {timestamp: 1});
      if (music != null) {
        if (list[music._id] == undefined) {
          list[music._id] = 0;
        }
        if ((list[music._id] + 1) * 1000 >= music.duration) {
          delete list[music._id];
          Music.remove(music);
          var music = Music.findOne({"room": room.name}, {timestamp: 1});
          if (music != null) {
              list[music._id] = 0;
              musicStream.emit(room.name, "change");
          }
        } else {
          list[music._id] = list[music._id] + 1;
          musicStream.emit(room.name, list[music._id]);
        }
      }
    });
  }, 1000);
}


/*
   Meteor.http.get("http://api.soundcloud.com/tracks/"+music.id+".json?client_id=c9ce0709200563bfed18203750a9aa55", function (error, result) 
   {
   if(error) {
   console.log('http get FAILED!');
   } else {
   console.log('http get SUCCES');
   if (result.statusCode === 200) {
   var data = JSON.parse(result.content);
   var music = Music.insert({
   id: 66144432,
   room: room.name,
   duration: data.duration,
   timestamp: new Date().getTime()
   });
   list[music] = 0;
   }
   }
   });
   });
   */
