<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch, inject } from 'vue';
import axios from '@/service/axiosIns.js';
import {useBasicStore} from '@/store/basic'

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const store = useBasicStore()
const socket = inject('socket');

const chartData = ref(null);
const chartOptions = ref(null);
const divisions = ref(null);
const staffs = ref({staffs : []});

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);
    if(!divisions.value) return
    console.log(divisions.value.map(element => {
                    return staffs.value.staffs.filter(item => {
                        if(item.type == 1 && element.id == item.division_id){
                           return item
                        }
                    }).length}));
    return {
        labels: divisions.value.map(item => item.name),
        datasets: [
            {
                type: 'bar',
                label: 'Келмади',
                backgroundColor: documentStyle.getPropertyValue('--p-red-500'),
                data: divisions.value.map(element => {
                    return staffs.value.staffs.filter(item => {
                        if(item.type == 3 && element.id == item.division_id){
                           return item
                        }
                    }).length
                }),
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Кеч қолди',
                backgroundColor: documentStyle.getPropertyValue('--p-yellow-500'),
                data: divisions.value.map(element => {
                    return staffs.value.staffs.filter(item => {
                        if(item.type == 1 && element.id == item.division_id){
                           return item
                        }
                    }).length
                }),
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Вақтида келди',
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                data: divisions.value.map(element => {
                    return staffs.value.staffs.filter(item => {
                        if(item.type == 1 && element.id == item.division_id){
                           return item
                        }
                    }).length
                }),
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true,
                barThickness: 32
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}
function getDivisions() {
    return axios.get('/references/get-divisions');
}
watch([getPrimary, getSurface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

socket.on('get_attendance', (m) => {
    let founderIndex = staffs.value.staffs.findIndex(item => item.staff_id == m.staffs[0].staff_id)

    if (founderIndex == -1) {
        staffs.value.staffs.unshift(m.staffs[0])
    } else {
        staffs.value.staffs[founderIndex] = m.staffs[0]
    }
    setChartData();
})








async function getStaffs() {
    let url = `/events/get-attendance`;
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
}
onMounted(async () => {
    const divisionResponse = await getDivisions();
    divisions.value = divisionResponse.data;
    await getStaffs()
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Revenue Stream</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-60" />
    </div>
</template>
