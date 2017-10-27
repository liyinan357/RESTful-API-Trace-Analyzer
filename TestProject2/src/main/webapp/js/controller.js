(function($) {

	$(document).ready(function(){
		var latitude = "",longitude = "",totalFuelConsumed = 0,overallMPG = 0;
		//send the url
		$('#sendURL').click(function(){
			$('#step1').empty();
			alert("send url to api");
			$.ajax({
		        url: "http://192.168.0.21:4000/api/sendURL",
		        data:{
		        	url:'http://openxcplatform.com.s3.amazonaws.com/traces/nyc/downtown-west.json'
		        },
		        dataType: 'JSONP',
		        jsonpCallback: 'callback'
		    }).then(function(data) {
		       $('#step1').append("Request status: " + data.requestStatus);
		    });
		});
		
		$('#processData').click(function(){
			$('#step2').empty();
			alert("retrieve data from url");
			$.ajax({
		        url: "http://192.168.0.21:4000/api/retrieveAndProcessData",
		        dataType: 'JSONP',
		        jsonpCallback: 'callback'
		    }).then(function(data) {
		       $('#step2').append('Process Status: ' + data.processStatus);
		    });
		});
		
		$('#getPosition').click(function(){
			alert("get positions");
			$.ajax({
		        url: "http://192.168.0.21:4000/api/getPosition",
		        dataType: 'JSONP',
		        jsonpCallback: 'callback'
		    }).then(function(data) {
		    	alert(data.recordWithPosition.latitude + " " + data.recordWithPosition.longitude);
		    	latitude = data.recordWithPosition.latitude;
		    	longitude = data.recordWithPosition.longitude;
		    	totalFuelConsumed = data.totalFuelConsumed;
		    	overallMPG = data.OverallMPG;
		    	$("#total-fuel-consumed-hidden").val(totalFuelConsumed).hide();
		    	
		    });
		});
		
		$('#display').click(function(){
			alert("calling functions");
			$.ajax({
		        url: "http://192.168.0.21:4000/api/getResults",
		        dataType: 'JSONP',
		        jsonpCallback: 'callback'
		    }).then(function(data) {
		       $('#line').append("This is supposed to have MPG graph(but somehow all data displayed as zero)"+ data.dom);
		       $("#fuel-efficiency").text(overallMPG).parent().show();
		       $("#total-fuel-consumed").text(totalFuelConsumed).parent().show();
		       //$('#totalFuelConsumed').append("TotalFuelConsumed: " + data.totalFuelConsumed);
		       //$('#OverallMPG').append("Overall MPG: " + data.OverallMPG);
		       //$('#barChartData').append("bar Chart Data: " + data.barChartData);
		       var data = data.barChartData;
		       //fuelConsumed = data.totalFuelConsumed;
		       var element = $("#gear-histogram").get(0);
		       if(!element.getContext) {
		           console.log("No <canvas> element available, not drawing histogram");
		           return;
		       }
		       var context = element.getContext("2d");
		       var chart = new Chart(context,{
		         type: 'bar',
		         data: data
		       });
		    });
			//get fuel data related to gas price
			$.ajax({
		        url: "http://devapi.mygasfeed.com/stations/radius/" +
		            latitude + "/" + longitude +
		            "/5/reg/price/rfej9napna.json",
		        dataType: "jsonp",
		        success: function(data) {
		        	var fuelConsumedGallons = Number($("#total-fuel-consumed-hidden").val());
		        	//alert(typeof fuelConsumedGallons);
		            //console.log(data.stations.length);
		            var stations = data.stations;
		            if(stations && stations.length > 0) {
		                var stationsWithPrice = _.filter(stations, function(station) {
		                    return station.reg_price !== "N/A";
		                });

		                var averagePrice = _.reduce(stationsWithPrice,
		                        function(memo, station) {
		                            return memo + parseInt(station.reg_price, 10);
		                }, 0) / stationsWithPrice.length;
		                
		                $("#total-fuel-cost").text((averagePrice * fuelConsumedGallons).toFixed(2)).parent().show();
		                $("#average-fuel-cost").text(averagePrice.toFixed(2)).parent().show();
		            }
		        }
		    });
			
		});
		
	});
})(jQuery);