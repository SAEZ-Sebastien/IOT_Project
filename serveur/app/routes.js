const mongoDBModule = require('./mongo.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const url = 'mongodb://localhost:27017';
const dbName = 'iotbdd';

const ledsCollection = "leds";
const temperaturesCollection = "temperatures";
const photosensorsCollection = "photosensors";
const batimentsCollection = "batiments";;

module.exports = function(app) {

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        next();
    });

    app.post('/api/temperatures', function(req, res) {
        var newTemp = req.body;
        newTemp.date = new Date().toLocaleString();
        mongoDBModule.insertTemperature(newTemp);
        res.end(JSON.stringify(newTemp, null, 4));
    });

    app.get('/api/temperatures', function(req, res) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var dbo = db.db(dbName);
            dbo.collection(temperaturesCollection).find({}).toArray(function(err, result) {
            assert.equal(null, err);
            res.end(JSON.stringify(result, null, 4)); 
            db.close();
            });
          });  
    });

    app.get('/api/led', function(req, res) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var dbo = db.db(dbName);
            dbo.collection(ledsCollection).findOne({sensorid:req.query.ledid}, function(err, result) {
            assert.equal(null, err);
            res.end(JSON.stringify(result, null, 4));
            db.close();
            });
          });
          
    });

    app.put('/api/led', function(req, res) {
        var updatedLedState = req.body; 
        mongoDBModule.ledManagement(updatedLedState);
        res.end(JSON.stringify(updatedLedState, null, 4));
    });

    app.post('/api/photosensor', function(req, res) {
        var newPhoto = req.body;
        newPhoto.date = new Date().toLocaleString();
        mongoDBModule.insertPhotovalue(newPhoto);
        res.end(JSON.stringify(newPhoto, null, 4));
    });

    app.get('/api/photosensor', function(req, res) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var dbo = db.db(dbName);
            dbo.collection(photosensorsCollection).find({}).toArray(function(err, result) {
            assert.equal(null, err);
            res.end(JSON.stringify(result, null, 4));  
            db.close();
            });
          });

       
    });

    app.put('/api/uca/led', function(req, res) {
        var idbatiment = req.query.idbat;
        var idsalle = req.query.idsal;

        var updatedLedState = req.body; 
        if(idbatiment != null & idsalle != null){
            mongoDBModule.setEtatRadiateur(idbatiment,idsalle,updatedLedState);
        }else{
            updatedLedState = null
        }   
        res.end(idbatiment + " - "+ idsalle+"" + JSON.stringify(updatedLedState, null, 4));
    });

    //récupération des données pour le client
    app.get('/api/uca/batiment',function (req,res){
        console.log(req.query.id);
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var dbo = db.db(dbName);
            dbo.collection(batimentsCollection).findOne({idbatiment:req.query.id}, function(err, result) {
            assert.equal(null, err);
            res.end(JSON.stringify(result, null, 4));
            db.close();
            });
          });
    });
    
    //get list of batiments
    app.get('/api/uca/listbatiments',function (req,res){
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var dbo = db.db(dbName);
         //   dbo.collection(batimentsCollection).find({}, { projection: { _id: 0,idbatiment:1 } }).toArray(function(err, result) {
            dbo.collection(batimentsCollection).find({}).toArray(function(err, result) {
            console.log(result);
             assert.equal(null, err);
            res.end(JSON.stringify(result, null, 4));
            db.close();
            });
          });

    });
}