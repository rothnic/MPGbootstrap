/**
 * Created by nick on 11/29/13.
 */

define(["jquery", "tabs", "gmaps", "mpgcharts"], function($, mpgcharts){

        var mpgsite = {};
        mpgsite.user = "Login";
        mpgsite.loggedin = false;

        mpgsite.login = function(user){
            mpgsite.user = user;

            var newdata = $("#user-profile-button").get(0).lastElementChild.outerHTML + "\n" + user;
            $("#user-profile-button").get(0).innerHTML = newdata;

            if(mpgsite.user != "Login"){
                if (mpgsite.loggedin != true){
                    $('#tabs:first-child').toggleClass("hidden");
                    $('#myprofile').toggleClass("hidden");
                    $('#my-bullet-row').toggleClass("hidden");
                    mpgsite.loggedin = true;
                }
                $('#tabs a[href="#myprofile"]').tab('show');

            }
        }

        return mpgsite;
    }
)
