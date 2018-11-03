const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const express = require('express');
let router = express.Router();
const url = 'mongodb://dxc-asistencia:73VbZeHtYmTovwPNzIAOp6AnrhIyhxG80FHNeyvR7MWwNbJAF8oFgLWgsUFpwSeY5avcMMEeSgyNrqYYdTsrtg%3D%3D@dxc-asistencia.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';

/* GET home page. */
router.get('/', function(req, res, next) {
    res.end("The service of DXC-Attendance it works!");
});

router.post("/asistenciaDXC", function(req, res, next) {

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

module.exports = router;
