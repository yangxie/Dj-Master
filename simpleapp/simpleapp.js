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
        var rname = $(e.currentTarget).attr("data-name");
        joining_room = Rooms.findOne({name: rname});
        userlinkid = UserRoomLinks.findOne({useremail: Meteor.user().emails})._id;
        UserRoomLink = UserRoomLinks.update({_id: userlinkid}, {$set: {room: joining_room._id}});

        var fragment = Meteor.render( function() {  
            return Template.roomTemplate({'name': rname});
        });
        $("#content").html(fragment);

    }});

    Template.roomTemplate.events({
    'click .leave-button': function(e) {
        console.log("clicking leave button");
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
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        Accounts.onCreateUser(function(option, user) {
            UserRoomLinks.insert({
              useremail: user.emails,
              room: ""
            });
            return user;
        });
    });
}
