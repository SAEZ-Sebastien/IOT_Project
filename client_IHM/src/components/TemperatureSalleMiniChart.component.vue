<template>
    <div>
        <apexchart type="area" width="350px" height="150px" :options="chartOptions" :series="series"></apexchart>
    </div>
</template>

<script>
import VueApexCharts from 'vue-apexcharts'

export default {
    name: 'TemperatureSalleMiniChart',
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
                    /*type: 'line',
                    sparkline: {
                        enabled: true
                    },*/
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
                        show: false,
                        //format: 'dd/MM HH:mm:ss'
                    },
                    tooltip: {
                        enabled: false
                    },
                    axisBorder: {
                        show: false
                    },
                    axisTicks: {
                        show: false
                    },
                    range : 60 * 60000,
                },
                yaxis: {
                    show: false,
                    min: 0,
                    max: 35
                },
                tooltip: {
                    x: {
                        show: true,
                        format: 'dd/MM HH:mm:ss',
                        formatter: undefined,
                    }
                },
                /*tooltip: {
                    fixed: {
                        enabled: false
                    },
                    x: {
                        show: false
                    },
                    y: {
                        title: {
                            formatter: function (seriesName) {
                                return ''
                            }
                        }
                    },
                    marker: {
                        show: false
                    },
                },*/
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
            }],
            /*chartOptions: {
                chart: {
                    type: 'area',
                    sparkline: {
                    enabled: true
                    },
                },
                stroke: {
                    curve: 'straight'
                },
                fill: {
                    opacity: 0.3
                },
                xaxis: {
                    crosshairs: {
                    width: 1
                    },
                },
                yaxis: {
                    min: 0
                },
            }*/
        }
    }
}
</script>
