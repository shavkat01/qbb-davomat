<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';

import { ref, onMounted } from "vue";
import axios from '@/service/axiosIns.js';
import * as XLSX from 'xlsx';


const ranks = ref([]);
const divisions = ref([]);
const statusList = ref([]);
const attendance = ref([]);
const staffs = ref([]);
const statusName = ref('Рўйхатда');
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

const exportToExcel = () => {
    let listBody = [];
    let lists = attendance.value
    if (statusName.value !== "Рўйхатда") {
        lists = attendance.value.filter(item => item.name == statusName.value ? item.name : '')
    }
    console.log(lists);
    
    const combinedRow = { 'Йўналиш': 'Йўналиш' };
    lists.forEach(row => {
        combinedRow[row.name] = row.name;
    });

    // Get unique division names
    const uniqueDivisionNameArr = staffs.value.filter(
        (item, index, self) =>
            index === self.findIndex((t) => t.division_name === item.division_name)
    );

    // Prepare body data
    let divisionCounts = {}; // Track counts for each division and status

    uniqueDivisionNameArr.forEach((division) => {
        divisionCounts[division.division_name] = {};

        lists.forEach((header) => {
            divisionCounts[division.division_name][header.name] = 0; // Initialize count
        });
    });

    staffs.value.forEach((staff) => {
        if (divisionCounts[staff.division_name] && staff.status in divisionCounts[staff.division_name]) {
            divisionCounts[staff.division_name][staff.status]++;
        }
    });

    // Convert counts into listBody rows
    listBody = uniqueDivisionNameArr.map((division) => {
        const row = { 'Йўналиш': division.division_name };

        lists.forEach((header) => {
            if (header.name === 'Рўйхатда') {
                row[header.name] = Object.values(divisionCounts[division.division_name]).reduce((sum, value) => sum + value, 0);
            } else {
                row[header.name] = divisionCounts[division.division_name][header.name] || 0;
            }
        });

        return row;
    });

    // Prepare tableBody
    const tableBody = staffs.value.map(row => ({
        "Ф.И.Ш": row.fullname,
        Телефон: row.phone_number,
        Унвон: row.rank_name,
        Йўналиш: row.division_name,
        Ҳолат: row.status,
    }));

    // Create worksheets
    const listDataSheet = XLSX.utils.json_to_sheet([...listBody]);
    const tableBodySheet = XLSX.utils.json_to_sheet([...tableBody]);

    // Customize column widths for listData
    listDataSheet["!cols"] = [
        { wch: 20 }, // Йўналиш
        { wch: 20 }, // Dynamic second column width
    ];

    // Customize column widths for tableBody
    tableBodySheet["!cols"] = [
        { wch: 40 }, // Ф.И.Ш
        { wch: 15 }, // Телефон
        { wch: 15 }, // Унвон
        { wch: 30 }, // Йўналиш
        { wch: 15 }, // Йўналиш
    ];

    // Add header styles (optional)
    const styleHeaders = (sheet, startRow) => {
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({ r: startRow, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                };
            }
        }
    };

    // Apply styles to headers in both sheets
    styleHeaders(listDataSheet, 0); // Header styling for listData
    styleHeaders(tableBodySheet, 0); // Header styling for tableBody

    // Create workbook and append worksheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, listDataSheet, "List Data");
    XLSX.utils.book_append_sheet(workbook, tableBodySheet, "Ходимлар");

    // Export file
    XLSX.writeFile(workbook, "CombinedData.xlsx");
};

</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 xl:col-span-6">
            <StatsWidget :attendance="attendance" @cardClicked="cardClick" @exportToExcel="exportToExcel" />
            <RevenueStreamWidget class="mt-4" />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget :loading="loading" :staffs="staffs" :status="statusName" />
            <!-- <BestSellingWidget /> -->
        </div>
        <div class="col-span-12 xl:col-span-6">
        </div>
    </div>
</template>
