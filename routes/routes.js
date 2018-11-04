const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const express = require('express');
const ObjectID = require("mongodb").ObjectID;
let router = express.Router();
const url = 'mongodb://dxc-asistencia:73VbZeHtYmTovwPNzIAOp6AnrhIyhxG80FHNeyvR7MWwNbJAF8oFgLWgsUFpwSeY5avcMMEeSgyNrqYYdTsrtg%3D%3D@dxc-asistencia.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';
let lastIDInserted;

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
            }, resourceId, startDate, startLocation, res);
        });
    }
);

let insertDocument = function (db, callback, resourceID, startDate, startLocation, response) {
    db.collection('asistance').insertOne({
        "resource": resourceID,
        "startdate": startDate,
        "startlocation ": startLocation,
        "enddate": null,
        "endlocation": null,
    }, function (err, result) {
        assert.equal(err, null);
        console.log("Se inserto el registro de asistencia correctamente.");
        lastIDInserted = result.insertedId;
        response.end(response.json(lastIDInserted))
    },);
};

router.put("/updateAsistencia", function(req, res, next) {

        let uID = req.body.id;
        let resourceId = req.body.resource;
        let endDate = req.body.enddate;
        let endLocation = req.body.endlocation;

        MongoClient.connect(url, function (err, client) {
            assert.equal(null, err);
            let db = client.db('dxc_asistencia');
            updateDocument(db, function () {
            } ,uID, resourceId, endDate, endLocation);
        });
    res.end("Se actualizo el registro de asistencia correctamente.");
    }
);

let updateDocument = function (db, callback, uID, resourceID, endDate, endLocation) {

    let newvalues = {$set: {enddate: endDate, endlocation: endLocation}};
    let query = {_id: ObjectID(uID), resource: resourceID};

    db.collection('asistance').updateOne(
    query,newvalues, function (err, result) {
        assert.equal(err, null);
        console.log("Se actualizo el registro de asistencia correctamente.");
    });
};

module.exports = router;
