<script setup>
import axios from '@/service/axiosIns.js';
import { FilterMatchMode } from '@primevue/core/api';
import { Button, Column, DataTable, Dialog, FileUpload, InputNumber, InputText, Select, Toolbar, Image, Textarea } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { useRouter } from "vue-router";
import * as faceapi from 'face-api.js';
let userData = JSON.parse(localStorage.getItem('userData'));

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
    division_id: null,
    staff_id: null,
});
const image = ref(null);
const submitted = ref(false);
const ranks = ref([]);
const divisions = ref([]);
const our_staffs = ref([]);
const staffs = ref([]);
const selectedProducts = ref();
const isShowingFromDateToDate = ref(false);
const division_id = ref(null);

// Camera-related refs
const showCameraDialog = ref(false);
const videoRef = ref(null);
const canvasRef = ref(null);
const stream = ref(null);
const capturedImage = ref(null);
const isFaceDetected = ref(false);
const isFaceCentered = ref(false);
const permittingPerson = ref();

async function getStaffs() {
    loading.value = true;
    let url = `/persons/get-persons`;
    let params = [];

    if (filter.value.division_id) params.push(`division_id=${filter.value.division_id}`);
    if (filter.value.staff_id) params.push(`staff_id=${filter.value.staff_id}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
}

function addStaff(staffFormData) {
    return axios.post('/persons/add-person', staffFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

function updateStaff(id, staffFormData) {
    return axios.put(`/persons/update-person/${id}`, staffFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

function getDivisions() {
    return axios.get('/references/get-divisions');
}

function getStatus() {
    return axios.get('/staffs/get-staffs');
}

onMounted(async () => {
    try {
        const divisionResponse = await getDivisions();
        divisions.value = divisionResponse.data;
        const rankResponse = await getStatus();
        our_staffs.value = rankResponse.data;

        getStaffs();
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('/models/static'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models/static'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models/static')
        ]);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load models.', life: 3000 });
    }
});

onUnmounted(() => {
    stopCamera();
});

function formatCurrency(value) {
    if (value) return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return '';
}

watch(()=> division_id.value, async ()=>{
    const res = await axios.get('/staffs/get-staffs');
    our_staffs.value = res.data
}, {deep: true} )

function openNew() {
    document.activeElement.blur(); // Prevent autofocus issues
    staff.value = {
        id: null,
        fullname: '',
        rank_id: null,
        staff_id: null,
        phone_number: '',
        card_id: null,
        status: null,
        photo: null,
        state_id: null,
        passport_number: null,
    };
    submitted.value = false;
    staffDialog.value = true;
    // startCamera();
    stopCamera()
}

function hideDialog() {
    staffDialog.value = false;
    submitted.value = false;
    stopCamera();
}

function saveStaff() {
    submitted.value = true;
    if (staff.value.phone_number.replace(/\s/g, '').length !== 13) return;
    if (
        staff.value.fullname?.trim() &&
        staff.value.staff_id &&
        staff.value.passport_number &&
        staff.value.about &&
        (!isShowingFromDateToDate.value || (staff.value.from_date && staff.value.to_date))
    ) {
        const formData = new FormData();
        formData.append('fullname', staff.value.fullname);
        formData.append('staff_id', staff.value.staff_id);
        formData.append('phone_number', staff.value.phone_number.replace(/\s/g, ''));
        if (staff.value.internal_number) formData.append('internal_number', staff.value.internal_number?.trim());
        if (staff.value.birth_date) formData.append('birth_date', formatDate(staff.value.birth_date));
        formData.append('card_id', staff.value.card_id || '');
        formData.append('passport_number', staff.value.passport_number || '');
        formData.append('status', staff.value.status || '');

        if (isShowingFromDateToDate.value) {
            const from_date = formatDate(staff.value.from_date);
            const to_date = formatDate(staff.value.to_date);
            formData.append('from_date', from_date);
            formData.append('to_date', to_date);
        } else {
            formData.append('from_date', '');
            formData.append('to_date', '');
        }

        if (capturedImage.value) {
            formData.append('photo', capturedImage.value);
        } else if (image.value?.files[0]) {
            formData.append('photo', image.value.files[0]);
        } else if (staff.value.photo) {
            formData.append('photo', staff.value.photo);
        } else {
            return;
        }

        if (staff.value.id) {
            updateStaff(staff.value.id, formData).then(() => {
                toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Муваффақиятли', life: 3000 });
                getStaffs();
                staffDialog.value = false;
            }).catch(() => {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update staff.', life: 3000 });
            });
        } else {
            addStaff(formData).then(() => {
                toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Муваффақиятли', life: 3000 });
                getStaffs();
                staffDialog.value = false;
            }).catch(() => {
                toast.add({ severity: 'error', summary: 'Хатолик', detail: 'Хатолик', life: 3000 });
            });
        }
    }
}

async function editStaff(staffToEdit) {
    const data = await axios.get(`/persons/get-person/${staffToEdit.id}`);
    staff.value = { ...data.data, staff_id: parseFloat(data.data.staff_id) };

    staffDialog.value = true;
    // startCamera();
    stopCamera()

}
function givePermission() {
    axios.put(`/persons/update-person/${permittingPerson.value.id}`, {dejurka: userData.id}).then(() => {
        getStaffs();
        permittingPerson.value = false;
        toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Staff put', life: 3000 });
    }).catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to put staff.', life: 3000 });
    });
}

function confirmDeleteStaff(staffToDelete) {
    staff.value = staffToDelete;
    deleteStaffDialog.value = true;
}

function deleteStaff() {
    axios.delete(`/persons/delete-person/${staff.value.id}`).then(() => {
        getStaffs();
        deleteStaffDialog.value = false;
        toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Staff Deleted', life: 3000 });
    }).catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete staff.', life: 3000 });
    });
}

function confirmDeleteSelected() {
    deleteStaffsDialog.value = true;
}

function deleteSelectedStaffs() {
    const selectedIds = selectedStaffs.value.map(s => s.id);
    Promise.all(selectedIds.map(id => axios.delete(`/persons/delete-person/${id}`)))
        .then(() => {
            getStaffs();
            deleteStaffsDialog.value = false;
            selectedStaffs.value = null;
            toast.add({ severity: 'success', summary: 'Муваффақиятли', detail: 'Selected Staffs Deleted', life: 3000 });
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected staff.', life: 3000 });
        });
}

watch(() => filter.value, () => getStaffs(), { deep: true });
watch(() => staff.value.phone_number, () => {
    if (staff.value.phone_number?.trim() === '+998') staff.value.phone_number = null;
});
watch(() => staff.value.status, () => {
    isShowingFromDateToDate.value = staff.value.status && ![1, 7].includes(staff.value.status);
});

function handlePhoneMask(event) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.startsWith('998')) input = input.slice(3);
    let formattedPhoneNumber = '';
    if (input.length <= 2) formattedPhoneNumber = input;
    else if (input.length <= 5) formattedPhoneNumber = input.replace(/(\d{2})(\d{1,3})/, '$1 $2');
    else if (input.length <= 7) formattedPhoneNumber = input.replace(/(\d{2})(\d{3})(\d{1,2})/, '$1 $2 $3');
    else if (input.length <= 9) formattedPhoneNumber = input.replace(/(\d{2})(\d{3})(\d{2})(\d{1,2})/, '$1 $2 $3 $4');
    else event.target.value = '';
    formattedPhoneNumber = `+998 ${formattedPhoneNumber}`;
    staff.value.phone_number = formattedPhoneNumber;
    event.target.value = formattedPhoneNumber;
}

function selectedProduct(params) {
    router.push(`/pages/staff-details/${params.data.id}`);
}

function exportCSV() {
    dt.value.exportCSV();
}

function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/person_photos/${img}`;
}

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isManualInput = ref(false);
const manualInput = ref("");

const toggleInputMode = () => {
    isManualInput.value = !isManualInput.value;
    if (!isManualInput.value && manualInput.value) handleManualInput();
};

const handleManualInput = () => {
    if (!manualInput.value.trim()) return;
    const parsedDate = new Date(manualInput.value);
    if (!isNaN(parsedDate)) {
        staff.value.birth_date = parsedDate;
        isManualInput.value = false;
    } else {
        alert("Invalid date format. Please use yyyy-mm-dd.");
    }
};

const syncManualInput = (date) => {
    manualInput.value = date ? date.toISOString().split("T")[0] : "";
};

// Camera-related functions
async function startCamera() {
    try {
        capturedImage.value = null;
        if (stream.value) stopCamera(); // Ensure previous stream is stopped
        stream.value = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value;
            videoRef.value.onloadedmetadata = () => {
                console.log('Video metadata loaded, starting detection');
                detectFaces();
            };
        }
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to access camera. Please allow permissions and try again.', 
            life: 3000 
        });
    }
}

function stopCamera() {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
        stream.value = null;
    }
    if (videoRef.value) videoRef.value.srcObject = null;
    showCameraDialog.value = false;
    isFaceDetected.value = false;
    isFaceCentered.value = false;
}

async function detectFaces() {
    if (!videoRef.value || !videoRef.value.readyState) return;

    const detections = await faceapi.detectAllFaces(videoRef.value).withFaceLandmarks();
    isFaceDetected.value = detections.length > 0;

    if (isFaceDetected.value) {
        const videoWidth = videoRef.value.videoWidth;
        const videoHeight = videoRef.value.videoHeight;
        const face = detections[0];
        const box = face.detection.box;

        const centerX = videoWidth / 2;
        const centerY = videoHeight / 2;
        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;
        const toleranceX = videoWidth * 0.3;
        const toleranceY = videoHeight * 0.3;

        isFaceCentered.value = Math.abs(faceCenterX - centerX) < toleranceX && Math.abs(faceCenterY - centerY) < toleranceY;
    } else {
        isFaceCentered.value = false;
    }

    setTimeout(() => requestAnimationFrame(detectFaces), 100); // Reduced frequency for performance
}

function captureImage() {
    if (!isFaceDetected.value || !isFaceCentered.value) {
        toast.add({ 
            severity: 'warn', 
            summary: 'Warning', 
            detail: 'Please ensure a face is detected and centered.', 
            life: 3000 
        });
        return;
    }

    const context = canvasRef.value.getContext('2d');
    canvasRef.value.width = videoRef.value.videoWidth;
    canvasRef.value.height = videoRef.value.videoHeight;
    context.drawImage(videoRef.value, 0, 0);
    canvasRef.value.toBlob((blob) => {
        const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
        capturedImage.value = file;
        staff.value.photo = URL.createObjectURL(file);
        console.log('Image captured successfully');
        stopCamera();
    }, 'image/jpeg');
}
</script>

<template>
    <div class="menage-staffs">
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Янги" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Ўчириш" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected"
                        :disabled="!selectedStaffs || !selectedStaffs.length" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>
            <DataTable ref="dt" v-model:selection="selectedProducts" :value="staffs" dataKey="id" :paginator="true"
                :rows="10" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Ходимлар бошқаруви</h4>
                        <div>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-4">
                                    <Select v-model="filter.division_id" :options="divisions" optionLabel="name"
                                        optionValue="id" placeholder="Бўлими" fluid showClear />
                                </div>
                                <div class="col-span-4">
                                    <Select v-model="filter.staff_id" :options="our_staffs" optionLabel="fullname"
                                        optionValue="id" placeholder="Кимга" fluid showClear />
                                </div>
                                <div class="col-span-4">
                                    <IconField>
                                        <InputIcon><i class="pi pi-search" /></InputIcon>
                                        <InputText v-model="filters['global'].value" placeholder="Qidirish..." />
                                    </IconField>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
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
                        <div v-if="userData.role_id == 5">
                            <Button v-show="!slotProps.data.dejurka_name" icon="pi pi-lock-open" outlined rounded severity="warn" class="mr-2"
                            @click="permittingPerson = slotProps.data" />
                        </div>
                        <div v-else>
                            <Button icon="pi pi-pencil" outlined rounded severity="warn" class="mr-2"
                            @click="editStaff(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger"
                            @click="confirmDeleteStaff(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="staffDialog" :header="staff.id ? 'Таҳрирлаш' : 'Қўшиш'" :style="{ width: '750px' }"
            :modal="true" @hide="stopCamera">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="division_id" class="block font-bold mb-3">Бўлим</label>
                    <Select v-model="division_id" :options="divisions" optionLabel="name" optionValue="id"
                        placeholder="Танланг" required fluid />
                </div>
                <div class="col-span-6">
                    <label for="staff_id" class="block font-bold mb-3">Кимга</label>
                    <Select v-model="staff.staff_id" :options="our_staffs" optionLabel="fullname" optionValue="id"
                        placeholder="Танланг" required fluid />
                    <small v-if="submitted && !staff.staff_id" class="text-red-500">Майдон мажбурий</small>
                </div>
                <div class="col-span-6">
                    <label for="fullname" class="block font-bold mb-3">Ф.И.Ш</label>
                    <InputText id="fullname" v-model="staff.fullname" required autofocus
                        :invalid="submitted && !staff.fullname" fluid placeholder="Киритинг" />
                    <small v-if="submitted && !staff.fullname" class="text-red-500">Майдон мажбурий</small>
                </div>
                <div class="col-span-6">
                    <label for="phone" class="block font-bold mb-3">Телефон</label>
                    <InputText id="phone" v-model="staff.phone_number" @input="handlePhoneMask"
                        placeholder="+998 (xxx) xxx-xx-xx" fluid />
                    <small v-if="submitted && staff.phone_number && staff.phone_number.replace(/\s/g, '').length !== 13"
                        class="text-red-500">Формат +998 99 999 99 99.</small>
                </div>
                <div class="col-span-6">
                    <label for="birth_date" class="block font-bold mb-3">Туғулган куни</label>
                    <div class="relative">
                        <input v-if="isManualInput" type="date" v-model="manualInput" placeholder="yyyy-mm-dd"
                            class="p-inputtext p-component w-[90%]" @blur="handleManualInput"
                            @keydown.enter="handleManualInput" :invalid="submitted && !staff.birth_date"/>
                        <DatePicker v-else :showIcon="true" :showButtonBar="true" v-model="staff.birth_date"
                            @change="syncManualInput" fluid class="w-[90%]" placeholder="Танланг" :invalid="submitted && !staff.birth_date"/>
                        <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-link"
                            @click="toggleInputMode">
                            <i :class="isManualInput ? 'pi pi-calendar' : 'pi pi-pencil'"></i>
                        </button>
                    </div>
                    <small v-if="submitted && !staff.birth_date" class="text-red-500">Майдон мажбурий</small>
                </div>
                <div class="col-span-6">
                    <label for="passport_number" class="block font-bold mb-3">Пасспoрт</label>
                    <InputText v-model="staff.passport_number" id="passport_number" fluid placeholder="Киритинг" :invalid="submitted && !staff.passport_number"/>
                    <small v-if="submitted && !staff.passport_number" class="text-red-500">Майдон мажбурий</small>
                </div>
                <div class="col-span-12">
                    <label for="about" class="block font-bold mb-3">Сабаби</label>
                    <Textarea v-model="staff.about" id="about" fluid placeholder="Киритинг" :invalid="submitted && !staff.about"/>
                    <small v-if="submitted && !staff.about" class="text-red-500">Майдон мажбурий</small>
                </div>
                <div  :style="!stream && !capturedImage ? 'display: none' : 'display: block'" class="col-span-12">
                    <div class="flex justify-center">
                        <div  style="display: inline-flex;">
                            <video ref="videoRef" v-if="!capturedImage" autoplay style="width: 100%; max-height: 300px;" :style="isFaceDetected && isFaceCentered ? 'border: 3px solid green' : 'border: 3px solid red'"></video>
                        </div>
                    </div>
                    <canvas ref="canvasRef" :style="!capturedImage ? 'display: none' : 'display: block'" style="margin: 0 auto; max-height: 300px;"></canvas>
                    <div class="flex items-center justify-between gap-4" v-if="!capturedImage">
                        <Button label="Расимга oлиш" icon="pi pi-camera" class="mt-3" :disabled="!isFaceDetected || !isFaceCentered" @click="captureImage" />
                        <div class="mt-3">
                            <span v-if="!isFaceDetected" class="text-red-500">Юз аниқланмади</span>
                            <span v-else-if="!isFaceCentered" class="text-yellow-500">Илтимoс юзингизни камерага кўрсатинг</span>
                            <span v-else class="text-green-500">Юз аниқланди, расмга oлса бўлади</span>
                        </div>
                        <div class="mt-3">
                            (Илтимoс! Тезрoқ расмга oлинг!)
                        </div>
                    </div>
                    <Button v-else label="Qaytadan rasmga olish" icon="pi pi-replay" class="mt-3" @click="startCamera" />
                </div>
                <div v-if="!stream && !capturedImage" class="col-span-12">
                    <Button label="Камерани ёқиш" icon="pi pi-play" class="mt-3" style="width: 200px" @click="startCamera" />
                </div>
                <div class="col-span-12">
                    <label for="photo" class="block font-bold mb-3">Расм</label>
                    <FileUpload name="demo[]" ref="image" @upload="onAdvancedUpload($event)" :multiple="false" accept="image/*">
                        <template #header="{ chooseCallback, clearCallback, files }">
                            <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                                <div class="flex gap-2">
                                    <Button @click="chooseCallback()" icon="pi pi-images" style="width: 30px; height: 30px" rounded outlined></Button>
                                    <Button @click="clearCallback()" icon="pi pi-times" rounded outlined style="width: 30px; height: 30px" severity="danger" :disabled="!files || files.length === 0"></Button>
                                </div>
                            </div>
                        </template>
                        <template #empty>
                            <div class="flex align-center justify-center flex-column">
                                <Image v-if="staff.photo" :src="getImage(staff.photo) || staff.photo" alt="Image" width="200" preview />
                            </div>
                        </template>
                    </FileUpload>
                    <small v-if="submitted && (!image?.files?.length && !staff.photo && !capturedImage)" class="text-red-500">Майдон мажбурий</small>
                </div>
            </div>
            <template #footer>
                <Button label="Бекор қилиш" severity="danger" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Сақлаш" icon="pi pi-check" @click="saveStaff" />
            </template>
        </Dialog>

        <Dialog v-model:visible="permittingPerson" :style="{ width: '450px' }" header="Тасдиқлаш" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Сиз бу шаxсга рoстдан ҳам руxсат бермoқчимисиз: {{ staff.fullname }}?</span>
            </div>
            <template #footer>
                <Button label="Йўқ" icon="pi pi-times" text @click="permittingPerson = false" />
                <Button label="Ҳа" icon="pi pi-check" @click="givePermission" />
            </template>
        </Dialog>
        <Dialog v-model:visible="deleteStaffDialog" :style="{ width: '450px' }" header="Тасдиқлаш" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Бу маълумотни ўчириб ташлашни ростдан ҳам хоҳлайсизми: {{ staff.fullname }}?</span>
            </div>
            <template #footer>
                <Button label="Йўқ" icon="pi pi-times" text @click="deleteStaffDialog = false" />
                <Button label="Ҳа" icon="pi pi-check" @click="deleteStaff" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteStaffsDialog" :style="{ width: '450px' }" header="Тасдиқлаш" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Бу маълумотни ўчириб ташлашни ростдан ҳам хоҳлайсизми?</span>
            </div>
            <template #footer>
                <Button label="Йўқ" icon="pi pi-times" text @click="deleteStaffsDialog = false" />
                <Button label="Ҳа" icon="pi pi-check" @click="deleteSelectedStaffs" />
            </template>
        </Dialog>
    </div>
</template>

<style>
.menage-staffs .p-datatable-tbody tr {
    cursor: pointer;
}
</style>