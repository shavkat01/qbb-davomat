<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { Button, Column, DataTable, Dialog, FileUpload, InputNumber, InputText, Select, Toolbar, Image, Textarea } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { useRouter } from "vue-router";
import * as faceapi from 'face-api.js';

const router = useRouter();
const toast = useToast();
const dt = ref();
const staffDialog = ref(false);
const receptDialog = ref(false);
const receptSelectedDialog = ref(false);
const loading = ref(false);
const staff = ref({
    phone_number: '',
    card_id: null,
});
const selectedStaffs = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filter = ref({
    division_id: null,
    staff_id: null,
});
const submitted = ref(false);
const staffs = ref([]);
const selectedProducts = ref();


async function getStaffs() {
    loading.value = true;
    let url = `/persons/get-my-persons`;
    let params = [];

    if (filter.value.division_id) params.push(`division_id=${filter.value.division_id}`);
    if (filter.value.staff_id) params.push(`staff_id=${filter.value.staff_id}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
}

onMounted(async () => {
    try {
        getStaffs();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load models.', life: 3000 });
    }
});


function recepted(staffToDelete) {
    staff.value = staffToDelete;
    receptDialog.value = true;
}

function receptOneStaff() {
    axios.put(`/persons/update-person/${staff.value.id}`, {i_received: !staff.value.i_received}).then(() => {
        getStaffs();
        receptDialog.value = false;
        toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Staff Deleted', life: 3000 });
    }).catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to put staff.', life: 3000 });
    });
}

function receptSelected() {
    receptSelectedDialog.value = true;
}

function receptStaffs() {
    const selectedIds = selectedStaffs.value.map(s => s.id);
    Promise.all(selectedIds.map(id => axios.put(`/persons/update-person/${id}`, {i_received: true})))
        .then(() => {
            getStaffs();
            receptSelectedDialog.value = false;
            selectedStaffs.value = null;
            toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Selected Staffs Deleted', life: 3000 });
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to put selected staff.', life: 3000 });
        });
}

watch(() => filter.value, () => getStaffs(), { deep: true });

watch(() => staff.value.status, () => {
    isShowingFromDateToDate.value = staff.value.status && ![1, 7].includes(staff.value.status);
});



function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/person_photos/${img}`;
}

</script>

<template>
    <div class="menage-staffs">
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Танланганарни қабул қилдим" icon="pi pi-check" severity="secondary" @click="receptSelected"
                        :disabled="!selectedStaffs || !selectedStaffs.length" />
                </template>
                <template #end>
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Qidirish..." />
                    </IconField>
                </template>
            </Toolbar>
            <DataTable ref="dt" v-model:selection="selectedStaffs" :value="staffs" dataKey="id" :paginator="true"
                :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs">
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="division_name" header="Бўлими" sortable></Column>
                <Column field="staff_name" header="Кимга" sortable></Column>
                <Column header="Расм">
                    <template #body="slotProps">
                        <Image :src="getImage(slotProps.data.photo)" alt="Image" width="70" preview />
                    </template>
                </Column>
                <Column field="fullname" header="Ф.И.Ш" sortable></Column>
                <Column field="phone_number" header="Телефон" sortable></Column>
                <Column field="passport_number" header="Пасспoрт" sortable></Column>
                <Column field="birth_date" header="Туғулган куни" sortable></Column>
                <Column field="about" header="Сабаби" sortable></Column>
                <Column header="Aмаллар" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button v-if="!slotProps.data.i_received" icon="pi pi-check" outlined rounded severity="success"
                            @click="recepted(slotProps.data)" />
                        <Button v-else icon="pi pi-replay" outlined rounded severity="warn"
                            @click="recepted(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="receptDialog" :style="{ width: '450px' }" header="Тасдиқлаш" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="!receptDialog.i_received">Сиз бу шаxсни рoстдан ҳам қабул қилдингизми: {{ staff.fullname }}?</span>
                <span v-else>Сиз бу шаxсни ҳали қабул қилмаганмидингиз: {{ staff.fullname }}?</span>
            </div>
            <template #footer>
                <Button label="Йўқ" icon="pi pi-times" text @click="receptDialog = false" />
                <Button label="Ҳа" icon="pi pi-check" @click="receptOneStaff" />
            </template>
        </Dialog>

        <Dialog v-model:visible="receptSelectedDialog" :style="{ width: '450px' }" header="Тасдиқлаш" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Сиз бу шаxсларни рoстдан ҳам қабул қилдингизми?</span>
            </div>
            <template #footer>
                <Button label="Йўқ" icon="pi pi-times" text @click="receptSelectedDialog = false" />
                <Button label="Ҳа" icon="pi pi-check" @click="receptStaffs" />
            </template>
        </Dialog>
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>