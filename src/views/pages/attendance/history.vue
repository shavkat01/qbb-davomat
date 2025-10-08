<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, inject, onMounted, ref, watch, reactive } from 'vue';
import { useRoute } from "vue-router";


const socket = inject('socket');

const route = useRoute();
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

let staff_id = route.fullPath.split('/').pop();
const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const staffs = ref([]);
const staff = ref();
const selectedProducts = ref();



async function getStaffs() {
    loading.value = true;
    let url = `/events/get-attendance-by-staff`;
    let params = [];
    params.push(`staff_id=${staff_id}`);

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



// Load ranks and divisions from the respective endpoints
onMounted(async () => {
    try {
        const staffResponse = await axios.get(`/staffs/get-staff/${staff_id}`);;
        staff.value = staffResponse.data;


        getStaffs();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data.', life: 3000 });
    }
});

watch(() => filter.value, () => {
    getStaffs()
}, { deep: true })



function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}

</script>

<template>
    <div class="menage-staffs">
       <div class="flex gap-3 w-full pt-3">
            <div v-if="staff" class="w-1/2 card m-0">
                <div class="border border-surface-200 dark:border-surface-700 rounded py-4">
                    <div class="mb-4 w-full flex justify-center">
                        <div class="text-center">
                            <img :src="getImage(staff.photo)" alt="" class="w-96 rounded object-cover" style="height: 400px;"/>
                        </div>
                    </div>
                    <div class="text-center mt-3">
                            <div class="px-4 h-9 inline-flex items-center justify-center bg-gray-500 dark:bg-gray-800 text-white rounded-lg shrink-0 cursor-pointer">
                            {{ staff?.division_name }}
                        </div>
                    </div>
                    <div class="text-center mt-3">
                        <div class="mt-0 font-semibold text-xl">{{ staff?.fullname }}</div>
                    </div>
                    <div class="text-center mt-3">
                            <div
                            class="px-4 h-9 inline-flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                            {{ staff?.rank_name}}
                        </div>
                    </div>
                    <div class="text-center mt-3">
                        <div class="mt-0 font-semibold text-xl">{{ staff?.phone_number }}</div>
                    </div>
                </div>
            </div>
            <div class="card w-1/2">
                <DataTable ref="dt" v-model:selection="selectedProducts" :rowClass="rowClass" :value="staffs"
                dataKey="id" :paginator="true" :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 8, 10, 15, 25, 50, 100]"
                currentPageReportTemplate="{first} - {last}. {totalRecords} дан">
                <template #header>
                    <div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-4">
                                <DatePicker :showIcon="true" :showButtonBar="true" v-model="filter.from_date" fluid
                                :placeholder="$t('date')">
                                </DatePicker>
                            </div>
                            <div class="col-span-2">
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="filters['global'].value" :placeholder="$t('search')" />
                                </IconField>
                            </div>
                        </div>
                    </div>
                </template>
                <Column field="is_here" ::header="$t('actions')" sortable>
                    <template #body="slotProps">
                        <div v-tooltip.top="{ value: $t('entry_time'), showDelay: 200, hideDelay: 300 }"
                            v-if="slotProps.data.camera_id == 1" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-sign-in mr-4"></i>
                                {{ $t('entered') }}
                            </div>
                        </div>
                        <div v-tooltip.top="{ value: $t('exit_time'), showDelay: 200, hideDelay: 300 }"
                            v-else-if="slotProps.data.camera_id == 2" class="flex items-center">
                            <div
                                class="h-9 px-4 flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-sign-out mr-4 rotate-180"></i>
                                {{ $t('exited') }}
                            </div>
                        </div>
                    
                    </template>
                </Column>
                <Column :header="$t('time')" sortable>
                    <template #body="slotProps">
                        <div v-if="slotProps.data.date" class="flex items-center">
                            <div
                                class="px-4 h-9 flex items-center justify-center bg-surface-200 dark:bg-surface-800 text-black dark:text-white rounded-lg mr-4 shrink-0 cursor-pointer">
                                <i class="pi pi-clock mr-4"></i>
                                {{ slotProps.data.date }}
                            </div>
                        </div>
                    </template>
                </Column>
    
            </DataTable>
            </div>
        </div>
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>
