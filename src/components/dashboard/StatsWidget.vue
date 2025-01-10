<script setup>
import { defineProps, defineEmits } from "vue";

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

</script>
<template>
    <div class="grid grid-cols-12 gap-4">
        <div v-for="item in attendance" class="col-span-6 lg:col-span-6 xl:col-span-6">
            <div class="card px-8 py-5 cursor-pointer mb-0" @click="clickCard(item)">
                <div class="flex justify-between">
                    <div>
                        <span class="block text-muted-color font-medium mb-2"> {{ item.name }} </span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{item.value}}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-user text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <!-- <span class="text-primary font-medium">24 new </span>
                <span class="text-muted-color">since last visit</span> -->
            </div>
        </div>
    </div>
</template>
