const helper = require("node-red-node-test-helper");
const dotenv = require('dotenv');
const weatherNode = require("../weather.js");
dotenv.config();
helper.init(require.resolve('node-red'));
describe('weather-data Node', function () {
    beforeEach(function (done) {
        helper.startServer(done);
    });
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    })
    it('should be loaded', function (done) {
        const flow = [{id: "n1", type: "weather-data", name: 
                      "weather-data"}];
        helper.load(weatherNode, flow, function() {
            const n1 = helper.getNode("n1");
            try {
                n1.should.have.property('name', 'weather-data');
                done();
            } catch(err) {
                done(err);
            }
        });
    })
    it('should check for empty location name', function (done) {
        const flow = [
            { id: "n1", type: "weather-data", name: "weather-data", 
              wires: [["catchNode"]] },
            { id:"catchNode", type: "catch", scope:null, uncaught: 
              false, wires: [["n2"]]},
            { id: "n2", type: "helper" }
        ]
        helper.load(weatherNode, flow, function () {
            let n1 = helper.getNode("n1");
            let n2 = helper.getNode("n2");
            n2.on("input", function (msg) {
                try {
                    msg.should.have.property('error');
                    msg.error.should.have.property('message','Input data not provided.');
                    done();
                } catch (err) {
                    done(err);
                }
            })
            n1.receive({payload: ""})
        })
    })
    it('should check for wrong location name', function (done) {
        const flow = [
            { id: "n1", type: "weather-data", name: "weather-data", 
              wires: [["catchNode"]] },
            { id:"catchNode", type: "catch", scope:null, uncaught: 
              false, wires: [["n2"]]},
            { id: "n2", type: "helper" }
        ]
        const credentials = { "n1": {
            mapbox_key: process.env.MAPBOX,
            weatherstack_key: process.env.WEATHERSTACK
        }}
        helper.load(weatherNode, flow, credentials, function () {
            let n1 = helper.getNode("n1");
            let n2 = helper.getNode("n2");
            n2.on("input", function (msg) {
                try {

                    msg.should.have.property('error');
                    msg.error.should.have.property('message','Unable to find location. Try another search.');
                    done();
                } catch (err) {
                    done(err);
                }
            })
            n1.receive({payload: "!"})
        })
    })
})