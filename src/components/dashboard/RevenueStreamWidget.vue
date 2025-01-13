<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch, inject, computed, onUnmounted } from 'vue';
import axios from '@/service/axiosIns.js';
import { useBasicStore } from '@/store/basic';
import { useSocket} from "@/service/useSocket.js";

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const store = useBasicStore();
const socket = inject('socket');

const chartData = ref(null);
const chartOptions = ref(null);
const divisions = ref(null);
const staffs = ref({ staffs: [] });
const isDarkMode = computed(() => document.documentElement.classList.contains('app-dark'));

// Define background colors dynamically
function getBackgroundColor(type) {
    if (isDarkMode.value) {
        if (type === 1) return 'rgba(0, 77, 0, 0.7)'; // Dark green
        if (type === 2) return 'rgba(128, 83, 0, 0.7)'; // Dark orange
        if (type === 3) return 'rgba(125, 0, 0, 0.7)'; // Dark red
    } else {
        if (type === 1) return 'rgba(0, 125, 0, 0.7)'; // Bright green
        if (type === 2) return 'rgba(255, 165, 0, 0.7)'; // Bright orange
        if (type === 3) return 'rgba(125, 0, 0, 0.7)'; // Dark red
    }
    return 'rgba(0, 0, 0, 0.7)'; // Default color
}

function setChartData() {
    if (!divisions.value) return;

    return {
        labels: divisions.value.map((item) => item.name),
        datasets: [
            {
                type: 'bar',
                label: 'Келмади',
                backgroundColor: divisions.value.map(() => getBackgroundColor(3)),
                data: divisions.value.map((element) => {
                    return staffs.value.staffs.filter(
                        (item) => item.type === 3 && element.id === item.division_id
                    ).length;
                }),
                barThickness: 32,
            },
            {
                type: 'bar',
                label: 'Кеч қолди',
                backgroundColor: divisions.value.map(() => getBackgroundColor(2)),
                data: divisions.value.map((element) => {
                    return staffs.value.staffs.filter(
                        (item) => item.type === 2 && element.id === item.division_id
                    ).length;
                }),
                barThickness: 32,
            },
            {
                type: 'bar',
                label: 'Вақтида келди',
                backgroundColor: divisions.value.map(() => getBackgroundColor(1)),
                data: divisions.value.map((element) => {
                    return staffs.value.staffs.filter(
                        (item) => item.type === 1 && element.id === item.division_id
                    ).length;
                }),
                borderRadius: {
                    topLeft: 8,
                    topRight: 8,
                },
                borderSkipped: true,
                barThickness: 32,
            },
        ],
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color');
    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    color: textMutedColor,
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor,
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor,
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            },
        },
    };
}

// Fetch divisions
async function getDivisions() {
    return axios.get('/references/get-divisions');
}

// Fetch staffs
async function getStaffs() {
    const staffResponse = await axios.get(`/events/get-attendance`);
    staffs.value = staffResponse.data;
}

// Update chart data and options dynamically when theme or layout changes
watch([isDarkMode, getPrimary, getSurface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

// Socket listener for attendance data
useSocket('get_attendance', (m) => {
    const foundIndex = staffs.value.staffs.findIndex((item) => item.staff_id === m.staffs[0].staff_id);

    if (foundIndex === -1) {
        staffs.value.staffs.unshift(m.staffs[0]);
    } else {
        staffs.value.staffs[foundIndex] = m.staffs[0];
    }
    chartData.value = setChartData();
});

// Initialize data on component mount
onMounted(async () => {
    const divisionResponse = await getDivisions();
    divisions.value = divisionResponse.data;
    await getStaffs();
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Бугунги кунлилк давомат</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-64"/>
    </div>
</template>
