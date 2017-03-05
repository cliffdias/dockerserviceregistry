/**
 * This File provides the Data access layer for the MarkersDB database
 */

var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var MongoClient = require('mongodb').MongoClient;

var dburi = "mongodb://mongo/markersdb";

//var server = new Server(process.env.MONGO_HOST || 'localhost', parseInt(process.env.MONGO_PORT) || 27017, { auto_reconnect: true });
//var db = new Db('markersdb', server, { safe: true });

var db;

/*
db.open(function (err, db) {
    console.log("Connecting to DB");
    if (!err) {
        console.log("Connected to 'markersdb' database");
        populateDB();
    }
    else{
        console.log("ERROR " + err);
    }
});
*/

MongoClient.connect(dburi, function (err, database){
    console.log("Connecting to DB");
    if (!err) {
        db = database;
        console.log("Connected to 'markersdb' database");
        populateDB();
    }
    else{
        console.log("ERROR " + err);
    }
});

exports.findById = function (req, res) {
    var id = req.params.id;
    console.log('Retrieving markers: ' + id);
    db.collection('markers', function (err, markerscollection) {

        if (err) {
            console.log('Error Is ' + err);
        }
        else {

            markerscollection.find({ 'trid': id }).toArray(function (err, items) {
                if (err) {
                    console.log('error ' + err);
                    res.send('<html>error</html>');

                }
                else {
                    res.send(items);
                }

            });

        }
    });
};


/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function () {

    console.log('populating DB');
    var markers = [
        {
            lat: "51.4756",
            lng: "-0.350133333",
            time: "2017-01-13T09:14:35.000Z",
            trid: "JG189878787878GB"
        },
        {
            lat: "51.47606",
            lng: "-0.34754",
            time: "2017-01-13T09:17:49.000Z",
            trid: "JG189878787878GB"
        }

    ];

    db.collection('markers', function (err, collection) {
        console.log('inserting markers');
        collection.insert(markers, { safe: true }, function (err, result) {
            console.log('Done insertion');
        });
    });

};
