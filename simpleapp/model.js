////////// Shared code (client and server) //////////

Rooms = new Meteor.Collection('rooms');
Music = new Meteor.Collection('music');

UserRoomLinks = new Meteor.Collection('userroomslinks');

if (Meteor.isServer) {
    Meteor.publish("allUsers", function () {
          return Meteor.users.find({});
    });
    Meteor.publish('Music', function(id) {
          check(id, String);
          return Music.find({_id: id});
    });
}
