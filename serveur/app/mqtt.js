const mongoDBModule = require('./mongo.js');

var mqtt=require('mqtt');
var client = mqtt.connect("mqtt://broker.hivemq.com")
var topicPATH = "miage/iot/saez-robin/uca/+/+/"
var topicSubTemp = "temperature"
var topicSubIncendie = "incendie"
const topicTime = 'miage/iot/saez-robin/uca/time';


var MINUTE = 1000;

// Connect to mqtt Broker
client.on('connect', () => {
    //sub
    console.log("MQTT : connected");
    client.subscribe(topicPATH+""+topicSubTemp)
    client.subscribe(topicPATH+""+topicSubIncendie)
    console.log("Topic subscribed : "+ topicPATH+""+topicSubTemp);
    console.log("Topic subscribed : "+ topicPATH+""+topicSubIncendie);
    setTimeout(publishDate, 1000);
  });


  publishDate = function(){
      client.publish(topicTime,new Date().getHours()+":"+new Date().getMinutes());
      setTimeout(publishDate, MINUTE * 10);
   }

  exports.publishLed = function(bat,salle,mes){
        //pub
    //on recupere la donnée mongo 
    if(client.connected){
      console.log("[INFO] ledstate for bat : " + bat +" salle :" + salle + " has changed");
      client.publish('miage/iot/saez-robin/uca/'+bat+'/'+salle+'/radiateur',mes);
    }else{
      console.log("[ERROR] can't connect to broker");
    }
    //client.publish("miage/iot/saez-robin/uca/test/test/led", "test message")
  }


  // Error to connect
  client.on("error",function(error){
    console.log("Can't connect" + error);
    process.exit(1)
  });
  
  //Quand on recoit un message
  client.on('message', (topic, message) => {

      var parsedResp =  topic.split("/");
      var targetTopic = parsedResp[parsedResp.length-1];
      var numroSalle = parsedResp[parsedResp.length-2];
      var numeroBatiment = parsedResp[parsedResp.length-3];
  
      var res = ""+message;
      var currentTemperature = res.split("/")[0];
      var seuilTemperature = res.split("/")[1];
    
      if(targetTopic == topicSubTemp){
        var newData = {
          idbat : numeroBatiment,
          idsalle : numroSalle,
          date : new Date().toLocaleString(),
          temperature : currentTemperature,
          seuilTemperature : seuilTemperature
        }
        mongoDBModule.insertTemperatureBatiment(newData);
  
      }else if(targetTopic == topicSubIncendie){
          mongoDBModule.setEtatIncendie(numeroBatiment,numroSalle,res);
      }


  });
  