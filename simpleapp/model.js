////////// Shared code (client and server) //////////

Rooms = new Meteor.Collection('rooms');
Music = new Meteor.Collection('music');


if (Meteor.isServer) {
    Meteor.publish('rooms', function(id) {
        check(id, String);
        return Rooms.find({_id: id});
    });
    Meteor.publish('Music', function(id) {
          check(id, String);
          return Music.find({_id: id});
    });
}
