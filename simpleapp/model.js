////////// Shared code (client and server) //////////

Rooms = new Meteor.Collection('rooms');
UserRoomLinks = new Meteor.Collection('userroomslinks');

if (Meteor.isServer) {
    Meteor.publish("allUsers", function () {
          return Meteor.users.find({});
    });
}
