<template>
	<el-container id="app">
		<el-header>
			<h1>IoT Dashboard</h1>
		</el-header>
		<notifications group="foo" />
		<el-collapse v-model="activeCollapseItems">
			<el-collapse-item name="http">
				<template slot="title">
					<h2>ESP2 Dashboard</h2>
				</template>
				<el-container id="httpContainer" direction="horizontal">
					<el-row class="row">
						<el-col>
							<el-card class="switchCard" shadow="hover">
								<div slot="header">
									<h3>Led switch</h3>
								</div>
								<el-switch
									v-model="ledAlight"
									active-text="Led ON"
									inactive-text="Led OFF"
									@change="toggleLed">
								</el-switch>
							</el-card>
						</el-col>
						<el-col>
							<el-card class="chartCard" shadow="hover">
								<div slot="header" class="cardHeader">
									<h3>Photosensor</h3>
								</div>
								<PhotosensorChart :photosensorData="photosensorData"/>
							</el-card>
						</el-col>
						<el-col>
							<el-card class="chartCard" shadow="hover">
								<div slot="header" class="cardHeader">
									<h3>Température</h3>
								</div>
								<TemperatureChart :temperatureData="temperatureData"/>
							</el-card>
						</el-col>
					</el-row>
				</el-container>
				<el-alert 
					id="esp32LastUpdate" 
					type="info" 
					:title="esp32LastUpdate"
					:closable="false">
				</el-alert>
			</el-collapse-item>
			<el-collapse-item name="mqtt">
				<template slot="title">
					<h2>UCA Dashboard</h2>
				</template>
				<el-container id="mqttContainer">
					<el-main>
						<el-dropdown split-button @command="selectBatiment">
							Bâtiments
							<el-dropdown-menu slot="dropdown">
								<el-dropdown-item
									v-for="b in batiments"
									:key="b.idbatiment"
									:command="batiments.indexOf(b).toString()">
									{{b.idbatiment}}
								</el-dropdown-item>
							</el-dropdown-menu>
						</el-dropdown>
						<el-card class="tableCard" shadow="hover" v-if="batiments.length != 0">
							<el-breadcrumb separator-class="el-icon-arrow-right">
								<el-breadcrumb-item>UCA</el-breadcrumb-item>
								<el-breadcrumb-item>Bâtiment {{ this.batiments[activeBat].idbatiment }}</el-breadcrumb-item>
							</el-breadcrumb>
							<el-table id="tableSalles" :data="batiments[activeBat].salles">
								<el-table-column 
									label="Salle"
									prop="idsalle"
									align="center"
									width="100px">
								</el-table-column>
								<el-table-column 
									label="Températures"
									header-align="center"
									width="370px">
									<template slot-scope="scope">
										<TemperatureSalleMiniChart :key="activeBat+ scope.row.idsalle  + scope.row.temperatures[scope.row.temperatures.length-1].valeur" :temperatureData="getConvertedData(scope.row.idsalle)"/>
									</template>
								</el-table-column>
								<el-table-column 
									label="Dernière température"
									align="center">
									<el-table-column
										label="Date & Heure"
										align="center"
										width="250px">
										<template slot-scope="scope">
											<el-date-picker 
												type="datetime" 
												:value="scope.row.temperatures[scope.row.temperatures.length-1].date" 
												format="dd/MM/yyyy HH:mm:ss"
												align="center"
												readonly>
											</el-date-picker>
										</template>
									</el-table-column>
									<el-table-column
										label="Valeur"
										align="center"
										width="100px">
										<template slot-scope="scope">
											{{ scope.row.temperatures[scope.row.temperatures.length-1].valeur }}
										</template>
									</el-table-column>
								</el-table-column>
								<el-table-column
									label="Etat du capteur"
									align="center"
									width="150px">
									<template slot-scope="scope">
										<el-tag 
											v-if="calculEtatCapteur(scope.row.temperatures[scope.row.temperatures.length-1].date)" 
											type="success">
											Opérationnel
										</el-tag>
										<el-tag 
											v-else 
											type="danger">
											Défaillant
										</el-tag>
									</template>
								</el-table-column>
								<el-table-column 
									label="Radiateur"
									align="center"
									width="150px">
									<template slot-scope="scope">
										<el-switch 
											:name="batiments[activeBat].idbatiment + '.' + scope.row.idsalle + '.switch'"
											v-model="scope.row.etatRadiateur"
											active-color="#FEB019"
											active-value="ON"
											inactive-value="OFF"
											active-text="ON"
											inactive-text="OFF"
											@change="switchRadiator($event, batiments[activeBat].idbatiment, scope.row.idsalle, scope.row)">
										</el-switch>
									</template>
								</el-table-column>
							</el-table>
							<el-alert 
								id="ucaLastUpdate" 
								type="info" 
								:title="ucaLastUpdate"
								:closable="false">
							</el-alert>
						</el-card>
					</el-main>
				</el-container>
			</el-collapse-item>
		</el-collapse>

	</el-container>
</template>

<script>
import VueApexCharts from 'vue-apexcharts';

import PhotosensorChart from './components/PhotosensorChart.component.vue';
import TemperatureChart from './components/TemperatureChart.component.vue';
import TemperatureSalleMiniChart from './components/TemperatureSalleMiniChart.component.vue';

var ip = require('ip');

export default {
	name: 'app',
	data () {
		return {
			//serverIP: "192.168.1.10",
			//serverIP: "10.154.119.104",
			serverIP: "192.168.43.63",

			port: 8081,

			ledAlight: false,

			photosensorData: [],
			temperatureData:[],
			batiments: [],
			activeCollapseItems: ['http', 'mqtt'],
			activeBat: 0,
			convertedDataChart: new Map(),

			updateCounterESP32: setInterval(this.updateESP32Dashboard, 120000),	// 2min
			updateCounterUCA: setInterval(this.updateUCABatiments, 120000),	// 2min

			esp32LastUpdate: "Last update: " + new Date().toLocaleString(),
			ucaLastUpdate: "Last update: " + new Date().toLocaleString(),
		}
	},
	components: {
		PhotosensorChart,
		TemperatureChart,
		TemperatureSalleMiniChart
	},
	mounted: function(){
		let url = "http://" + this.serverIP + ":" + this.port + "/api/led?ledid=1";
		fetch(url, {
				method: 'GET'
			})
			.then((responseJSON) =>{
				responseJSON.json()
					.then((res) => {
						if(res.state == "ON"){
							this.ledAlight = true;
						}
						else {
							this.ledAlight = false;
						}
					});
			})
			.catch(function (err) {
				console.log(err);
			});
		this.updateESP32Dashboard();
		this.updateUCABatiments();
	},
	methods: {


		putRequest(target, newData){
			let url = "http://" + this.serverIP + ":" + this.port + "/api/" + target;
				
			fetch(url, {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: newData
			})
			.catch(function (err) {
				console.log(err);
				return false;
			});
			return true;
		},



		toggleLed(){
			let ledState = this.ledAlight ? 'ON' : 'OFF';
			let ledNewData = JSON.stringify({
				sensorid: '1',
				state: ledState
			});
			let success = this.putRequest("led", ledNewData);
			if(success)
				console.log("Led switched "+ledState);
		},


		updatePhoto(){
			let url = "http://" + this.serverIP + ":" + this.port + "/api/photosensor";
			fetch(url, {
				method: 'GET'
			})
			.then((responseJSON) =>{
				responseJSON.json()
					.then((photosensor) => {

						for(let i=0; i<photosensor.length; i++){
							var found = false;
							for(var j = 0; j < this.photosensorData.length; j++) {
								if (this.photosensorData[j].x == photosensor[i].date) {
									console.log();
									found = true;
									break;
								}
							}
							if(!found){
							this.photosensorData.push({
									x: photosensor[i].date,
									y: photosensor[i].value
								});
							}
						}
					});
			})
			.catch(function (err) {
				console.log(err);
			});
		},

		updateTemperature(){
			let url = "http://" + this.serverIP + ":" + this.port + "/api/temperatures";
			fetch(url, {
				method: 'GET'
			})
			.then((responseJSON) =>{
				responseJSON.json()
					.then((temperatures) => {

						for(let i=0; i<temperatures.length; i++){
							var found = false;
							for(var j = 0; j < this.temperatureData.length; j++) {
								if (this.temperatureData[j].x == temperatures[i].date) {
									console.log();
									found = true;
									break;
								}
							}
							if(!found){
							this.temperatureData.push({
									x: temperatures[i].date,
									y: temperatures[i].value
								});
							}
						}
					});
			})
			.catch(function (err) {
				console.log(err);
			});
		},

		updateESP32Dashboard(){
			this.updatePhoto();
			this.updateTemperature();
			this.esp32LastUpdate = "Last update: " + new Date().toLocaleString();
		},


		updateUCABatiments(){
			let url = "http://" + this.serverIP + ":" + this.port + "/api/uca/listbatiments";
			fetch(url, {
				method: 'GET'
			})
			.then((responseJSON) =>{
				responseJSON.json()
					.then((batiments) => {
						this.batiments.length = 0;
						batiments.forEach(element => {
							this.batiments.push(element);
						});
						this.ucaLastUpdate = "Last update: " + new Date().toLocaleString();
						this.searchFire();
						this.selectBatiment(this.activeBat);
					});
			})
			.catch(function (err) {
				console.log(err);
			});
		},

		selectBatiment(index, indexPath){
			this.activeBat = index;
			//console.log("select bat");
			this.convertedDataChart.clear();
			for(let i =0; i<this.batiments[index].salles.length;i++){
				let salle = this.batiments[index].salles[i];
				let res = [];
					for(let j=0; j<salle.temperatures.length; j++){
				res.push({
					x: salle.temperatures[j].date,
					y: salle.temperatures[j].valeur
				});
			}

				this.convertedDataChart.set(salle.idsalle,res);
			}
		},

	getConvertedData(index){
		return this.convertedDataChart.get(index);
	},
		
		switchRadiator(newValue, idbat, idsalle, newData){
			console.log("Switch radiator " + newValue);
			let path = "uca/led?idbat=" + idbat + "&idsal=" + idsalle;
			//console.log(path);
			//console.log(newData);
			let ledNewData = JSON.stringify({
				sensorid: '1',
				state: newValue
			});

			this.putRequest(path, ledNewData);
		},
		calculEtatCapteur(datetime){
            let dateMillis = new Date(datetime);
            dateMillis.setTime(dateMillis.getTime()+ (60*60*1000));
            if(dateMillis.getTime() < new Date().getTime()){
                return false;
            }
            return true;
		},

		searchFire(){
			for(let i=0; i<this.batiments.length; i++){
				let bat = this.batiments[i];
				for(let j=0; j<bat.salles.length; j++){
					let salle = bat.salles[j];
					//si il est pas defaillant aussi
					if(salle.etatIncendie == "true" && this.calculEtatCapteur(salle.temperatures[salle.temperatures.length-1].date)){
						console.log("Alerte incendie !");
						this.fireNotification(bat.idbatiment, salle.idsalle);
					}
				}
			}
		},



		fireNotification(idbatiment, idsalle){
			this.$notify({
				group: 'foo',
				type: 'error',
				title: 'ALERTE INCENDIE',
				text: 'Un incendie a été détecté en salle ' + idsalle + ' du bâtiment ' + idbatiment + '. Les pompiers ont été contactés en urgence.',
				duration: 30000,
			});
		}
	}
}
</script>

<style>
	body {
		font-family: Helvetica;
		margin: 0;
		background: #e9e9e9;
	}
	.el-header {
		display: flex;
		justify-content: center;
		background: #2e2e2e;
		color: white;
	}
	h2 {
		margin-left: 20px;
	}
	h3 {
		margin: 0;
	}
	.el-aside h3 {
		margin-left: 20px;
		margin-bottom: 20px;
	}
	.cardHeader {
		display: flex;
		justify-content: space-between;
	}
	.el-row {
		display: flex;
		justify-content: center;
		/*flex-wrap: wrap;*/
	}
	#httpContainer .el-card {
		margin: 10px;
	}
	.switchCard, 
	#menu {
		width: 210px;
	}
	.chartCard {
		width: 500px;
	}
	.el-aside,
	.el-table {
		margin-top: 20px;
	}
	.el-alert {
		width: 300px;
		margin: 10px 0 0 10px;
	}
	.el-dropdown {
		margin-bottom: 20px;
	}
</style>
