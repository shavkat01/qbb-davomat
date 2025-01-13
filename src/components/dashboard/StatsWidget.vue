<script setup>
import { defineProps, defineEmits, inject, watch, ref, onMounted, onUnmounted } from "vue";
import axios from '@/service/axiosIns.js';
import { useSocket} from "@/service/useSocket.js";

const socket = inject('socket');

const props = defineProps({
    attendance: {
        type: Array,
        required: true
    }
});

const emits = defineEmits(["card-clicked"]);

function clickCard(item) {
    emits("card-clicked", item);
}
const staffs =ref()



// Fetch staffs
async function getStaffs() {
    const staffResponse = await axios.get(`/events/get-attendance`);
    staffs.value = staffResponse.data;
}


// Socket listener for attendance data
useSocket('get_attendance', (m) => {
    const foundIndex = staffs.value.staffs.findIndex((item) => item.staff_id === m.staffs[0].staff_id);

    if (foundIndex === -1) {
        staffs.value.staffs.unshift(m.staffs[0]);
    } else {
        staffs.value.staffs[foundIndex] = m.staffs[0];
    }
});


// Initialize data on component mount
onMounted(async () => {
    await getStaffs();
});


</script>
<template>
    <div class="grid grid-cols-12 gap-4">
        <div v-if="staffs" class="col-span-6 card p-4 mb-0">
            <h3 class="text-2xl mb-3">
                Давомат
            </h3>
            <div class="grid grid-cols-12 gap-3">
                <div class="col-span-12">
                    <div class="bg-gray-800 rounded-lg px-8 py-5 cursor-pointer mb-0">
                        <div class="flex justify-between">
                            <div>
                                <span class="block text-muted-color font-medium mb-2"> Рўйхат бўйича </span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl"></div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                                style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-blue-500 text-xl font-medium">{{staffs.staffs.length}}</span>
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="bg-gray-800 rounded-lg px-8 py-5 cursor-pointer mb-0">
                        <div class="flex justify-between">
                            <div>
                                <span class="block text-muted-color font-medium mb-2"> Вақтида келди </span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl"></div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                                style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-green-500 text-xl font-medium">{{staffs.on_time_staff.count}}</span>
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="bg-gray-800 rounded-lg px-8 py-5 cursor-pointer mb-0">
                        <div class="flex justify-between">
                            <div>
                                <span class="block text-muted-color font-medium mb-2"> Кеч қолди </span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl"></div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                                style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-orange-500 text-xl font-medium">{{staffs.late_staff.count}}</span>
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="bg-gray-800 rounded-lg px-8 py-5 cursor-pointer mb-0">
                        <div class="flex justify-between">
                            <div>
                                <span class="block text-muted-color font-medium mb-2"> Келмади </span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl"></div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                                style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-red-500 text-xl font-medium">{{staffs.absent_staff.count}}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-6 card p-4">
            <h3 class="text-2xl mb-3">
                Рўйхатда
            </h3>
            <div class="grid grid-cols-12 gap-4">
                <div v-for="item in attendance" class="col-span-6 lg:col-span-6 xl:col-span-6">
                    <div class="bg-gray-800 rounded-lg px-8 py-5 cursor-pointer mb-0" @click="clickCard(item)">
                        <div class="flex justify-between">
                            <div>
                                <span class="block text-muted-color font-medium mb-2"> {{ item.name }} </span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{item.value}}
                                </div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                                style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-user text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <!-- <span class="text-primary font-medium">24 new </span>
                        <span class="text-muted-color">since last visit</span> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
