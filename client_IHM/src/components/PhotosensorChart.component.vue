<template>
    <div>
        <apexchart ref="realtimeChart" type="area" width="450px" height="200px" :options="chartOptions" :series="series"></apexchart>
    </div>
</template>

<script>
import VueApexCharts from 'vue-apexcharts'

export default {
    name: 'PhotosensorChart',
    components: {
        apexchart: VueApexCharts,
    },
    props: [
        "photosensorData"
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
                tooltip: {
                    x: {
                        show: true,
                        format: 'dd/MM HH:mm:ss',
                        formatter: undefined,
                    }
                },
                colors: ['#FEB019'],
                fill: {
                    colors: ['#FEB019'],
                    opacity: 0.9,
                    type: 'gradient',
                    gradient: {
                        type: 'vertical',
                        gradientToColors: ['#FFFFFF'],
                        opacityFrom: 0.5,
                        opacityTo: 0.5,
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
                },
            },
            series: [{
                name: 'Lighting',
                data: this.photosensorData
            }]
        }
    }
}
</script>
