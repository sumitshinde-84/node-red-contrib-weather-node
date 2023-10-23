// to provide the module access to the Node-RED runtime API
module.exports = function(RED) {
    const request = require('request');
    // to get latitude and longitude coordinates of the given location name.
    function geocode (address, access_token, callback) {
        const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(address) + '.json?access_token=' + access_token + '&limit=1';
    
        request({ url, json: true }, (error, {body}) => {
            if (error) {
                callback('Unable to connect to location service!',undefined);
            } else if (body.features.length === 0) {
                callback('Unable to find location. Try another search.', undefined);
            } else {
                callback(undefined, {
                latitude: body.features[0].center[1],
                longitude: body.features[0].center[0],
                location: body.features[0].place_name
                })
            }
        })
    }
    // to get the weather information from the coordinates of the location provided
    function forecast(latitude, longitude, access_key, callback) {
        const url = 'http://api.weatherstack.com/current?access_key=' + access_key + '&query=' + latitude + ',' + longitude;
        
        request({ url, json: true}, (error, {body}) => {
            if (error) {
                callback("Unable to connect to weather service.", undefined);
            }
            else if (body.error) {
                callback("Unable to find location.", undefined);
            }
            else {
                callback(undefined, {
                        "weatherDescription":
                         body.current.weather_descriptions[0],
                        "actualTemp": body.current.temperature,
                        "feelsLikeTemp": body.current.feelslike
                })
            }
        })
    }
    
    // weather-data node
    function weatherNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.location = config.location;
        const mapbox_key = this.credentials.mapbox_key;
        const weatherstack_key = this.credentials.weatherstack_key;
        node.on('input', function(msg) {
            let locationName = node.location ? node.location : msg.payload;
            if (!locationName || !mapbox_key || !weatherstack_key) {
                node.error("Input data not provided.", msg)
            } else {
                geocode(locationName, mapbox_key, (error, {latitude,longitude, location} = {}) => {
                    if (error) {
                        node.error(error, msg);
                    } else {
                        forecast(latitude, longitude, weatherstack_key, (error, forecastData) => {
                            if (error) {
                                node.error(error, msg);
                            } else {
                                msg.payload = {
                                    place: location,
                                    weather:
                                    forecastData.weatherDescription,
                                    actualTemperature:
                                    forecastData.actualTemp,
                                    feelsLikeTemperature:
                                    forecastData.feelsLikeTemp
                                }
                                node.send(msg);
                            }
                        });
                    }
                })
            }
        })
    }
    // to register the weatherNode function as a node
    RED.nodes.registerType("weather-data", weatherNode, {
        credentials: {
            mapbox_key: {type: "password"},
            weatherstack_key: {type: "password"}
        }
    });
}