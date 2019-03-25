<template>
    <div>
        <apexchart ref="realtimeChart" type="area" width="450px" height="200px" :options="chartOptions" :series="series"></apexchart>
    </div>
</template>

<script>
import VueApexCharts from 'vue-apexcharts'

export default {
    name: 'TemperatureChart',
    components: {
        apexchart: VueApexCharts,
    },
    props: [
        "temperatureData"
    ],
    data: function() {
        return {
            chartOptions: {
                chart: {
                    toolbar: {
                        show: true,
                        tools: {
                            zoomin: false,
                            download: false
                        }
                    }
                },
                xaxis: {
                    type: "datetime",
                    labels: {
                        show: true,
                        format: 'dd/MM HH:mm:ss'
                    },
                    tooltip: {
                        enabled: false
                    },
                },
                yaxis: {
                    min: 0,
                    max: 40
                },
                tooltip: {
                    x: {
                        show: true,
                        format: 'dd/MM HH:mm:ss',
                        formatter: undefined,
                    }
                },
                colors: ['#F86624'],
                fill: {
                    opacity: 0.9,
                    type: 'gradient',
                    gradient: {
                        type: 'vertical',
                        gradientToColors: ['#81D4FA'],
                        opacityFrom: 0.6,
                        opacityTo: 0.6,
                        stops: [60, 100],
                    },
                },
                grid: {
                    show: true,
                    position: 'back',
                    yaxis: {
                        lines: {
                            show: false
                        }
                    }
                }
            },
            series: [{
                name: 'Temperature',
                data: this.temperatureData
            }]
        }
    }
}
</script>
