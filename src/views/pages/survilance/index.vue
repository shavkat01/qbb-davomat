<script setup>
import axios from '@/service/axiosIns.js';
import { useSocket } from "@/service/useSocket.js";
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
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

    if (filter.value.type) {
        params.push(`type=${filter.value.type}`);
    }

    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
    getCameraStatusAndOpen(filter.value.type)

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
let jsDecoder;


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
        nextTick(() => {
        
        loadScripts()
            .then(async () => {
                //外部回调
                jsDecoder = new JSPlugin({
                    szId: 'playWind',
                    iType: 2,
                    iWidth: 1240,
                    iHeight: 600,
                    iMaxSplit: 2,
                    iCurrentSplit: 2,
                    szBasePath: '/src',
                    oStyle: {
                        border: '#343434',
                        borderSelect: 'transparent',
                        background: "#000 url('/src/assets/online.svg') no-repeat center center;"
                    }
                });

                $('.mute').click(function (e) {
                    var iRet = jsDecoder.JS_OpenSound(iWind);
                    if (iRet == 0) {
                        console.log('Ушбу камерада овоз бор, уни ёқишни тасдиқлайсизми?');
                        $('.mute').hide();
                        $('.unmute').show();
                    } else {
                        alert('Ушбу камерада овоз йўқ');
                        return;
                    }
                });
                $('.unmute').click(function (e) {
                    $('.mute').show();
                    $('.unmute').hide();
                    CloseSound();
                });
                getCameraStatusAndOpen(filter.value.type)


            }).catch(async () => {
                //外部回调
                
            });
        })
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data.', life: 3000 });
    }
});


watch(() => filter.value, () => {
    infoBodyCameraDialog.value.value = null;
    getStaffs()
}, { deep: true })

useSocket('get_attendance', (m) => {
    if (filter.value.type != 1) return
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
    if (filter.value.type != 2) return
    let founderIndex = staffs.value.findIndex(item => item.staff_id == m[0].staff_id)
    if (founderIndex == -1) {
        staffs.value.unshift(m[0])
    } else {
        staffs.value.splice(founderIndex, 1)
        staffs.value.unshift(m[0])
    }
})

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

const infoBodyCameraDialog = ref()


async function loadScripts() {
    const scripts = [
        'http://10.100.9.171/plugins/dist/jquery.js',
        'http://10.100.9.171/plugins/dist/jsPlugin-1.2.0.min.js',
        'http://10.100.9.171/plugins/dist/cryptico.min.js',
        'http://10.100.9.171/plugins/dist/uuid.js',
        'http://10.100.9.171/plugins/dist/jquery.cookie.js'
    ];

    for (const src of scripts) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script ${src}`));
            document.head.appendChild(script);
        });
    }
};




async function getCameraStatusAndOpen(type) {
    const { data } = await axios.get(`/events/get-camera-url?type=${type}`);
    infoBodyCameraDialog.value = data;
    openCam()
}


const cameraClosing = ref(false)

var iWind = 0;
function GetSelectWndInfo(xml) {
    console.log(xml);
    iWind = xml;
}

let is_played0 = false;
let is_played1 = false;
let is_played2 = false;
const camera_type = ref();

function openCam() {
    camera_type.value = 2;
    document.getElementById('offline_bg').style.display = 'flex';
    document.getElementById('offline_bg').style.justifyContent = 'center';
    document.getElementById('offline_bg').style.alignItems = 'center';
    document.getElementById('offline_bg').innerHTML = '<i class="pi pi-spin pi-spinner my-5" style="font-size: 2rem"></i>';
    document.getElementById('playWind').style.display = 'none';
    document.querySelector('.mute').style.display = 'block';
    document.querySelector('.unmute').style.display = 'none';
    if (is_played1) {
        jsDecoder.JS_Stop(1);
        is_played1 = false;
    }
    if (is_played2) {
        jsDecoder.JS_Stop(2);
        is_played2 = false;
    }
    if (is_played0) {
        console.log(1);

        jsDecoder.JS_Stop(0).then(
            function () {
                console.log('stop success');
                is_played0 = false;
                arrangeWindow(2);
                if (infoBodyCameraDialog?.value) {
                    document.getElementById('offline_bg').style.display = 'none';
                    document.getElementById('playWind').style.display = 'block';
                    play_camera(infoBodyCameraDialog?.value?.url, 0);

                } else {
                    document.getElementById('offline_bg').style.display = 'flex';
                    document.getElementById('playWind').style.display = 'none';
                }
            },
            function () {
                console.log('stop failed');
            }
        );
    } else {
        arrangeWindow(2);
        if (infoBodyCameraDialog?.value) {
            document.getElementById('offline_bg').style.display = 'none';
            document.getElementById('playWind').style.display = 'block';
            play_camera(infoBodyCameraDialog?.value?.url, 0);
        } else {
            document.getElementById('offline_bg').style.display = 'flex';
            document.getElementById('offline_bg').innerHTML = '<h3 class="my-5">Kamera offline</h3>';
            document.getElementById('playWind').style.display = 'none';
        }
    }
}

function play_camera(url, iWindee) {
    jsDecoder.JS_Play(url, { playURL: url }, iWindee).then(
        function () {
            console.log('realplay success');
            if (iWindee == 0) {
                is_played0 = true;
            } else if (iWindee == 1) {
                is_played1 = true;
            } else {
                is_played2 = true;
            }
        },
        function () {
            console.log('realplay failed');
        }
    );
}

function stop() {
    jsDecoder.JS_Stop(iWind).then(
        function () {
            console.log('stop success');
        },
        function () {
            console.log('stop failed');
        }
    );
}

function arrangeWindow(i) {
    jsDecoder.JS_ArrangeWindow(i);
}

function Stop() {
    jsDecoder.JS_Stop(iWind);
}

function CapturePicture(szType) {
    jsDecoder.JS_CapturePicture(iWind, 'img', szType).then(
        function () {
            console.log('CapturePicture success');
        },
        function () {
            console.log('CapturePicture failed');
        }
    );
}

document.addEventListener('click', function (event) {
    const clickedElement = event.target;

    if (clickedElement.id == 'canvas_draw0') {
        iWind = 0;
    } else if (clickedElement.id == 'canvas_draw1') {
        iWind = 1;
    } else if (clickedElement.id == 'canvas_draw2') {
        iWind = 2;
    }
    if (iWind != clickedElement.id.slice(0, 11) && clickedElement.id.startsWith('canvas_draw')) {
        CloseSound();
        $('.mute').show();
        $('.unmute').hide();
    }
});
document.addEventListener('click', function (event) {
    const clickedElement = event.target;

    if (clickedElement.id == 'canvas_draw0') {
        iWind = 0;
    } else if (clickedElement.id == 'canvas_draw1') {
        iWind = 1;
    } else if (clickedElement.id == 'canvas_draw2') {
        iWind = 2;
    }

    if (iWind != getLastNumber(clickedElement.id) && clickedElement.id.startsWith('canvas_draw')) {
        CloseSound();
        $('.mute').show();
        $('.unmute').hide();
    }

    function getLastNumber(str) {
        const match = str.match(/\d+$/); // Match digits at the end of the string
        return match ? match[0] : null; // Return the matched number or null if not found
    }
});

function OpenSound() {
    var iRet = jsDecoder.JS_OpenSound(iWind);
    if (iRet == 0) alert('Ушбу камерада овоз бор, уни ёқишни тасдиқлайсизми?');
    else {
        alert('Ушбу камерада овоз йўқ');
        return;
    }
}

function CloseSound() {
    jsDecoder.JS_CloseSound(iWind);
}

function StopRealPlayAll() {
    jsDecoder.JS_StopRealPlayAll();
}

function fullSreen() {
    jsDecoder.JS_FullScreenDisplay(true);
}

function fullScreenSingle() {
    jsDecoder.JS_FullScreenSingle(iWind);
}
window.onresize = function () {
    jsDecoder.JS_Resize(1240, 600);
    document.getElementById('playWind').style.width = '620px';
    document.getElementById('playWind').style.height = '300px';
};



</script>

<template>
    <div class="menage-staffs grid grid-cols-12 gap-3">
        <div class="col-span-6">
            <div class="card py-2 mb-3">
                <Tabs value="0" class="w-full">
                    <TabList>
                        <Tab @click="filter.type = 1" value="0">Кирди-чиқди</Tab>
                        <Tab @click="filter.type = 2" value="1">Қурол</Tab>
                    </TabList>
                    <TabPanels class="!p-0">
                        <TabPanel value="0" class="flex gap-3 w-full pt-3">
                            <div v-if="enterStaff" class="w-1/2">
                                <div class="text-center mb-3">
                                    <div class="mt-0 font-semibold text-xl">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            Кириш
                                        </div>
                                    </div>
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
                                    <div class="mt-0 font-semibold text-xl">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            Чиқиш
                                        </div>
                                    </div>
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
                                    <div class="mt-0 font-semibold text-xl">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-green-500 dark:bg-green-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            Қабул қилди
                                        </div>
                                    </div>
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
                                    <div class="mt-0 font-semibold text-xl">
                                        <div
                                            class="px-4 h-9 inline-flex items-center justify-center bg-orange-500 dark:bg-orange-800 text-white rounded-lg shrink-0 cursor-pointer">
                                            Топширди
                                        </div>
                                    </div>
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
                <div class="text-center flex">
                    <div id="playWind" style="width: 620px; height: 300px; display: none"></div>
                    <div class="rounded" id="offline_bg" style="width: 620px; height: 300px;">
                        <span>Kamera offline!</span>
                    </div>
                    <div class="items flex justify-content-center m-2 mt-5">
                        <div class="grid grid-cols-12" style="width: 80px;">
                            <div class="col-span-12 p-0">
                                <Button severity="primary" @click="fullSreen()">
                                    <i class="pi pi-window-maximize"></i>
                                </Button>
                            </div>
                            <div class="col-span-12 p-0 unmute" style="display: none">
                                <Button severity="success">
                                    <i class="pi pi-volume-up"></i>
                                </Button>
                            </div>
                            <div class="col-span-12 p-0 mute">
                                <Button severity="danger">
                                    <i class="pi pi-volume-off"></i>
                                </Button>
                            </div>
                            <div class="col-span-12 p-0">
                                <Button severity="secondary" @click="CapturePicture('JPEG')">
                                    <i class="pi pi-camera"></i>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card py-2 col-span-6">
            <DataTable ref="dt" v-model:selection="selectedProducts" :value="staffs" dataKey="id" :paginator="true"
                :rows="12" :loading="loading" :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 8, 12, 15, 25, 50, 100]"
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
                                    Қабул қилди
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
                <Column field="division_name" header="Йўналиш" sortable></Column>
                <Column field="fullname" header="Ф.И.Ш" sortable>
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
