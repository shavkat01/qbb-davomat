<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from "vue-router";

import { useSocket } from "@/service/useSocket.js";



const socket = inject('socket');

const router = useRouter();
const toast = useToast();
const dt = ref();
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});


const filter = ref({
    division_id: null,
    type: null,
});

const changeStatus = ref();
const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const staffs = ref([]);
const selectedProducts = ref();
const typeList = ref([
    { id: 1, name: 'Вақтида келганлар' },
    { id: 2, name: 'Кеч қолганлар' },
    { id: 3, name: 'Келмади' },
    { id: 4, name: 'Бинода' },
    { id: 5, name: 'Бинода эмас' },
]);


async function getStaffs() {
    loading.value = true;
    let url = `/events/get-attendance`;
    let params = [];

    if (filter.value.division_id) {
        params.push(`division_id=${filter.value.division_id}`);
    }
    if (filter.value.status_id) {
        params.push(`status_id=${filter.value.status_id}`);
    }
    if (filter.value.type) {
        params.push(`type=${filter.value.type}`);
    }
    if (filter.value.from_date) {
        let from_date = formatDate(filter.value.from_date)
        params.push(`from_date=${from_date}`);
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
}



// Get the list of ranks
function getRanks() {
    return axios.get('/references/get-ranks');
}
// Get the list of divisions
function getDivisions() {
    return axios.get('/references/get-divisions');
}

function getStatus() {
    return axios.get('/references/get-status');
}


// Load ranks and divisions from the respective endpoints
onMounted(async () => {
    try {
        const rankResponse = await getRanks();
        ranks.value = rankResponse.data;

        const divisionResponse = await getDivisions();
        divisions.value = divisionResponse.data;

        const statusResponse = await getStatus();
        statusList.value = statusResponse.data;

        getStaffs();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data.', life: 3000 });
    }
});

watch(() => filter.value, () => {
    getStaffs()
}, { deep: true })

useSocket('get_weapons', (m) => {
    console.log('Connected to get_weapons channel', m)
    let founderIndex = staffs.value.staffs.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex !== -1) {
        staffs.value.staffs[founderIndex].weapon_status = m[0].weapon_status
    }
})
useSocket('get_attendance', (m) => {
    console.log('Connected to get_attendance channel', m)
    staffs.value.all_staffs = m.all_staffs
    staffs.value.on_time_staff = m.on_time_staff
    staffs.value.late_staff = m.late_staff
    staffs.value.absent_staff = m.absent_staff
    staffs.value.binoda_staff = m.binoda_staff
    staffs.value.binoda_emas_staff = m.binoda_emas_staff

    let founderIndex = staffs.value.staffs.findIndex(item => item.staff_id == m.staffs[0].staff_id)
    if (filter.value.division_id && filter.value.division_id != m.staffs[0].division_id) return
    if (filter.value.status_id && filter.value.status_id != m.staffs[0].status_id) return

    if (filter.value.type == '1' && m.staffs[0].type == '1') {
        if (founderIndex == -1) {
            staffs.value.staffs.unshift(m.staffs[0])
        } else {
            staffs.value.staffs[founderIndex] = m.staffs[0]
        }
    }
    else if (filter.value.type == '2' && m.staffs[0].type == '2') {
        if (founderIndex == -1) {
            staffs.value.staffs.unshift(m.staffs[0])
        } else {
            staffs.value.staffs[founderIndex] = m.staffs[0]
        }
    }
    else if (filter.value.type == '3' && (m.staffs[0].type == '1' || m.staffs[0].type == '2')) {
        if (founderIndex) {
            staffs.value.staffs.splice(founderIndex, 1)
        }
    }
    else if (m.staffs[0].type == '1' || m.staffs[0].type == '2') {
        if (founderIndex) {
            staffs.value.staffs[founderIndex] = m.staffs[0]
        }
    }
})

const withWeapon = computed(() => {
    if (staffs.value?.staffs) {
        return staffs.value?.staffs?.filter(item => item.weapon_status == false).length || 0;
    }
});


// const themeColors = reactive({
//     darkMode: {
//         1: '!bg-[#004d004C] text-white',
//         2: '!bg-[#8053004C] text-white',
//         3: '!bg-[#7d000024] text-white',
//     },
//     lightMode: {
//         1: '!bg-[#007D004C] text-dark',
//         2: '!bg-[#FFA5004C] text-dark',
//         3: '!bg-[#7D00004C] text-dark',
//     },
// });
const themeColors = reactive({
    darkMode: {
        1: '!bg-green-700 text-white',
        2: '!bg-orange-700 text-white',
        3: '!bg-red-700 text-white',
    },
    lightMode: {
        1: '!bg-[#007D004C] text-dark',
        2: '!bg-[#FFA5004C] text-dark',
        3: '!bg-[#7D00004C] text-dark',
    },
});


const isDarkMode = computed(() => document.documentElement.classList.contains('app-dark'));



const rowClass = (data) => {
    const mode = isDarkMode.value ? 'darkMode' : 'lightMode';
    const typeClass = themeColors[mode][data.type];
    return typeClass || ''; // Fallback to empty string if type doesn't match
};

function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};


function clearFilter(img) {
    filter.value = {
        division_id: null,
        type: null,
        from_date: null,
    };
    filters.value.global.value = null
}
const visibleRight = ref(false)

function editStaff(params) {
    visibleRight.value = params
}

function saveChangeStatus(params) {
    if (visibleRight.value.face_id) {
        if (!changeStatus.value) toast.add({ severity: 'error', summary: 'Holat o\'zgartirilmadi', detail: 'Сиз ҳолатни танламадингиз!', life: 3000 });

        axios.put(`/events/update-face-event/`, { face_id: visibleRight.value.face_id, type: changeStatus.value });
        getStaffs()
        toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Муваффақиятли', life: 3000 });
    }
}

function enterToHistory(params) {
    router.push(`/attendance/history/${params.data.staff_id}`)
}

function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}

</script>

<template>
    <div class="menage-staffs">
        <div class="card">
            <DataTable ref="dt" v-model:selection="selectedProducts" :rowClass="rowClass" :value="staffs.staffs"
                dataKey="id" :paginator="true" :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 8, 10, 15, 25, 50, 100]" v-on:row-click="enterToHistory"
                currentPageReportTemplate="{first} - {last}. {totalRecords} дан">
                <template #header>
                    <div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-2">
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="filters['global'].value" placeholder="Қидириш..." />
                                </IconField>
                            </div>
                            <div class="col-span-2">
                                <Select v-model="filter.division_id" :options="divisions" optionLabel="name"
                                    optionValue="id" placeholder="Йўналиши" fluid showClear />
                            </div>
                            <div class="col-span-2">
                                <Select v-model="filter.type" :options="typeList" optionLabel="name" optionValue="id"
                                    placeholder="Ҳолати" fluid showClear />
                            </div>
                            <div class="col-span-2">
                                <DatePicker :showIcon="true" :showButtonBar="true" v-model="filter.from_date" fluid
                                    placeholder="Сана">
                                </DatePicker>
                            </div>
                            <div class="col-span-2">
                                <Button label="Aслига қайтариш" icon="pi pi-filter-slash"
                                    :disabled="filters['global'].value || filter.division_id || filter.type || filter?.from_date ? false : true"
                                    @click="clearFilter" />
                            </div>
                        </div>
                    </div>
                </template>

                <Column header="Расм">
                    <template #body="slotProps">
                        <Image :src="getImage(slotProps.data.photo)" alt="Image" width="25" preview />
                    </template>
                </Column>
                <Column field="fullname" header="Ф.И.Ш" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.fullname }}
                    </template>
                </Column>
                <Column field="phone_number" header="Телефон" sortable></Column>
                <Column field="rank_name" header="Унвон" sortable></Column>
                <Column field="state" header="Ҳозирда" sortable></Column>
                <Column field="first_time" header="Ишга келган вақти" sortable>
                    <template #body="slotProps">
                        <div v-if="slotProps.data.first_time" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-surface-200 dark:bg-surface-800 text-black dark:text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-clock mr-4"></i>
                                {{ slotProps.data.first_time }}
                            </div>
                        </div>
                        <div v-else-if="!slotProps.data.first_time" class="flex items-center">
                            <div class="">
                                -
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="is_here" header="Сўнги амал вақти" sortable>
                    <template #body="slotProps">
                        <div v-tooltip.top="{ value: `Ишхонага кирган вақти`, showDelay: 200, hideDelay: 300 }"
                            v-if="slotProps.data.is_here == true" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-sign-in"></i>
                                <div v-if="slotProps.data?.last_time" class="ml-4">
                                    {{ slotProps.data?.last_time }}
                                </div>
                            </div>
                        </div>
                        <div v-tooltip.top="{ value: `Ишхонадан чиқган вақти`, showDelay: 200, hideDelay: 300 }"
                            v-else-if="slotProps.data.is_here == false" class="flex items-center">
                            <div
                                class="h-9 px-4 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-sign-out rotate-180 mr-4"></i>
                                {{ slotProps.data?.last_time }}
                            </div>
                        </div>
                        <div v-tooltip.top="{ value: `Ишхонага келмаган`, showDelay: 200, hideDelay: 300 }"
                            v-else-if="slotProps.data.is_here == null"
                            class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-900 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                            <i class="pi pi-home"></i>
                        </div>
                    </template>
                </Column>
                <Column field="type" header="Қуролланган" sortable>
                    <template #body="slotProps">
                        <div class="flex items-center justify-center w-28 mx-10">
                            <div v-tooltip.top="{ value: `Қуролланган`, showDelay: 200, hideDelay: 300 }"
                                v-if="slotProps.data.weapon_status == false"
                                class="px-4 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer"
                                :class="{ 'h-16': slotProps.data.weapon_time }">
                                <i class="pi pi-check"
                                    :class="{ 'mr-4 bg-green-700 dark:bg-green-600 p-2 rounded-lg': slotProps.data.weapon_time }"></i>
                                <div v-if="slotProps.data.weapon_time" class="flex gap-2">
                                    <div>
                                        <i class="pi pi-calendar mr-1"></i>
                                        {{ slotProps.data.weapon_time.split(' ')[0].slice(0, 5) }}
                                    </div>
                                    <div>
                                        <i class="pi pi-clock mr-1"></i>
                                        {{ slotProps.data.weapon_time.split(' ')[1].slice(0, 5) }}
                                    </div>
                                </div>
                            </div>
                            <div v-tooltip.top="{ value: `Қуролланмаган`, showDelay: 200, hideDelay: 300 }" v-else
                                class="px-4 h-9 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer"
                                :class="{ 'h-16': slotProps.data.weapon_time }">
                                <i class="pi pi-times"
                                    :class="{ 'mr-4 bg-red-700 dark:bg-red-600 p-2 rounded-lg': slotProps.data.weapon_time }"></i>
                                <div v-if="slotProps.data.weapon_time" class="flex gap-2">
                                    <div>
                                        <i class="pi pi-calendar mr-1"></i>
                                        {{ slotProps.data.weapon_time.split(' ')[0].slice(0, 5) }}
                                    </div>
                                    <div>
                                        <i class="pi pi-clock mr-1"></i>
                                        {{ slotProps.data.weapon_time.split(' ')[1].slice(0, 5) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Column>
                <Column header="Aмаллар">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" v-if="slotProps.data.role_id == 1 || slotProps.data.role_id == 2" rounded severity="warn"
                            class="mx-2" @click="editStaff(slotProps.data)" />
                    </template>
                </Column>
                <ColumnGroup type="footer">
                    <Row>
                        <Column colspan="1">
                            <template #footer="slotProps">
                                <div class="inline-flex items-center gap-3 p-4 border border-surface rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Рўйхат бўйича:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-blue-500 dark:bg-blue-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.all_staffs }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column colspan="4">
                            <template #footer="slotProps">
                                <div class="inline-flex items-center gap-3 p-4 border border-surface rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Вақтида келганлар:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.on_time_staff?.count }}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Кеч қолганлар:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.late_staff?.count }}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Келмади:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.absent_staff?.count }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column colspan="2">
                            <template #footer="slotProps">
                                <div class="inline-flex items-center gap-3 p-4 border border-surface rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Бинода:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.binoda_staff?.count }}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Бинода эмас:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ staffs?.binoda_emas_staff?.count }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>
                        <Column colspan="2">
                            <template #footer="slotProps">
                                <div class="inline-flex items-center gap-3 p-4 border border-surface rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <h3>
                                            Қуролланган:
                                        </h3>
                                        <div
                                            class="w-12 h-9 flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                            {{ withWeapon }}
                                        </div>
                                    </div>

                                </div>
                            </template>
                        </Column>
                    </Row>
                </ColumnGroup>
            </DataTable>
        </div>
        <Drawer v-model:visible="visibleRight" header="Ҳолат ўзгартириш" position="right">
            <Select v-model="changeStatus"
                :options="visibleRight.first_time || visibleRight.type == 1 || visibleRight.type == 2 ? [{ id: 4, name: 'Binoda' }, { id: 5, name: 'Binoda emas' }] : [{ id: 1, name: 'Keldi' }, { id: 2, name: 'Kech qoldi' }, { id: 5, name: 'Binoda emas' }]"
                optionLabel="name" optionValue="id" placeholder="Танланг" required fluid />
            <div class="flex justify-around mt-10">
                <Button severity="danger" icon="pi pi-times" @click="visibleRight = false" />
                <Button severity="success" icon="pi pi-check" @click="saveChangeStatus" />
            </div>
        </Drawer>
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>
