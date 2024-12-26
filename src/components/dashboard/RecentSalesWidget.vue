<script setup>
import { ProductService } from '@/service/ProductService';
import { defineProps, onMounted, ref } from 'vue';









const props = defineProps({
    staffs: {
        type: Array,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'Рўйхат бўйича'
    }
});
const products = ref(null);

function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

onMounted(() => {
    ProductService.getProductsSmall().then((data) => (products.value = data));
});

function getImage(img) {
    return `${import.meta.env.VITE_API_BASE_URL}/public/staff_photos/${img}`;
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">{{ status }}</div>
        <DataTable ref="dt" :value="staffs" dataKey="id" :paginator="true" :rows="10" :loading="loading"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs">

            <template #empty>
                <div class="text-center">
                    Маълумот топилмади
                </div>
            </template>
            <Column header="Расм">
                <template #body="slotProps">
                    <Image :src="getImage(slotProps.data.photo)" alt="Image" width="50" preview />
                </template>
            </Column>
            <Column field="fullname" header="Ф.И.О" sortable style="min-width: 4rem"></Column>
            <Column field="phone_number" header="Телефон" sortable style="min-width: 4rem"></Column>
            <Column field="rank_name" header="Унвон" sortable style="min-width: 4rem"></Column>
            <Column field="division_name" header="Bo'lim" sortable style="min-width: 4rem"></Column>
        </DataTable>
    </div>
</template>
