#include "WiFi.h"
#include "HTTPClient.h"
#include "OneWire.h"
#include "DallasTemperature.h"
#include "ArduinoJson.h"

#define uS_TO_S_FACTOR 1000000  /* Conversion factor for micro seconds to seconds */
#define TIME_TO_SLEEP  120        /* Time ESP32 will go to sleep (in seconds) */

RTC_DATA_ATTR int bootCount = 0;

const char* ssid = "HUAWEI P20 Pro";
const char* password =  "feb0134e4ecc";
const String serverURL = "http://192.168.43.63:8081";
const int ledPin = 19;
const int temperaturePin = 23;
const int sensorPin = A0;
const int SEUIL_INCENDIE = 50;
const int actionTime = 60; //60 seconds

OneWire oneWire(temperaturePin);
DallasTemperature temperatureSensor(&oneWire);

HTTPClient clientESP;
float temperatureValue;
int sensorValue;

void printWiFiStatus(){
  Serial.println("------------------");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.print(WiFi.localIP());
  Serial.println("");
  Serial.print("MAC address: ");
  Serial.print(WiFi.macAddress());
  Serial.println("");
  Serial.println("------------------");
}

void connectWiFi(){
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(" .");
  }
  Serial.println("");
  printWiFiStatus();
}


void setup() {
  Serial.begin(9600);
  ++bootCount;
   esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  temperatureSensor.begin();
  connectWiFi();

    boolean goToDeepSleep = true;
    if(WiFi.status()== WL_CONNECTED){
      int currentActionTime = 0;
       //Interaction pendant 1 minute
        while(currentActionTime < actionTime * 1000){
          //On recupere l'etat de la led
           getLedState();
           delay(500);
           currentActionTime+= 500;
        }
      
      //put
      putTemperatureData();
      putPhotosensorData();
       if(temperatureValue >= SEUIL_INCENDIE){
          goToDeepSleep = false;
      }
    }else{
    Serial.println("Error in WiFi connection");
    }
   //deepsleep
  Serial.println("Going to sleep now");
  Serial.flush(); 
  esp_deep_sleep_start();
   
}

void getLedState(){
  
  // Send GET request
  String getLedURL = serverURL + "/api/led?ledid=1";
  clientESP.begin(getLedURL);
  clientESP.addHeader("Content-Type", "application/json");
  int httpCode = clientESP.GET();

  // Handle response
  if(httpCode > 0){
    String response = clientESP.getString();
    
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& ledData = jsonBuffer.parseObject(response);
    if(!ledData.success()) {
      Serial.println("Response parsing failed");
      clientESP.end();
      return;
    }
    String ledState = ledData["state"];
    
    // Print response
    //Serial.println(httpCode);
    //Serial.print("Led ");
    //Serial.println(ledState);
    
    // Modify led state
    if(ledState == "ON"){
      digitalWrite(ledPin, HIGH);
    } else{
      digitalWrite(ledPin, LOW);
    }
  }
  else{
    // Print error
    Serial.print("Error on sending GET Request: ");
    Serial.println(httpCode);
  }
  clientESP.end();
}

void putTemperatureData(){
  
  // Get temperature data
  temperatureSensor.requestTemperaturesByIndex(0);
  temperatureValue = temperatureSensor.getTempCByIndex(0);

  // Send PUT request
  String putTemperatureURL = serverURL + "/api/temperatures";
  clientESP.begin(putTemperatureURL);
  clientESP.addHeader("Content-Type", "application/json");

  String sensorData = "{\"id\": \"1\", \"value\": \"";
  sensorData += temperatureValue;
  sensorData += "\"}";
  
  int httpCode = clientESP.POST(sensorData);

  // Handle response
  if(httpCode>0){
    String response = clientESP.getString();
    // Print response
    Serial.println(httpCode);
    Serial.println(response);
  }else{
    // Print error
    Serial.print("Error on sending PUT Request: ");
    Serial.println(httpCode);
  }
  clientESP.end();
}

void putPhotosensorData(){
  
  // Get photosensor data
  sensorValue = analogRead(sensorPin);
  Serial.print("Photoresistor : ");
  Serial.println(sensorValue, DEC);

  // Send PUT request
  String putPhotosensorURL = serverURL + "/api/photosensor";
  clientESP.begin(putPhotosensorURL);
  clientESP.addHeader("Content-Type", "application/json");
 
  String sensorData = "{\"id\": \"1\", \"value\": \"";
  sensorData += sensorValue;
  sensorData += "\"}";
  
  int httpCode = clientESP.POST(sensorData);

  // Handle response
  if(httpCode>0){
    String response = clientESP.getString();   
    // Print response
    Serial.println(httpCode);
    Serial.println(response);
  }
  else{
    // Print error
    Serial.print("Error on sending PUT Request: ");
    Serial.println(httpCode);
  }
  clientESP.end();
}


void loop() {



}
