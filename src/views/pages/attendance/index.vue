<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch, computed, inject } from 'vue';
import { useRouter } from "vue-router";

const socket = inject('socket');

const router = useRouter();
const toast = useToast();
const dt = ref();
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});


const filter = ref({
    status_id: null,
    division_id: null,
    type: null,
});

const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const staffs = ref([]);
const selectedProducts = ref();
const typeList = ref([
    {id: 1, name: 'Вақтида келганлар'},
    {id: 2, name: 'Кеч қолганлар'},
    {id: 3, name: 'Келмади'},
    {id: 4, name: 'Бинода'},
    {id: 5, name: 'Бинода эмас'},
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


socket.on('get_weapons', (m) => {
    console.log('Connected to get_weapons channel', m)
    let founderIndex = staffs.value.staffs.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex !== -1) {
        staffs.value.staffs[founderIndex].weapon_status = m[0].weapon_status
    }
})
socket.on('get_attendance', (m) => {
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
    if(staffs.value?.staffs){
        return staffs.value?.staffs?.filter(item => item.weapon_status == false).length || 0;
    }
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
                :rowsPerPageOptions="[5,8, 10, 15, 25, 50, 100]"
                currentPageReportTemplate="{first} - {last}. {totalRecords} дан">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Ходимлар давомати</h4>
                        <div>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-3">
                                    <Select v-model="filter.division_id" :options="divisions" optionLabel="name"
                                        optionValue="id" placeholder="Bo'limi" fluid showClear />
                                </div>
                                <!-- <div class="col-span-3">
                                    <Select v-model="filter.status_id" :options="statusList" optionLabel="name"
                                        optionValue="id" placeholder="Holati" fluid showClear />
                                </div> -->
                                <div class="col-span-3">
                                    <Select v-model="filter.type" :options="typeList" optionLabel="name"
                                        optionValue="id" placeholder="Holati" fluid showClear />
                                </div>
                                <div class="col-span-3">
                                    <IconField>
                                        <InputIcon>
                                            <i class="pi pi-search" />
                                        </InputIcon>
                                        <InputText v-model="filters['global'].value" placeholder="Qidirish..." />
                                    </IconField>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <Column header="Расм">
                    <template #body="slotProps">
                        <Image :src="getImage(slotProps.data.photo)" alt="Image" width="25" preview />
                    </template>
                </Column>
                <Column field="fullname" header="Ф.И.О" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.fullname }}
                    </template>
                </Column>
                <Column field="phone_number" header="Телефон" sortable></Column>
                <Column field="rank_name" header="Унвон" sortable></Column>
                <Column field="is_here" header="Қаерда" sortable>
                    <template #body="slotProps">
                        <div v-if="slotProps.data.is_here"
                            class="w-12 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                            <i class="pi pi-sign-in"></i>
                        </div>
                        <div v-else-if="slotProps.data.is_here == false"
                            class="w-12 h-9 flex items-center justify-center bg-yellow-500 dark:bg-yellow-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                            <i class="pi pi-sign-out"></i>
                        </div>
                        <div v-else-if="slotProps.data.is_here == null"
                            class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-900 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                            <i class="pi pi-home"></i>
                        </div>
                    </template>
                </Column>
                <Column field="type" header="Қуролланган" sortable>
                    <template #body="slotProps">
                        <div class="flex items-center justify-center w-28">
                            <div v-if="slotProps.data.weapon_status == false"
                                class="w-12 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-check"></i>
                            </div>
                            <div v-else
                                class="w-12 h-9 flex items-center justify-center bg-red-500 dark:bg-red-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-times"></i>
                            </div>
                        </div>
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
                        <Column colspan="2">
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
                        <Column colspan="1">
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
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>
