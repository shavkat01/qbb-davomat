<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import axios from '@/service/axiosIns.js';
import { useRoute } from "vue-router";
const route = useRoute();
const toast = useToast();
const dt = ref();

const selectedStaffs = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const staffs = ref([]);
const selectedProducts = ref();

const routeId = route.fullPath.split('/').pop();
async function getStaffs(id) {
    const staffResponse = await axios.get(`/staffs/get-state-list/${id}`);
    staffs.value = staffResponse.data;
}

// Load ranks and divisions from the respective endpoints
onMounted(async () => {
    try {
        getStaffs(routeId);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data.', life: 3000 });
    }
});
function exportCSV() {
    dt.value.exportCSV();
}

function selectedProduct(params) {
    console.log(params);
    
}

function getImage(img){
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>
            <DataTable
                ref="dt"
                v-model:selection="selectedProducts"
                :value="staffs"
                dataKey="id"
                @row-click="selectedProduct"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Xodimning davomat tarixi</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Qidirish..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="fullname" header="F.I.O" sortable style="min-width: 12rem"></Column>
                <Column field="status" header="Holat" sortable style="min-width: 12rem"></Column>
                <Column field="from_date" header="Dan" sortable style="min-width: 12rem"></Column>
                <Column field="to_date" header="Gacha" sortable style="min-width: 12rem"></Column>
            </DataTable>
        </div>

    </div>
</template>

<style>

</style>
