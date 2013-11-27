
define(["require","jquery","https://www.google.com/jsapi?autoload={'modules':[{'name':'visualization','version':'1'}]}"],
function(require, $){
    
    var deferred = new $.Deferred();
    
    function returnGoogle(){
        deferred.resolve(google);
    }
    google.setOnLoadCallback(returnGoogle);
    
    return deferred.promise();
});