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
var sound = null;
Meteor.methods({
  playMusic: function (room, position) {
               var self = this;
               var music = Music.findOne({"room": room}, {timestamp: 1});
               SC.stream("/tracks/"+music.id, {"position": position * 1000}, function(sound){
                 window.sound = sound;
                 window.sound.play();
               });
             },

  changeMusic: function (room) {
                 var music = Music.findOne({"room": room}, {timestamp: 1});
                 SC.stream("/tracks/"+music.id, function(sound){
                   window.sound = sound;
                   window.sound.play();
                 });
               }
});


musicStream = new Meteor.Stream('music');

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.subscribe("allUsers");
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
        console.log("not logged in");
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
      SC.initialize({
        client_id: 'c9ce0709200563bfed18203750a9aa55'
      });

      var rname = $(e.currentTarget).attr("data-name");
      joining_room = Rooms.findOne({name: rname});
      userlinkid = UserRoomLinks.findOne({useremail: Meteor.user().emails})._id;
      UserRoomLink = UserRoomLinks.update({_id: userlinkid}, {$set: {room: joining_room._id}});

      var fragment = Meteor.render( function() {  
        return Template.roomTemplate({'name': rname});
      });
      $("#content").html(fragment);
      var position = 0;
      musicStream.on("room", function(message) {
        if (message == "change") {
          position = 0;
          Meteor.call("changeMusic", rname);
        }else {
          position = message;
        }
      });
      setTimeout(function(){Meteor.call("playMusic", rname, position)}, 2000);
    }
  });

  Template.roomTemplate.events({
    'click .leave-button': function(e) {
      console.log("clicking leave button");
      console.log(window.sound);
      if (window.sound != null) {
        window.sound.stop();
      }
      var rname = $(e.currentTarget).attr("data-name");

      userlinkid = UserRoomLinks.findOne({useremail: Meteor.user().emails})._id;
      UserRoomLink = UserRoomLinks.update({_id: userlinkid}, {$set: {room: ""}});
      var fragment = Meteor.render(function() {
        return Template.roomsTemplate();
      });

      $("#content").html(fragment);
    }});

  Template.roomTemplate.members = function(e) {

    this_room = UserRoomLinks.findOne({useremail: Meteor.user().emails}).room;
    console.log(this_room);

    var alluserlinks = UserRoomLinks.find({room: this_room});

    a = [];
    alluserlinks.forEach(function (alu) {
      console.log('hi');
      a.push(Meteor.users.findOne({emails: alu.useremail}));
    });

    return a;
  }

  Template.roomsTemplate.rooms = function() {
    return Rooms.find();
  }
};

if (Meteor.isServer) {
  var list = {};

  Meteor.startup(function () {
    var self = this;
    var rooms = Rooms.find();
    rooms.forEach(function(room){
      var music = Music.findOne({"room": room.name}, {timestamp: 1});
      list[music._id] = 0;
    });
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
    Accounts.onCreateUser(function(option, user) {
      UserRoomLinks.insert({
        useremail: user.emails,
      room: ""
      });
      return user;
    });
});

Meteor.setInterval(function() {
  var rooms = Rooms.find().fetch();
  rooms.forEach(function(room){
    console.log(room.name);
    var music = Music.findOne({"room": room.name}, {timestamp: 1});
    if (music != null) {
      if ((list[music._id] + 1) * 1000 >= music.duration) {
        delete list[music._id];
        Music.remove(music);
        var music = Music.findOne({"room": room.name}, {timestamp: 1});
        list[music._id] = 0;
        musicStream.emit("room", "change");
      } else {
        list[music._id] = list[music._id] + 1;
        musicStream.emit("room", list[music._id]);
      }
    }
  });
}, 1000);
}
