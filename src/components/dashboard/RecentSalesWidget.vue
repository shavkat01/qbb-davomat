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
        <DataTable ref="dt" :value="staffs" dataKey="id" :paginator="true" :rows="11" :loading="loading"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 11, 25, 200]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} staffs">

            <template #empty>
                <div class="text-center">
                    {{ $t('no_data') }}
                </div>
            </template>
            <Column :header="$t('photo')">
                <template #body="slotProps">
                    <Image :src="getImage(slotProps.data.photo)" alt="Image" width="25" preview />
                </template>
            </Column>
            <Column field="fullname" :header="$t('full_name')" sortable style="min-width: 4rem"></Column>
            <Column field="phone_number" :header="$t('phone')" sortable style="min-width: 4rem"></Column>
            <Column field="rank_name" :header="$t('rank')" sortable style="min-width: 4rem"></Column>
            <Column field="division_name" :header="$t('direction')" sortable style="min-width: 4rem"></Column>
        </DataTable>
    </div>
</template>
