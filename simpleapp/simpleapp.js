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
        members: []
      });
      evt.target.value = '';
    }
  }));

    Template.roomsTemplate.events({
    'click .join-button': function(e) {
        var rname = $(e.currentTarget).attr("data-name");
        Rooms.update({_id: Rooms.findOne({name: rname})._id}, {$push: {members: Meteor.user()}});
        Room = Rooms.findOne({name: rname});
        console.log(Room._id);
        console.log(Meteor.user());
        console.log(Meteor.user().inroom);
        Meteor.user().inroom = Room._id;

        var fragment = Meteor.render( function() {  
            return Template.roomTemplate({'name': rname});
        });
        $("#content").html(fragment);

    }});

    Template.roomTemplate.events({
    'click .leave-button': function(e) {
        console.log("clicking leave button");
        var rname = $(e.currentTarget).attr("data-name");
        Rooms.update({_id: Rooms.findOne({name: rname})._id}, {$pull: {members: Meteor.user()}});
        Room = Rooms.findOne({name: rname});
        var fragment = Meteor.render(function() {
            return Template.roomsTemplate();
        });

        $("#content").html(fragment);
    }});

    Template.roomTemplate.members = function(e) {
        return 
        rname = e.name;
        //var rname = document.getElementById('leave-button').attr("data-name");
        console.log(rname);
        //return Rooms.findOne({name: rname});
    }

    Template.roomsTemplate.rooms = function() { 
        return Rooms.find();
    }
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        Accounts.onCreateUser(function(option, user) {
            user.inroom = "";
            return user;
        });
        // code to run on server at startup
    });
}
