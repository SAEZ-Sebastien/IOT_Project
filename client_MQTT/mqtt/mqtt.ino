/*********
 Based on Rui Santos work :
 https://randomnerdtutorials.com/esp32-mqtt-publish-subscribe-arduino-ide/
 Modified by GM
*********/
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DallasTemperature.h>

WiFiClient espClient;           // Wifi 
PubSubClient client(espClient); // MQTT client

OneWire oneWire(23);
DallasTemperature tempSensor(&oneWire);

/*===== MQTT broker/server and TOPICS ========*/
const char* mqtt_server = "broker.hivemq.com"; /* "broker.shiftr.io"; */
#define BATIMENT "B7"
#define SALLE "A331"
#define TOPIC_TEMP "miage/iot/saez-robin/uca/" BATIMENT "/" SALLE "/temperature"
#define TOPIC_RADIATEUR "miage/iot/saez-robin/uca/" BATIMENT "/" SALLE "/radiateur"
#define TOPIC_INCENDIE "miage/iot/saez-robin/uca/" BATIMENT "/" SALLE "/incendie"
#define TOPIC_TIME "miage/iot/saez-robin/uca/time"

#define uS_TO_S_FACTOR 1000000  /* Conversion factor for micro seconds to seconds */
#define TIME_TO_SLEEP  120        /* Time ESP32 will go to sleep (in seconds) */

RTC_DATA_ATTR int bootCount = 0;


/*============= GPIO ======================*/
float temperature = 0;
float light = 0;
const int ledPin = 19; // LED Pin
const float SEUIL_JOUR = 25; // cas permettant de reproduire un incendie facilement
const float SEUIL_NUIT = 15;
const int heureDebutNuit = 20;
const int heureFinNuit = 7;
const int minuteDebutNuit = 30;
const int minuteFinNuit = 20;

int heuresCourante = -1;
int minutesCourante = -1;
int counterPublishStart = 0;
int counterPublishEnd = 2 * 60000;
/*================ WIFI =======================*/
void print_connection_status() {
  Serial.print("WiFi status : \n");
  Serial.print("\tIP address : ");
  Serial.println(WiFi.localIP());
  Serial.print("\tMAC address : ");
  Serial.println(WiFi.macAddress());
}

void connect_wifi() {
 const char* ssid = "HUAWEI P20 Pro";
const char* password =  "feb0134e4ecc";
  
  Serial.println("Connecting Wifi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("Attempting to connect Wifi ..");
    delay(1000);
  }
  Serial.print("Connected to local Wifi\n");
  print_connection_status();
}

/*=============== SETUP =====================*/
void setup() {  
   // ++bootCount;
   //esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  connect_wifi();
  tempSensor.begin();
  client.setServer(mqtt_server, 1883);
  // set callback when publishes arrive for the subscribed topic
  client.setCallback(mqtt_pubcallback); 

     //deepsleep
  //Serial.println("Going to sleep now");
  //Serial.flush(); 
//  esp_deep_sleep_start();
  
}

/*============== CALLBACK ===================*/
void mqtt_pubcallback(char* topic, byte* message, 
                      unsigned int length) {
  // Callback if a message is published on this topic.
  
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.println();
  String messString;

  if((String)topic == TOPIC_TIME){
    bool minute = false;
  for (int i = 0; i < length; i++) {
    
     if(!minute){
          messString += (char)message[i];
    }else{
       messString += (char)message[i];
    }
    
    if((char)message[i] == ':'){
        heuresCourante = messString.toInt();
        messString = "";
        minute = true;
    }
  }
  minutesCourante = messString.toInt(); 
  }



  if((String)topic == TOPIC_RADIATEUR){
    for(int i = 0; i<length;i++){
      messString+= (char)message[i];
      
    }
      if(messString == "ON"){
        set_Radiateur(HIGH);
      }else{
        set_Radiateur(LOW);
      }
  }
   
}

void set_Radiateur(int v){
  digitalWrite(ledPin, v);
}

/*============= SUBSCRIBE =====================*/
void mqtt_mysubscribe(char *topic1,char*topic2) {
  while (!client.connected()) { // Loop until we're reconnected
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("esp32", "try", "try")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe(topic1);
      client.subscribe(topic2);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

float get_Temperature(){
  float temperature;
  tempSensor.requestTemperaturesByIndex(0);
  temperature = tempSensor.getTempCByIndex(0);
  return temperature;
}

/*================= LOOP ======================*/
void loop() {

      if (!client.connected()) { 
    mqtt_mysubscribe((char *)(TOPIC_TIME),(char *)(TOPIC_RADIATEUR));
  }

  /*--- Publish Temperature periodically   */
  temperature = get_Temperature();
  char tempString[20];
  dtostrf(temperature, 1, 2, tempString);
  if(heuresCourante != -1 && minutesCourante != -1){
    
  if(heuresCourante > heureDebutNuit 
  ||  heuresCourante < heureFinNuit 
  || ( heuresCourante == heureDebutNuit && minutesCourante > minuteDebutNuit) 
  || ( heuresCourante == heureFinNuit && minutesCourante<minuteFinNuit )){


    sprintf(tempString,"%.2f/%.2f",temperature, SEUIL_NUIT);
      if(temperature > SEUIL_NUIT){
        //publish incendie
        client.publish(TOPIC_INCENDIE, "true");
      }else{
        client.publish(TOPIC_INCENDIE, "false");
      }
  }else{
    sprintf(tempString,"%.2f/%.2f",temperature, SEUIL_JOUR);
    if(temperature > SEUIL_JOUR){
        //publish incendie
        client.publish(TOPIC_INCENDIE, "true");
      }else{
        client.publish(TOPIC_INCENDIE, "false");
      }
  }

  if(counterPublishStart > counterPublishEnd){
     Serial.print(TOPIC_TEMP);
    Serial.print("Published Temperature : "); Serial.println(tempString);
    client.publish(TOPIC_TEMP, tempString);
    counterPublishStart = 0;
  }

}
client.loop();
//delay(5000);
counterPublishStart += 5000;
}
