<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, inject, onMounted, ref, watch, reactive, onUnmounted } from 'vue';
import { useRouter } from "vue-router";
import { useSocket} from "@/service/useSocket.js";

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
    type: 1,
});

const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const staffs = ref([]);
const selectedProducts = ref();


async function getStaffs() {
    loading.value = true;
    let url = `/events/get-attendance-images`;
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
    if (filter.value.to_date) {
        let to_date = formatDate(filter.value.to_date)
        params.push(`to_date=${to_date}`);
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

useSocket('get_attendance', (m) => {
    if(filter.value.type != 1) return
    let founderIndex = staffs.value.findIndex(item => item.staff_id == m.staffs[0].staff_id)
    if (founderIndex == -1) {
        staffs.value.unshift(m.staffs[0])
    } else {
        staffs.value.splice(founderIndex, 1)
        staffs.value.unshift(m.staffs[0])
    }
});


useSocket('get_weapons', (m) => {
    console.log('Connected to get_weapons channel', m)
    if(filter.value.type != 2) return
    let founderIndex = staffs.value.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex == -1) {
        staffs.value.unshift(m[0])
    } else {
        staffs.value.splice(founderIndex, 1)
        staffs.value.unshift(m[0])
    }
})

const themeColors = reactive({
  darkMode: {
    1: '!bg-[#004d004C] text-white',
    2: '!bg-[#8053004C] text-white',
    3: '!bg-[#7d000024] text-white',
  },
  lightMode: {
    1: '!bg-[#007D004C] text-dark',
    2: '!bg-[#FFA5004C] text-dark',
    3: '!bg-[#7D00004C] text-dark',
  },
});


const enterStaff = computed(() => 
    staffs.value?.filter(item => item.is_here == true)?.[0]
);

const getOutStaff = computed(() => 
    staffs.value?.filter(item => item.is_here == false)?.[0]
);
const getweapon = computed(() => 
    staffs.value?.filter(item => item.weapon_status == false)?.[0]
);

const putWeapon = computed(() => 
    staffs.value?.filter(item => item.weapon_status == true)?.[0]
);



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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};


function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}















</script>

<template>
    <div class="menage-staffs grid grid-cols-12 gap-3">
        <div class="col-span-6">
            <div class="card">
                <Tabs value="0" class="w-full">
                    <TabList>
                        <Tab @click="filter.type = 1" value="0">Кирди-чиқди</Tab>
                        <Tab @click="filter.type = 2" value="1">Қурол олди-олмади</Tab>
                    </TabList>
                    <TabPanels class="!p-0">
                        <TabPanel value="0" class="flex gap-3 w-full pt-3">
                            <div v-if="enterStaff" class="w-1/2">
                                <div class="text-center mb-3">
                                    <div class="mt-0 font-semibold text-3xl">Кириш</div>
                                </div>
                                <div class="border border-surface-200 dark:border-surface-700 rounded py-4">
                                    <div class="mb-4 w-full flex justify-center">
                                        <div class="text-center">
                                            <img :src="getImage(enterStaff.photo)" alt=""
                                                class="w-48 rounded object-cover" style="height: 200px;" />
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            {{ enterStaff?.division_name }}
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div class="mt-0 font-semibold text-xl">{{ enterStaff?.fullname }}</div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            <i class="pi pi-sign-in mr-4"></i>
                                            {{ enterStaff?.last_time }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="getOutStaff" class="w-1/2">
                                <div class="text-center mb-3">
                                    <div class="mt-0 font-semibold text-3xl">Чиқиш</div>
                                </div>
                                <div class="border border-surface-200 dark:border-surface-700 rounded py-4">
                                    <div class="mb-4 w-full flex justify-center">
                                        <div class="text-center">
                                            <img :src="getImage(getOutStaff.photo)" alt=""
                                                class="w-48 rounded object-cover" style="height: 200px;" />
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            {{ getOutStaff?.division_name }}
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div class="mt-0 font-semibold text-xl">{{ getOutStaff?.fullname }}</div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            <i class="pi pi-sign-out rotate-180 mr-4"></i>
                                            {{ getOutStaff?.last_time }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel value="1" class="flex gap-3 w-full pt-3">
                            <div v-if="getweapon" class="w-1/2">
                                <div class="text-center mb-3">
                                    <div class="mt-0 font-semibold text-3xl">Қурол олди</div>
                                </div>
                                <div class="border border-surface-200 dark:border-surface-700 rounded py-4">
                                    <div class="mb-4 w-full flex justify-center">
                                        <div class="text-center">
                                            <img :src="getImage(getweapon.photo)" alt=""
                                                class="w-48 rounded object-cover" style="height: 200px;" />
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            {{ getweapon?.division_name }}
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div class="mt-0 font-semibold text-xl">{{ getweapon?.fullname }}</div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            <i class="pi pi-check mr-4"></i>
                                            {{ getweapon?.weapon_time }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="putWeapon" class="w-1/2">
                                <div class="text-center mb-3">
                                    <div class="mt-0 font-semibold text-3xl">Қурол топширди</div>
                                </div>
                                <div class="border border-surface-200 dark:border-surface-700 rounded py-4">
                                    <div class="mb-4 w-full flex justify-center">
                                        <div class="text-center">
                                            <img :src="getImage(putWeapon.photo)" alt=""
                                                class="w-48 rounded object-cover" style="height: 200px;" />
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            {{ putWeapon?.division_name }}
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div class="mt-0 font-semibold text-xl">{{ putWeapon?.fullname }}</div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            <i class="pi pi-times rotate-180 mr-4"></i>
                                            {{ putWeapon?.weapon_time }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>


                    </TabPanels>
                </Tabs>

            </div>
            <div class="card">

            </div>
        </div>
        <div class="card col-span-6">
            <DataTable ref="dt" v-model:selection="selectedProducts" :rowClass="rowClass" :value="staffs" dataKey="id"
                :paginator="true" :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 8, 10, 15, 25, 50, 100]"
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
                        </div>
                    </div>
                </template>
                <Column field="is_here" header="Амал" sortable>
                    <template #body="slotProps">
                        <div v-if="filter.type == 1">
                            <div v-tooltip.top="{ value: `Ишхонага кирган вақти`, showDelay: 200, hideDelay: 300 }"
                                v-if="slotProps.data.is_here" class="flex items-center">
                                <div
                                    class="px-4 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    <i class="pi pi-sign-in mr-4"></i>
                                    Кирди
                                </div>
                            </div>
                            <div v-tooltip.top="{ value: `Ишхонадан чиқган вақти`, showDelay: 200, hideDelay: 300 }"
                                v-else-if="slotProps.data.is_here == false" class="flex items-center">
                                <div
                                    class="h-9 px-4 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    <i class="pi pi-sign-out mr-4 rotate-180"></i>
                                    Чиқди
                                </div>
                            </div>
                        </div>
                        <div v-if="filter.type == 2">
                            <div v-tooltip.top="{ value: `Ишхонага кирган вақти`, showDelay: 200, hideDelay: 300 }"
                                v-if="slotProps.data.weapon_status == false" class="flex items-center">
                                <div
                                    class="px-4 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    <i class="pi pi-check mr-4"></i>
                                    Олди
                                </div>
                            </div>
                            <div v-tooltip.top="{ value: `Ишхонадан чиқган вақти`, showDelay: 200, hideDelay: 300 }"
                                v-else-if="slotProps.data.weapon_status == true" class="flex items-center">
                                <div
                                    class="h-9 px-4 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                    <i class="pi pi-times mr-4 rotate-180"></i>
                                    Топширди
                                </div>
                            </div>
                        </div>

                    </template>
                </Column>
                <Column header="Вақти" sortable>
                    <template #body="slotProps">
                        <div v-if="filter.type == 1 && slotProps.data.last_time" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-surface-200 dark:bg-surface-800 text-black dark:text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-clock mr-4"></i>
                                {{ slotProps.data.last_time }}
                            </div>
                        </div>
                        <div v-if="filter.type == 2 && slotProps.data.weapon_time" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-surface-200 dark:bg-surface-800 text-black dark:text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-clock mr-4"></i>
                                {{ slotProps.data.weapon_time }}
                            </div>
                        </div>
                    </template>
                </Column>
                <Column field="division_name" header="Бўлим" sortable></Column>
                <Column field="fullname" header="Ф.И.О" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.fullname }}
                    </template>
                </Column>


            </DataTable>
        </div>
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>
