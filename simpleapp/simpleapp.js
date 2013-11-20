if (Meteor.isClient) {

    Template.loggedOutTemplate.events({

        'submit #login-form' : function(e, t){
            e.preventDefault();
            // retrieve the input field values
            var email = t.find('#login-email').value
        , password = t.find('#login-password').value;
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

    });


    Template.navigation.events({
        'click #logout_button' : function() { 
            Meteor.logout(function() { window.location = "/";});
        }

    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
