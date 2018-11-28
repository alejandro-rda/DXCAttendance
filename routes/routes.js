const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const moment = require('moment-timezone');
moment.tz.setDefault("America/Lima");
const express = require('express');
const path = require('path');
const fs = require('fs');
const ObjectID = require("mongodb").ObjectID;
const async = require('async');
const url = 'mongodb://dxc-asistencia-2:8wDyfljQlOopuzGRrriq0JU3xFh1CNIPfWUTbubYD58S4E7XQZdomFY8MFfg6gQVBe2fEBLKv9hs0HtkzdyCEw%3D%3D@dxc-asistencia-2.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';
let db = null;
let router = express.Router();

let connectionString = "DefaultEndpointsProtocol=https;AccountName=dxcstorageattendance;AccountKey=H3RR5kLymDXx/tXBtU18X1pKs2yghteXDA58lrEYOT7jD1iyE9/vXjWMbd6MF0/0B/btMTlaZaDx0XRcQIaaEQ==;EndpointSuffix=core.windows.net";

const storageName = {
    getStorageAccountName: () => {
        const matches = /AccountName=(.*?);/.exec(connectionString);
        return matches[1];
    }
};

const multer = require('multer'),
    storage = multer.memoryStorage(),
    upload = multer({storage: storage})
    , azureStorage = require('azure-storage')
    , blobService = azureStorage.createBlobService(connectionString)
    , getStream = require('into-stream')
    , containerName = 'dxcprofilepictures',
    BlockBlobURL = require('azure-storage');

MongoClient.connect(url, function (err, client) {
    if (err) {
        console.error(err)
    }
    db = client.db('dxc_asistencia');
    console.log("Conexion realizada");
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.end("The service of DXC-Attendance it works!: " + new Date());
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

        let yesterday = moment(currDate, 'YYYY-MM-DD').toDate();
        let yesterDayResult = moment(yesterday)
            .add(-1, 'days')
            .format("YYYY-MM-DD");

        async.parallel({
                assistanceFirstToday: function (cb) {
                    ModelAsistencia.aggregate([
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
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {$regex: currDate, $options: 'g'},
                            }
                        },
                        {$sort: {stardate: 1}},
                        {$limit: 1}
                    ]).toArray(cb)
                },

                assistanceToday: function (cb) {
                    ModelAsistencia.aggregate([
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
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {$regex: currDate, $options: 'g'},
                            }
                        },
                        {$sort: {start: 1, end: 1}},
                    ]).toArray(cb)
                },
                assistanceLastYesterday: function (cb) {
                    ModelAsistencia.aggregate([
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
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {$regex: yesterDayResult, $options: 'g'},
                                completed: 0
                            }
                        },
                        {$sort: {stardate: 1, enddate: 1}},
                        {$limit: 1},
                    ]).toArray(cb);
                }
            },

            function (err, results) {


                if (results.assistanceToday != null && results.assistanceToday.length > 0) {
                    res.end(res.json(results.assistanceToday));
                } else {
                    if (results.assistanceFirstToday != null && results.assistanceFirstToday.length > 0) {
                        res.end(res.json(results.assistanceFirstToday));
                    }
                    else {
                        if (results.assistanceLastYesterday != null && results.assistanceLastYesterday.length > 0) {
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

        let endDate = req.params.endDate;
        let end = new Date(endDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1/$2/$3"));
        end.setHours(23, 59, 59);

        async.parallel({
            assistanceHistoric: function (cb) {
                ModelAsistencia.aggregate([
                    {
                        $project: {
                            endlocation: 1,
                            startlocation: 1,
                            resource: 1,
                            completed: 1,
                            validStartDate: {'$gte': ["$startdate", start]},
                            validEndDate: {'$lte': ["$enddate", end]},
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
                    {$sort: {start: 1, end: 1}}
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


router.post('/uploadProfilePicture', upload.single('file'), (req, res) => {

    const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string

    const
        blobName = identifier
        , stream = getStream(req.file.buffer)
        , streamLength = req.file.buffer.length
    ;

    blobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, function callback(err, result, response) {

        if (err) {
            console.log(err);
            return;
        }


        let resourceId = req.headers.resource;
        getProfile(function () {
        }, resourceId, blobName, res);

    });
});

let insertProfile = function (callback, resourceID, URLimageStorage, response) {

    let ModelAsistencia = db.collection("profile");

    ModelAsistencia.replaceOne(
        {"resource": resourceID},
        {"resource": resourceID, "url": URLimageStorage},
        {upsert: true},
        function (err, result) {

            if (err) {
                console.log(err);
                return;
            }

            assert.equal(err, null);
            response.end(response.json(result));
        });

};

let getProfile = function (callback, resourceID, URLimageStorage, response) {

    let ModelAsistencia = db.collection("profile");

    ModelAsistencia.findOne(
        {"resource": resourceID},
        {"url": "url"},
        function (err, result) {

            if (err) {
                console.log(err);
                return;
            }

            // if retrieve a element, delete the last block of resource id
            if (result != null) {
                blobService.deleteBlob(containerName, result.url, function (err, response, next) {

                    if (err) {
                        console.log(err);
                        return;
                    }

                    console.log("Se elimino el blob: " + result.url)
                })
            }


            insertProfile(callback, resourceID, URLimageStorage, response);

        });

};

router.get('/getProfilePicture/:resourceID', (req, res, next) => {

    let ModelAsistencia = db.collection("profile");
    let resourceID = req.params.resourceID;

    ModelAsistencia.findOne(
        {"resource": resourceID},
        function (err, result) {

            if (err) {
                console.log(err);
                res.end(res.json(err));
            }

            res.end(res.json(result));

        });

});

router.get('/validLastAttendance/:resourceID&:lastUpdateID', (req, res, next) => {

    let ModelAsistencia = db.collection("asistance");
    let resourceID = req.params.resourceID;
    let id = req.params.lastUpdateID;

    ModelAsistencia.findOne(
        {
            "resource": resourceID,
            "_id": ObjectID(id)
        },
        function (err, result) {

            if (err) {
                console.log(err);
                res.end(res.json(err));
            }

            let startDate = moment(result.startdate);
            let sysDate = moment(new Date());
            let duration = moment.duration(sysDate.diff(startDate));
            let hours = duration.asHours();

            if (hours>4) {
                res.end(res.json(true));
            } else {
                res.end(res.json(false));
            }
        });

});


router.get("/validAsistenciaIngreso/:resourceID&:currDate", function (req, res, next) {

        let ModelAsistencia = db.collection("asistance");
        let var_resource = req.params.resourceID;
        let currDate = req.params.currDate;

        async.parallel({
                assistanceToday: function (cb) {
                    ModelAsistencia.aggregate([
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
                        {
                            $match: {
                                resource: var_resource,
                                startdate: {$regex: currDate, $options: 'g'},
                            }
                        },
                        {$sort: {start: 1, end: 1}},
                    ]).toArray(cb)
                }},
                function (err, results) {

                    console.log(results);

                    if (results.assistanceToday != null && results.assistanceToday.length > 0) {
                        if (results.assistanceToday.length < 2) {
                            res.end(res.json("VÁLIDO"));
                        }else if(results.assistanceToday.length === 2){
                            res.end(res.json("ÚLTIMA"));
                        }else{
                            res.end(res.json("INVÁLIDO"));
                        }
                    }

            }
        )
        ;
    }
)
;


module.exports = router;
