<script setup>
import axios from '@/service/axiosIns.js';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { inject, onMounted, onUnmounted, ref, watch, computed } from "vue";

const confirm = useConfirm();
const toast = useToast();
const socket = inject('socket');

const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const attendance = ref([]);
const staffsAttandance = ref([]);
const staffs = ref([]);
const statusName = ref('Рўйхат бўйича');
const currentTrevoga = ref();
const trevogaDivisions = ref([]);
const loading = ref(false);
const filter = ref({
    division: {
        division_id: 0,
        division_name: 'Барча',
    },
    attendance: '1',
});


const elapsedTime = ref('');
const trevogaStatus = ref('not_given');
// Function to calculate the time difference and update the display
function updateElapsedTime() {
    if (!currentTrevoga.value?.begin_time) return;

    const now = new Date();
    const start = new Date(currentTrevoga.value.begin_time);
    const diffInSeconds = Math.floor((now - start) / 1000);

    // If the start time is in the future, set elapsed time to "00:00:00"
    if (diffInSeconds < 0) {
        elapsedTime.value = '00:00:00';
        trevogaStatus.value = 'given'; // Keep the status as 'given'
        return;
    }

    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    elapsedTime.value = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    trevogaStatus.value = diffInSeconds < 3600 ? 'given' : 'moreThanOneHour';
}


// Set up an interval to update the elapsed time every second
let intervalId;


async function getAttandance() {
    // loading.value = true;
    let url = `/staffs/get-dashboard`;
    const attendanceResponse = await axios.get(url);
    attendance.value = attendanceResponse.data;
    // loading.value = false;
}

async function getStaffs() {
    try {
        loading.value = true;
        let url = `/events/get-trevoga-staffs`;
        let params = [];
        if (filter.value.division.division_id) {
            params.push(`division_id=${filter.value.division.division_id}`);
        }
        if (filter.value.attendance) {
            params.push(`type=${filter.value.attendance}`);
        }
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        const staffResponse = await axios.get(url);
        staffsAttandance.value = staffResponse.data;
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
}

function getDivisions() {
    return axios.get('/references/get-divisions');
}
async function getCurrentTrevoga() {
    const res = await axios.get('/events/get-current-trevoga');
    currentTrevoga.value = res.data;
    updateElapsedTime(); // Initial calculation
    intervalId = setInterval(updateElapsedTime, 1000);
    getStaffs();
}
async function getTrevogaDivisions() {
    const res = await axios.get('/events/get-trevoga-divisions');
    trevogaDivisions.value = res.data;
}

socket.on('get_weapons', (m) => {
    console.log('get_weaponsssss', m)
    let founderIndex1 = staffsAttandance.value.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex1 !== -1) {
        staffsAttandance.value[founderIndex1].weapon_status = m[0].weapon_status
    }
    
    let founderIndex2 = staffs.value.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex2 !== -1) {
        trevogaDivisions.value.forEach(item => {
            if(item.division_id == staffs.value[founderIndex2].division_id){
                if(m[0].weapon_status == false){
                    item.weapon_total = typeof item.weapon_total == 'string' ? parseFloat(item.weapon_total.split('.')[0]) + 1 : item.weapon_total + 1
                }else if(m[0].weapon_status == true){
                    item.weapon_total = typeof item.weapon_total == 'string' ? item.weapon_total.split('.')[0] == 0 ? 0 : parseFloat(item.weapon_total.split('.')[0]) - 1 : item.weapon_total == 0 ? 0 : item.weapon_total - 1
                }
            }
        })
    }
})

socket.on('current_trevoga', async (m) => {
    if(m.status){
        getCurrentTrevoga()
        getTrevogaDivisions()
        elapsedTime.value = '';
        trevogaStatus.value = 'not_given';
    }else{
        getCurrentTrevoga()
    }
})
socket.on('trevoga_divisions', (m) => {
    console.log('Connected to trevoga_divisions channel', m)
    trevogaDivisions.value = m
})
socket.on('trevoga_staffs', (m) => {
    console.log('Connected to trevoga_staffs channel', m)
    let founderIndex = staffsAttandance.value.findIndex(item => item.staff_id == m[0].staff_id)
    if(filter.value.attendance == '1' && m[0].type == '1'){
        if(founderIndex == -1){
            staffsAttandance.value.unshift(m[0])
        }else{
            staffsAttandance.value[founderIndex] = m[0]
        }
    }else if(filter.value.attendance == '2' && m[0].type == '2'){
        if(founderIndex == -1){
            staffsAttandance.value.unshift(m[0])
        }else{
            staffsAttandance.value[founderIndex] = m[0]
        }
    }else if(filter.value.attendance == '3' && (m[0].type == '1' || m[0].type == '2')){
        if(founderIndex){
            staffsAttandance.value.splice(founderIndex, 1)
        }
    }else if(m[0].type == '1' || m[0].type == '2'){
        if(founderIndex){
            staffsAttandance.value[founderIndex] = m[0]
        }
    }
})

onMounted(async () => {
    try {
        getCurrentTrevoga()
        getTrevogaDivisions()
        getAttandance();
        const divisionResponse = await getDivisions();
        divisions.value = divisionResponse.data;
        const res = await axios.get('/events/get-trevoga-staffs')
        staffs.value = res.data;

    } catch (error) {
    }
});

onUnmounted(() => {
    clearInterval(intervalId);
});

const isDarkMode = computed(() => {
    return document.documentElement.classList.contains('app-dark');
});

const rowClass = (data) => {
    if (isDarkMode.value) {
        return [{
            '!bg-[#004d004C] !text-white': data.type == 1,
            '!bg-[#8053004C] !text-white': data.type == 2,
            '!bg-[#7d000024] !text-white': data.type == 3,
        }];
    } else {
        return [{
            '!bg-[#007D004C] !text-dark': data.type == 1,
            '!bg-[#FFA5004C] !text-dark': data.type == 2,
            '!bg-[#7D00004C] !text-dark': data.type == 3,
        }];
    }
};

function createTrevoga(event) {
    try {
        confirm.require({
            target: event.currentTarget,
            message: 'Siz rostdan ham trevoga xabarini yubormoqchimisiz',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: "Yo'q",
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Ha'
            },
            accept: async () => {
                await axios.post('/events/add-trevoga', { status: false })
                getCurrentTrevoga()
                toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
            },
            reject: () => {
                // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
            }
        });
    } catch (error) {

    }
}

function reset(event) {
    try {
        confirm.require({
            target: event.currentTarget,
            message: 'Siz rostdan ham trevoga xabarini qayta sozlamoqchimisiz?',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: "Yo'q",
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Ha'
            },
            accept: async () => {
                await axios.post('/events/add-trevoga', { status: true, trevoga_id: currentTrevoga.value.id })
                getCurrentTrevoga()
                elapsedTime.value = '';
                trevogaStatus.value = 'not_given';
                toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
            },
            reject: () => {
                // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
            }
        });
    } catch (error) {

    }
}


watch(() => filter.value, () => {
    getStaffs()
}, { deep: true })

function selectDivision(params) {
    filter.value.division = params
}


function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}

</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 xl:col-span-12">
            <div class="card">
                <div class="flex flex-wrap justify-between items-center gap-2">
                    <Button @click="createTrevoga($event)" :disabled="trevogaStatus !== 'not_given'" severity="danger"
                        label="Submit">Тревога бериш</Button>
                    <div v-if="trevogaStatus !== 'not_given'" class="flex items-center gap-10">
                        <h3 class="">
                            <span class="text-xl">Тревога берилган вақт:</span>
                            <span class="text-xl text-gray-400 ml-3">{{ currentTrevoga?.begin_time?.split(' ')[1]}}</span>
                        </h3>
                        <div>
                            <li class="flex items-center px-5 py-2 rounded-xl border border-surface">
                                <div class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full mr-4 shrink-0"
                                    :class="{ 'bg-orange-100 dark:bg-orange-400/10': trevogaStatus == 'moreThanOneHour' }">
                                    <i class="pi pi-stopwatch !text-xl text-green-500"
                                        :class="{ 'text-orange-500': trevogaStatus == 'moreThanOneHour' }"></i>
                                </div>
                                <div class="w-28 text-center">
                                    <span :class="{ 'text-orange-500': trevogaStatus == 'moreThanOneHour' }"
                                        class="text-green-500 font-bold text-2xl">
                                        {{ elapsedTime }}
                                    </span>
                                </div>
                            </li>
                        </div>
                    </div>
                    <Button v-if="trevogaStatus !== 'not_given'" @click="reset($event)" severity="orange"
                        label="Disabled">Қайта созлаш</Button>
                    <!-- :disabled="trevogaStatus !== 'moreThanOneHour'" -->
                </div>
            </div>
        </div>
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <ul class="list-none p-0 m-0 grid grid-cols-12 gap-2">
                    <li v-for="item in trevogaDivisions" @click="selectDivision(item)" :key="item"
                        :class="{ 'bg-surface-100 dark:bg-surface-800': filter.division.division_id == item.division_id }"
                        style="margin-bottom: 0"
                        class="xl:col-span-6 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-surface-100 dark:hover:bg-surface-800 mb-6 px-5 py-4 rounded-xl border border-surface cursor-pointer">
                        <div class="w-full">
                            <div class="flex justify-between w-full">
                                <div class="text-xl text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">
                                    {{ item.division_name }}</div>
                                <div class="mt-2 md:mt-0 flex items-center">
                                    <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24"
                                        style="height: 8px">
                                        <div class="bg-blue-500 h-full"
                                            :style="`width: ${item.on_time_percentage.split('.')[0]}%`"></div>
                                    </div>
                                    <span class="text-blue-500 ml-4 font-medium">%{{
                                        item.on_time_percentage.split('.')[0] }}</span>
                                </div>
                            </div>
                            <div class="mt-2 flex flex-wrap justify-around">
                                <div v-tooltip.top="{ value: `Рўйхат бўйича`, showDelay: 200, hideDelay: 300 }"
                                    class="w-12 h-9 flex items-center justify-center bg-blue-500 dark:bg-blue-800 text-white rounded-lg shrink-0 cursor-pointer">
                                    {{ item.staff_total }}
                                </div>
                                <div class="gap-2 text-muted-color flex flex-wrap">
                                    <div v-tooltip.top="{ value: `Вақтида келганлар`, showDelay: 200, hideDelay: 300 }"
                                        class="w-12 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                                        {{ item.on_time_staff }}
                                    </div>
                                    <div v-tooltip.top="{ value: `Кеч қолганлар`, showDelay: 200, hideDelay: 300 }"
                                        class="w-12 h-9 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg shrink-0 cursor-pointer">
                                        {{ item.late_staff }}

                                    </div>
                                    <div v-tooltip.top="{ value: `Келмади`, showDelay: 200, hideDelay: 300 }"
                                        class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg shrink-0 cursor-pointer">
                                        {{ item.absent_staff }}
                                    </div>
                                </div>
                                <div v-tooltip.top="{ value: `Қуролланган`, showDelay: 200, hideDelay: 300 }"
                                    class="w-12 h-9 flex items-center justify-center bg-gray-500 dark:bg-gray-700 text-white rounded-lg shrink-0 cursor-pointer">
                                    {{ typeof item.weapon_total == "string" ? item.weapon_total.split('.')[0] : item.weapon_total }}
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="flex items-center">
                    <div class="font-semibold text-xl">
                        {{ filter.division.division_name }}:
                    </div>
                    <div class="mt-1 text-muted-color flex">
                        <div class="card flex flex-wrap justify-center gap-2">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filter.attendance" inputId="ingredient1" name="pizza" value="0" />
                                <label for="ingredient1"
                                    class="py-1 px-4 flex items-center justify-center bg-blue-500 dark:bg-blue-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    Жами </label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filter.attendance" inputId="ingredient2" name="pizza" value="1" />
                                <label for="ingredient2"
                                    class="py-1 px-4 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    Вақтида келганлар </label>

                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filter.attendance" inputId="ingredient3" name="pizza" value="2" />
                                <label for="ingredient3"
                                    class="py-1 px-4 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    Кеч қолганлар </label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="filter.attendance" inputId="ingredient4" name="pizza" value="3" />
                                <label for="ingredient4"
                                    class="py-1 px-4 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    Келмади </label>
                            </div>
                        </div>
                    </div>
                </div>
                <DataTable ref="dt" :rowClass="rowClass" :value="staffsAttandance" dataKey="id" :paginator="true" :rows="8"
                    :loading="loading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5,8, 10, 15, 25, 50, 100]"
                    currentPageReportTemplate="{first} - {last}. {totalRecords} дан">

                    <template #empty>
                        <div class="text-center">
                            Маълумот топилмади
                        </div>
                    </template>
                    <Column header="Расм">
                        <template #body="slotProps">
                            <Image :src="getImage(slotProps.data.photo)" alt="Image" style="height: 30px;" preview />
                        </template>
                    </Column>
                    <Column field="fullname" header="Ф.И.О" sortable style="min-width: 4rem"></Column>
                    <Column field="phone_number" header="Телефон" sortable style="min-width: 4rem"></Column>
                    <Column field="rank_name" header="Унвон" sortable style="min-width: 4rem"></Column>
                    <Column field="type" header="Қуролланган" sortable>
                        <template #body="slotProps">
                            <div v-if="slotProps.data.weapon_status == false"
                                class="w-12 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-check"></i>
                            </div>
                            <div v-else
                                class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-times"></i>
                            </div>
                        </template>
                    </Column>
                    <!-- <Column field="division_name" header="Bo'lim" sortable style="min-width: 4rem"></Column> -->
                </DataTable>
            </div>
        </div>
    </div>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
</template>
