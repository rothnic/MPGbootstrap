/**
 * Created by nick on 12/1/13.
 */

define( function(){

    var stats = {};

    stats.average = function(a) {
      var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
      for(var m, s = 0, l = t; l--; s += a[l]);
      for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
      return r.deviation = Math.sqrt(r.variance = s / t), r;
    }

    stats.withinStd = function(mean, val, stdev) {
       var low = mean-(stdev*x.deviation);
       var hi = mean+(stdev*x.deviation);
       return (val > low) && (val < hi);
    }

    //outputResult("Set = [" + array.concat(',') + "]<br/><br/>");

    /*outputResult(
        "mean      = " + x.mean + "<br />" +
        "deviation = " + x.deviation + "<br />" +
        "variance  = " + x.variance + "<br /><br />"
    );*/
    return stats;
});