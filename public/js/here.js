if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        localCoord  = position.coords;
        objLocalCoord = {
            lat : localCoord.latitude,
            lng : localCoord.longitude
        }

        // Initialize the platform object:
        let platform = new H.service.Platform({
            'apikey': window.hereApiKey
        });

        // Obtain the default map types from the platform object
        let defaultLayers = platform.createDefaultLayers();

        // Instantiate (and display) a map object:
        var map = new H.Map(
            document.getElementById('mapContainer'),
            defaultLayers.vector.normal.map,
            {
                zoom: 13,
                center: objLocalCoord,
                pixelRatin: window.devicePixelRatio || 1
            });
            window.addEventListener('resize', () => map.getViewPort().resize());
        
        let ui          = H.ui.UI.createDefault(map, defaultLayers);
        let mapEvents   = new H.mapevents.MapEvents(map);
        let behavior    = new H.mapevents.Behavior(mapEvents);

        // Dragable Marker Function
        function addDragableMarker(map, behavior) {
            let inputLat    = document.getElementById('lat')
            let inputLng    = document.getElementById('lng')

            if (inputLat.value != '' && inputLng.value != '') {
                objLocalCoord = {
                    lat : inputLat.value,
                    lng : inputLng.value
                }
            }

            let marker  = new H.map.Marker(objLocalCoord, {
                volatility: true
            })

            marker.draggable    = true;
            map.addObject(marker);

            // disabled the default draggablity of the underlying map
            // and calculate the offset between mouse and target's position
            // when starting to drag a marker obj
            map.addEventListener('dragstart', function(ev) {
                let target  = ev.target,
                    pointer = ev.currentPointer;
                if (target instanceof H.map.Marker) {
                    let targetPosition  = map.geoToScreen(target.getGeometry());
                    target['offset']    = new H.math.Point(
                        pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y
                    )
                    behavior.disable()
                }
            }, false);

            // Listen to the drag event and move the position of the marker
            // as necesssary
            map.addEventListener('drag', function(ev) {
                let target  = ev.target,
                    pointer = ev.currentPointer;
                if (target instanceof H.map.Marker) {
                    target.setGeometry(
                        map.screenToGeo(
                            pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y
                        )
                    );
                }
            }, false)

            // re-enablethe default draggability of the underlying map
            // when dragging has completed
            map.addEventListener('dragend', function(ev) {
                let target  = ev.target;
                if (target instanceof H.map.Marker) {
                    behavior.enable()
                    let resultCoord = map.screenToGeo(
                        ev.currentPointer.viewportX,
                        ev.currentPointer.viewportY
                    );
                    // console.log(resultCoord)
                    inputLat.value  = resultCoord.lat.toFixed(5);
                    inputLng.value  = resultCoord.lng.toFixed(5);
                }
            }, false)
        }

        if (window.action == "submit") {
            addDragableMarker(map, behavior)
        }

        // Browse Location
        let spaces  = [];
        const fetchSpaces   = function (latitude, longitude, radius) {
            return new Promise(function(resolve, reject) {
                resolve(
                    fetch(`/api/spaces?lat=${latitude}&lng=${longitude}&rad=${radius}`)
                    .then((res) => res.json())
                    .then(function(data) {
                        data.forEach(function(value, index) {
                            let marker = new H.map.Marker({
                                lat : value.latitude,
                                lng : value.longitude
                            });
                            spaces.push(marker);
                        })
                    })
                )
            })
        }

        // Remove marker when map dragged
        // or when marker does'nt inside the map
        function clearSpace() {
            map.removeObjects(spaces);
            spaces = [];
        }

        // initiate fetchSpace() and clearSpace()
        function init(latitude, longitude, radius) {
            clearSpace()
            fetchSpaces(latitude, longitude, radius)
            .then(function() {
                map.addObjects(spaces)
            })
        }

        if (window.action == "browse") {
            map.addEventListener('dragend', function(ev) {
                let resultCoord = map.screenToGeo(
                    ev.currentPointer.viewportX,
                    ev.currentPointer.viewportY
                );
                init(resultCoord.lat, resultCoord.lng, 40)
            }, false)

            init(objLocalCoord.lat, objLocalCoord.lng, 40)
        }
    })
} else {
    console.error("Goelocation is not supported by this browser!");
}