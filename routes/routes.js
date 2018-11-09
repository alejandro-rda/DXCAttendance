const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const moment = require('moment-timezone');
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
        "startdate": new Date(),
        "startlocation": startLocation,
        "completed": 0,
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
        }, uID, endDate, endLocation, res)
        ;
    }
);

let updateDocument = function (callback, uID, endDate, endLocation, res) {

    let ModelAsistencia = db.collection("asistance");

    let newvalues = {
        $set: {
            enddate: new Date(),
            endlocation: endLocation,
            completed: 1
        }
    };

    let query = {_id: ObjectID(uID)};

    ModelAsistencia.updateOne(
        query, newvalues, function (err, result) {
            assert.equal(err, null);
            console.log("Se actualizo el registro de asistencia correctamente.");
            res.end(res.json("Se actualizo el registro de asistencia correctamente."));
        });
};

router.get("/asistenciaDiaxRecurso/:resourceID&:currDate", function (req, res, next) {

        let ModelAsistencia = db.collection("asistance");
        let var_resource = req.params.resourceID;
        let currDate = req.params.currDate;

        let start = new Date(currDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"));
        start.setHours(0, 0, 0);

        let end = new Date(currDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"));
        end.setDate(end.getDate() - 1);
        end.setHours(0, 0, 0);

        async.parallel({
                assistanceFirstToday: function (cb) {
                    ModelAsistencia.aggregate([
                        {
                            $match: {
                                resource: var_resource,
                                enddate: {'$gte': start}
                            }
                        },
                        {
                            $project: {
                                endlocation: 1,
                                startlocation: 1,
                                resource: 1,
                                completed: 1,
                                startdate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: {"$add": ["$startdate", 3600000 * -5]}
                                    }
                                },
                                enddate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date:
                                            {"$add": ["$enddate", 3600000 * -5]}

                                    }
                                }
                            }
                        },
                        {$sort: {stardate: 1}},
                        {$limit: 1}
                    ]).toArray(cb)
                },

                assistanceToday: function (cb) {
                    ModelAsistencia.aggregate([
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {'$gte': start}
                            }
                        },
                        {
                            $project: {
                                endlocation: 1,
                                startlocation: 1,
                                resource: 1,
                                completed: 1,
                                startdate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: {"$add": ["$startdate", 3600000 * -5]}
                                    }
                                },
                                enddate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date:
                                            {"$add": ["$enddate", 3600000 * -5]}

                                    }
                                }
                            }
                        },
                        {$sort: {stardate: 1, enddate: 1}},
                    ]).toArray(cb)
                },
                assistanceLastYesterday: function (cb) {
                    ModelAsistencia.aggregate([
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {'$gte': end},
                                completed: 0
                            }
                        },
                        {
                            $project: {
                                endlocation: 1,
                                startlocation: 1,
                                resource: 1,
                                completed: 1,
                                startdate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: {"$add": ["$startdate", 3600000 * -5]}
                                    }
                                },
                                enddate: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date:
                                            {"$add": ["$enddate", 3600000 * -5]}

                                    }
                                }
                            }
                        },
                        {$sort: {stardate: 1, enddate: 1}},
                        {$limit: 1},
                    ]).toArray(cb);
                }
            },

            function (err, results) {

                if (results.assistanceToday.length > 0) {
                    res.end(res.json(results.assistanceToday));
                } else {
                    if (results.assistanceFirstToday.length > 0) {
                        res.end(res.json(results.assistanceFirstToday));
                    }
                    else {
                        if (results.assistanceLastYesterday.length > 0) {
                            res.end(res.json(results.assistanceLastYesterday))
                        }
                        else {
                            res.end(res.json(null));
                        }
                    }
                }
            }
        )
        ;
    }
)
;

router.get("/asistenciaHistoricoxRecurso/:resourceID&:startDate&:endDate", function (req, res, next) {

        let ModelAsistencia = db.collection("asistance");
        let var_resource = req.params.resourceID;

        let startDate = req.params.startDate;
        let start = new Date(startDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"));
        start.setHours(0, 0, 0);

        console.log(start.toLocaleDateString() + " " + start.toLocaleTimeString());


        let endDate = req.params.endDate;
        let end = new Date(endDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"));
        end.setHours(23, 59, 59);

        console.log(end.toLocaleDateString() + " " + end.toLocaleTimeString());


        async.parallel({
            assistanceHistoric: function (cb) {
                ModelAsistencia.aggregate([
                    {
                        $project: {
                            endlocation: 1,
                            startlocation: 1,
                            resource: 1,
                            completed: 1,
                            validStartDate: {'$gte': [{"$add": ["$startdate", 3600000 * -5]}, start]},
                            validEndDate:   {'$lte': [{"$add": ["$enddate", 3600000 * -5]}, end]},
                            startdate: {
                                $dateToString: {
                                    format: "%Y-%m-%d %H:%M:%S",
                                    date: {"$add": ["$startdate", 3600000 * -5]}
                                }
                            },
                            enddate: {
                                $dateToString: {
                                    format: "%Y-%m-%d %H:%M:%S",
                                    date:
                                        {"$add": ["$enddate", 3600000 * -5]}

                                }
                            }
                        }
                    },
                    {
                        $match: {
                            resource: var_resource,
                            validStartDate: true,
                            validEndDate: true
                        }
                    },
                    {$sort: {stardate: 1, enddate: 1}}
                ]).toArray(cb);
            }
        }, function (err, results) {

            if (results.assistanceHistoric.length > 0) {
                res.end(res.json(results.assistanceHistoric));
            } else {
                res.end(res.json(null));
            }
        });
    }
)
;

module.exports = router;