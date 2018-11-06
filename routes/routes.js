const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const express = require('express');
const ObjectID = require("mongodb").ObjectID;
const async = require('async');
const url = 'mongodb://dxc-asistencia-2:8wDyfljQlOopuzGRrriq0JU3xFh1CNIPfWUTbubYD58S4E7XQZdomFY8MFfg6gQVBe2fEBLKv9hs0HtkzdyCEw%3D%3D@dxc-asistencia-2.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';
let router = express.Router();
let db = null;

MongoClient.connect(url, function (err, client) {
    if (err) {
        console.error(err)
    }
    db = client.db('dxc_asistencia');
    console.log("Conexion realizada");
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.end("The service of DXC-Attendance it works!");
});

router.post("/asistenciaDXC", function (req, res, next) {

        let resourceId = req.body.resource;
        let startDate = req.body.startdate;
        let startLocation = req.body.startlocation;

        insertDocument(function () {
        }, resourceId, startDate, startLocation, res);
    }
);

let insertDocument = function (callback, resourceID, startDate, startLocation, response) {

    let ModelAsistencia = db.collection("asistance");

   ModelAsistencia.insertOne({
        "resource": resourceID,
        "startdate": startDate,
        "startlocation ": startLocation,
        "enddate": null,
        "endlocation": null,
    }, function (err, result) {
        assert.equal(err, null);
        console.log("Se inserto el registro de asistencia correctamente.");
        let lastIDInserted = result.insertedId.toString();
        response.end(lastIDInserted);
    });
};

router.put("/updateAsistencia", function (req, res, next) {

        let uID = req.body.id;
        let endDate = req.body.enddate;
        let endLocation = req.body.endlocation;

        updateDocument(function () {
            res.end("Se actualizo el registro de asistencia correctamente.")
        }, uID, endDate, endLocation)
        ;
    }
);

let updateDocument = function (callback, uID, endDate, endLocation) {

    let ModelAsistencia = db.collection("asistance");

    let newvalues = {$set: {enddate: endDate, endlocation: endLocation}};
    let query = {_id: ObjectID(uID)};

    ModelAsistencia.updateOne(
        query, newvalues, function (err, result) {
            assert.equal(err, null);
            console.log("Se actualizo el registro de asistencia correctamente.");
        });
};

router.get("/asistenciaDiaxRecurso/:resourceID", function (req, res, next) {

        let ModelAsistencia = db.collection("asistance");
        let var_resource = req.params.resourceID;

        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        today = yyyy + '-' + mm + '-' + dd;


        let query = {
            resource: var_resource,
            startdate: new RegExp(today)
        };

        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dd = yesterday.getDate();
        mm = yesterday.getMonth() + 1;
        yyyy = yesterday.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }

        yesterday = yyyy + '-' + mm + '-' + dd;
        let queryYesterday = {
            resource: var_resource,
            startdate: new RegExp(yesterday),
            enddate: null
        };

        async.parallel({
            assistanceToday: function (cb) {
                ModelAsistencia.find(query).toArray(cb)
            },
            assistanceLastYesterday: function (cb) {
                ModelAsistencia.find(
                    queryYesterday,
                    {sort: {startdate: -1}, limit: 1}).toArray(cb);
            }
        }, function (err, results) {
            if (results.assistanceToday.length > 0) {
                res.end(res.json(results.assistanceToday));
            } else {
                if (results.assistanceLastYesterday.length > 0) {
                    res.end(res.json(results.assistanceLastYesterday))
                }
                else {
                    res.end(res.json("No se encuentran registros de asistencia del dia."));
                }
            }
        });
    }
);

module.exports = router;
