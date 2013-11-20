////////// Shared code (client and server) //////////

Rooms = new Meteor.Collection('rooms');


if (Meteor.isServer) {
    Meteor.publish('rooms', function(id) {
        check(id, String);
        return Rooms.find({_id: id});
    });
}
