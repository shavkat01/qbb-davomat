<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';

import { ref, onMounted } from "vue";
import axios from '@/service/axiosIns.js';


const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const attendance = ref([]);
const staffs = ref([]);
const statusName = ref('Рўйхат бўйича');
const loading = ref(false);


async function getAttandance() {
    // loading.value = true;
    let url = `/staffs/get-dashboard`;
    const attendanceResponse = await axios.get(url);
    attendance.value = attendanceResponse.data;
    // loading.value = false;
}

async function getStaffs(status_id) {
    loading.value = true;
    let url = `/staffs/get-staffs`;
    let params = [];
    if (status_id) {
        params.push(`status_id=${status_id}`);
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    const staffResponse = await axios.get(url);
    staffs.value = staffResponse.data;
    loading.value = false;
}



onMounted(async () => {
    try {
        getAttandance();
        getStaffs(0);

    } catch (error) {
    }
});


function cardClick(params) {
    getStaffs(params.status_id)
    statusName.value = params.name
}


</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget :attendance="attendance" @cardClicked="cardClick"/>

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget :loading="loading" :staffs="staffs" :status="statusName"/>
            <!-- <BestSellingWidget /> -->
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div>
    </div>
</template>
