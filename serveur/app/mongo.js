var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var MQTTModule = require('./mqtt');
const url = 'mongodb://localhost:27017';
const dbName = 'iotbdd';

const ledsCollection = "leds";
const temperaturesCollection = "temperatures";
const photosensorsCollection = "photosensors";
const batimentsCollection = "batiments";

exports.insertTemperature = function(data){
     MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
        var myobj = data;
        dbo.collection(temperaturesCollection).insertOne(myobj, function(err, res) {
            assert.equal(null, err);
          console.log("[INFO][TEMPERATURES] 1 document inserted ");
          console.log(myobj);
          db.close();
        });
      });
}

exports.insertPhotovalue = function(data){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
        var myobj = data;
        dbo.collection(photosensorsCollection).insertOne(myobj, function(err, res) {
            assert.equal(null, err);
            console.log("[INFO][PHOTOVALUES] 1 document inserted ");
            console.log(myobj);
          db.close();
        });
      });
}

exports.ledManagement = function(data){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
        dbo.collection(ledsCollection).count({}, function(error, numOfDocs) {
            if(numOfDocs == 0){
                insertLedState(data);
            }else{
                updateLedState(data);
            }
            db.close();
        });
       
      });
}

exports.insertTemperatureBatiment = function(data){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
        dbo.collection(batimentsCollection).countDocuments({idbatiment:data.idbat}, function(error, numOfDocs) {
            if(numOfDocs != 0){             
                //db.users.find({awards: {$elemMatch: {award:'National Medal', year:1975}}})
                dbo.collection(batimentsCollection).countDocuments({$and : [ 
                    {idbatiment:data.idbat},
                    {'salles.idsalle':data.idsalle}
                ]}, function(error, numOfDocs) {
                    if(numOfDocs != 0){
                        //insert temperature
                        var myquery = {
                            idbatiment:data.idbat,
                            'salles.idsalle':data.idsalle
                            };
                            
                            
                        var newvalues = {  $set : {
                            'salles.$.seuilTemperature' : data.seuilTemperature,
                        },$push : { 'salles.$.temperatures' :{ 
                            date:data.date,
                            valeur:data.temperature}  
                            }
                        };
                        
                        
                        dbo.collection(batimentsCollection).updateOne(myquery,newvalues,function(err, res) {
                            assert.equal(null, err);
                            console.log("[INFO][BATIMENTS] Document updated : " + res.result.nModified);
                          db.close();
                        });
                    }else{
                        //insert salle 
                        var myquery = {$and : [ 
                            {idbatiment:data.idbat}
                        ]};

                        var newvalues = { $push : { salles :{ 
                            idsalle: data.idsalle, 
                            seuilTemperature : data.seuilTemperature,
                            etatRadiateur : "OFF",
                            etatIncendie : "NULL",
                            temperatures:[{date:data.date,
                                valeur:data.temperature}]
                                }
                            }
                        };

                        dbo.collection(batimentsCollection).updateOne(myquery,newvalues,function(err, res) {
                            assert.equal(null, err);
                            console.log("[INFO][BATIMENTS]  Document updated : " + res.result.nModified);
                          db.close();
                        });

                    }
                    db.close();
                });
            }else{
                dbo.collection(batimentsCollection).insertOne({idbatiment:data.idbat,salles:[
                    {idsalle:data.idsalle,
                    etatRadiateur : "OFF",
                    etatIncendie : "NULL",
                    seuilTemperature : data.seuilTemperature,
                    temperatures:[{date:data.date,valeur:data.temperature}]}
                ]}, function(err, res) {
                    assert.equal(null, err);
                    console.log("[INFO][BATIMENTS]  1 document inserted");
                  db.close();
                });
            }
        });
      });
}

exports.setEtatRadiateur = function(idbat,idsa,updatedLedState){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
            dbo.collection(batimentsCollection).updateOne({$and : [{idbatiment:idbat},{'salles.idsalle':idsa}]}, {$set :{'salles.$.etatRadiateur' : updatedLedState.state}}, function(err, res) {
            assert.equal(null, err);
            console.log("[INFO][RADIATEUR]  Document updated : " + res.result.nModified);
              if(res.result.nModified != 0){
                    MQTTModule.publishLed(idbat,idsa,updatedLedState.state);
              }
              db.close();
            });
      });
}

exports.setEtatIncendie= function(idbat,idsa,eIncendie){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
            dbo.collection(batimentsCollection).updateOne({$and : [{idbatiment:idbat},{'salles.idsalle':idsa}]}, {$set :{'salles.$.etatIncendie' : eIncendie}}, function(err, res) {
            assert.equal(null, err);
         //   console.log("[INFO][INCENDIE]  Document updated : " + res.result.nModified);
              db.close();
            });
      });
}


function insertLedState(data){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
        var myobj = data;
        dbo.collection(ledsCollection).insertOne(myobj, function(err, res) {
            assert.equal(null, err);
            console.log("[INFO][LED] 1 document inserted ");
            console.log(myobj);
            db.close();
        });
      });
}

function updateLedState(data){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        var dbo = db.db(dbName);
            var myquery = { sensorid: data.sensorid };
            var newvalues = { $set: { state : data.state} };
            dbo.collection(ledsCollection).updateOne(myquery, newvalues, function(err, res) {
                assert.equal(null, err);
                console.log("[INFO][LED] Document updated : " + res.result.nModified);
              db.close();
            });
      });
}


