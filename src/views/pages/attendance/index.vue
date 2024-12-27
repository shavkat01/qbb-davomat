<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { Button, Column, DataTable, Dialog, FileUpload, InputNumber, InputText, Select, Toolbar } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from "vue-router";






const router = useRouter();
const toast = useToast();
const dt = ref();
const staffDialog = ref(false);
const deleteStaffDialog = ref(false);
const deleteStaffsDialog = ref(false);
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
    status_id: null,
    division_id: null,
});

const image = ref(null);
const submitted = ref(false);
const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const staffs = ref([]);
const selectedProducts = ref();

const isShowingFromDateToDate = ref(false);


async function getStaffs() {
    loading.value = true;
    let url = `/staffs/get-staffs`;
    let params = [];

    if (filter.value.division_id) {
        params.push(`division_id=${filter.value.division_id}`);
    }
    if (filter.value.status_id) {
        params.push(`status_id=${filter.value.status_id}`);
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
}

// Add a new staff
function addStaff(staffFormData) {
    return axios.post('/staffs/add-staff', staffFormData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

// Update an existing staff
function updateStaff(id, staffFormData) {
    return axios.put(`/staffs/update-staff/${id}`, staffFormData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
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

// Utility to format phone numbers or currency
function formatCurrency(value) {
    if (value) return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return '';
}

function openNew() {
    staff.value = {
        id: null,
        fullname: '',
        rank_id: null,
        division_id: null,
        phone_number: '',
        card_id: null,
        status: null,
        photo: null,
        state_id: null,
        face_id: null,
    };
    submitted.value = false;
    staffDialog.value = true;
}

function hideDialog() {
    staffDialog.value = false;
    submitted.value = false;
}

function saveStaff() {
    submitted.value = true;

    // Check if required fields are filled
    if (staff.value.phone_number && staff.value.phone_number.replace(/\s/g, '').length !== 13) return
    if (staff.value.internal_number && staff.value.internal_number.trim().length !== 4) return
    if (
        staff.value.fullname?.trim() &&
        staff.value.rank_id &&
        staff.value.division_id &&
        staff.value.status &&
        (!isShowingFromDateToDate.value || (staff.value.from_date && staff.value.to_date))
    ) {
        // Create a FormData object to send the data with a photo
        const formData = new FormData();

        // Append staff fields to formData
        formData.append('fullname', staff.value.fullname);
        formData.append('rank_id', staff.value.rank_id);
        formData.append('division_id', staff.value.division_id);
        formData.append('phone_number', staff.value.phone_number.replace(/\s/g, ''));
        if (staff.value.internal_number) formData.append('internal_number', staff.value.internal_number?.trim());
        if (staff.value.birth_date) formData.append('birth_date', formatDate(staff.value.birth_date));
        formData.append('card_id', staff.value.card_id || '');
        formData.append('face_id', staff.value.face_id || '');
        formData.append('status', staff.value.status || '');

        if (isShowingFromDateToDate.value) {
            const from_date = formatDate(staff.value.from_date)
            const to_date = formatDate(staff.value.to_date)
            formData.append('from_date', from_date);
            formData.append('to_date', to_date);
        }

        if (image.value.files[0]) formData.append('photo', image.value.files[0]);

        if (staff.value.id) {
            // Update the staff with the FormData
            if (staff.value.state_id) {
                formData.append('state_id', staff.value.state_id);
            }
            updateStaff(staff.value.id, formData).then(() => {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Staff Updated', life: 3000 });
                getStaffs();
                staffDialog.value = false;
            }).catch(() => {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update staff.', life: 3000 });
            });
        } else {
            // Add new staff with the FormData
            addStaff(formData).then((response) => {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Staff Created', life: 3000 });
                getStaffs();
                staffDialog.value = false;

            }).catch(() => {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add staff.', life: 3000 });
            });
        }
    }
}


async function editStaff(staffToEdit) {
    const data = await axios.get(`/staffs/get-staff/${staffToEdit.id}`);

    staff.value = {
        id: data.data.id,
        fullname: data.data.fullname,
        rank_id: parseFloat(data.data.rank_id),
        division_id: parseFloat(data.data.division_id),
        phone_number: data.data.phone_number, // Remove non-numeric characters
        card_id: data.data.card_id,
        status: parseFloat(data.data.status),
        birth_date: data.data.birth_date,
        internal_number: data.data.internal_number,
        from_date: data.data.from_date,
        to_date: data.data.to_date,
        face_id: data.data.face_id,
        state_id: data.data.state_id,
        photo: data.data.photo // Convert Blob to URL for preview
    };
    staffDialog.value = true;
}

function confirmDeleteStaff(staffToDelete) {
    staff.value = staffToDelete;
    deleteStaffDialog.value = true;
}

function deleteStaff() {
    axios.delete(`/staffs/delete-staff/${staff.value.id}`).then(() => {
        getStaffs();

        deleteStaffDialog.value = false;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Staff Deleted', life: 3000 });
    }).catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete staff.', life: 3000 });
    });
}

function confirmDeleteSelected() {
    deleteStaffsDialog.value = true;
}

function deleteSelectedStaffs() {
    const selectedIds = selectedStaffs.value.map(s => s.id);
    selectedIds.forEach(id => {
        axios.delete(`/staffs/delete-staff/${id}`).then(() => {
            getStaffs();
            deleteStaffsDialog.value = false;
            selectedStaffs.value = null;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Selected Staffs Deleted', life: 3000 });
        }).catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected staff.', life: 3000 });
        });
    });
}


watch(() => filter.value, () => {
    getStaffs()
}, { deep: true })
watch(() => staff.value.phone_number, () => {
    if (staff.value.phone_number && staff.value.phone_number.trim() == '+998') {
        staff.value.phone_number = null
    }
})
watch(() => staff.value.status, () => {
    if (!staff.value.status || staff.value.status == 1 || staff.value.status == 7) {
        isShowingFromDateToDate.value = false;
    } else {
        isShowingFromDateToDate.value = true;
    }
})

function handlePhoneMask(event) {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Apply the +998 prefix only once
    if (input.startsWith('998')) {
        input = input.slice(3); // Remove any extra 998 prefix
    }

    let formattedPhoneNumber = '';

    // Format phone number correctly
    if (input.length <= 2) {
        formattedPhoneNumber = input; // First 2 digits of phone number after +998
    } else if (input.length <= 5) {
        formattedPhoneNumber = input.replace(/(\d{2})(\d{1,3})/, '$1 $2'); // Second part
    } else if (input.length <= 7) {
        formattedPhoneNumber = input.replace(/(\d{2})(\d{3})(\d{1,2})/, '$1 $2 $3'); // Third part
    } else if (input.length <= 9) {
        formattedPhoneNumber = input.replace(/(\d{2})(\d{3})(\d{2})(\d{1,2})/, '$1 $2 $3 $4'); // Fourth part
    } else {
        event.target.value = ''
    }

    // Apply the +998 prefix
    formattedPhoneNumber = `+998 ${formattedPhoneNumber}`;

    // Set the formatted phone number in the model
    staff.value.phone_number = formattedPhoneNumber;

    // Set the value of the input field directly
    event.target.value = formattedPhoneNumber;
}

function selectedProduct(params) {
    console.log(params);
    router.push(`/pages/staff-details/${params.data.id}`);

}
function exportCSV() {
    dt.value.exportCSV();
}

function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};


const isManualInput = ref(false); // Toggle between manual input and date picker
const manualInput = ref(""); // Manual input string

// Toggle between modes
const toggleInputMode = () => {
    isManualInput.value = !isManualInput.value;
    if (!isManualInput.value && manualInput.value) {
    handleManualInput();
    }
};

// Handle manual date input
const handleManualInput = () => {
    if (!manualInput.value.trim()) return;

    const parsedDate = new Date(manualInput.value);
    if (!isNaN(parsedDate)) {
    staff.value.birth_date = parsedDate;
    isManualInput.value = false; // Switch back to the picker if input is valid
    } else {
    alert("Invalid date format. Please use yyyy-mm-dd.");
    }
};

// Sync manual input when a date is selected
const syncManualInput = (date) => {
    manualInput.value = date ? date.toISOString().split("T")[0] : "";
};

</script>

<template>
    <div class="menage-staffs">
        <div class="card">
            <DataTable ref="dt" v-model:selection="selectedProducts" :value="staffs" dataKey="id"
                :paginator="true" :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Ходимлар давомати</h4>
                        <div>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-4">
                                    <Select v-model="filter.division_id" :options="divisions" optionLabel="name"
                                        optionValue="id" placeholder="Bo'limi" fluid showClear />
                                </div>
                                <div class="col-span-4">
                                    <Select v-model="filter.status_id" :options="statusList" optionLabel="name"
                                        optionValue="id" placeholder="Holati" fluid showClear />
                                </div>
                                <div class="col-span-4">
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

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column header="Расм">
                    <template #body="slotProps">
                        <Image :src="getImage(slotProps.data.photo)" alt="Image" width="70" preview />
                    </template>
                </Column>
                <Column field="fullname" header="Ф.И.О" sortable>
                    <template #body="slotProps">
                        <a @click="selectedProduct(slotProps)" class="text-blue-500">
                            {{ slotProps.data.fullname }}
                        </a>
                    </template></Column>
                <Column field="phone_number" header="Телефон" sortable></Column>
                <Column field="status" header="Ҳолат" sortable></Column>
                <Column field="rank_name" header="Унвон" sortable></Column>
                <Column field="division_name" header="Бўлим" sortable></Column>
                
                <ColumnGroup type="footer">
                    <Row>
                        <Column footer="Totals:" :colspan="3" footerStyle="text-align:right"/>
                        <Column :footer="lastYearTotal" />
                        <Column :footer="thisYearTotal" />
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
