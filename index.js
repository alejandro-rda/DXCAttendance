const http = require('http');
const CosmosClient = require("@azure/cosmos").CosmosClient;
const express = require('express');
const url = 'mongodb://dxc-asistencia:73VbZeHtYmTovwPNzIAOp6AnrhIyhxG80FHNeyvR7MWwNbJAF8oFgLWgsUFpwSeY5avcMMEeSgyNrqYYdTsrtg%3D%3D@dxc-asistencia.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';
let server = http.createServer(function (request, response) {

    let app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));

    app.post("/asistenciaDXC", (req, res, next) => {

            let resourceId = req.body.resource;
            let startDate = req.body.startdate;
            let startLocation = req.body.startlocation;

            MongoClient.connect(url, function (err, client) {
                assert.equal(null, err);
                let db = client.db('dxc_asistencia');
                insertDocument(db, function () {
                }, resourceId, startDate, startLocation)
            });
            res.end("Se inserto el registro de asistencia correctamente.");
        }
    );

    let insertDocument = function (db, callback, resourceID, startDate, startLocation) {
        db.collection('asistance').insertOne({
            "resource": resourceID,
            "startdate": startDate,
            "startlocation ": startLocation
        }, function (err, result) {
            assert.equal(err, null);
            console.log("Se inserto el registro de asistencia correctamente.");
        });
    };

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("The service of DXC-Attendance it works!");

});

let port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
