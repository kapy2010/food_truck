function loadJSON(path, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function initialize() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(37.7833, -122.4167),
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(mapCanvas, mapOptions);

    loadJSON('https://data.sfgov.org/resource/rqzj-sfat.json',
             function(data) { nearestFoodTruck(data); },
             function(xhr) { console.log(xhr); }
    );

    var markers = [];
    function addMarker(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        markers.push(marker);
    }
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }
    function clearMarkers() {
        setMapOnAll(null);
    }
    function deleteMarkers() {
        clearMarkers();
        markers = [];
    }

    var directionsDisplay = new google.maps.DirectionsRenderer();
    function draw_path(origin, destination) {
        var directionsService = new google.maps.DirectionsService();
        directionsDisplay.setMap(map);
        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }

    var facilityType = document.getElementById('facilityType');
    var locationDescription = document.getElementById('locationDescription');
    var foodItems = document.getElementById('foodItems');

    function nearestFoodTruck(data) {
        google.maps.event.addListener(map, "click", function (event) {
            directionsDisplay.setMap(null);
            facilityType.innerHTML = '';
            locationDescription.innerHTML = '';
            foodItems.innerHTML = '';
            deleteMarkers();
            var clickLatitude = event.latLng.lat();
            var clickLongitude = event.latLng.lng();
            var buffer = [];
            for (var i=1; i<data.length; i++) {
                if (data[i].status === 'APPROVED') {
                    buffer.push([data[i], getDistanceFromLatLonInKm(clickLatitude, clickLongitude, data[i].latitude, data[i].longitude)]);
                }
            }
            buffer = buffer.sort(function(a,b) {
                return a[1]-b[1];
            });

            for (i=1;i<5;i++) {
                var obj = buffer[i][0];
                var markerPos = new google.maps.LatLng(obj.latitude, obj.longitude);
                addMarker(markerPos);
                setMapOnAll(map);
            }
            obj = buffer[0][0];    
            facilityType.innerHTML = '<b>Facility Type: </b>' + obj.facilitytype;
            locationDescription.innerHTML = '<b>Location Description: </b>' + obj.locationdescription;
            foodItems.innerHTML = '<b>Food Items: </b>' + obj.fooditems;
            var origin = new google.maps.LatLng(clickLatitude, clickLongitude);
            var destination = new google.maps.LatLng(Number(obj.latitude), Number(obj.longitude));
            draw_path(origin, destination);


        });
    }
}

google.maps.event.addDomListener(window, 'load', initialize);
