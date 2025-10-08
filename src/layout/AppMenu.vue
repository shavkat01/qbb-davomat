<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';


const model = ref([
    {
        blockedUsers: [3],
        label: 'main',
        items: [
            { blockedUsers: [4], label: 'dashboard', icon: 'pi pi-fw pi-home', to: '/' },
            { blockedUsers: [4], label: 'calendar', icon: 'pi pi-fw pi-calendar', to: '/attendance' },
            { blockedUsers: [4], label: 'online_monitoring', icon: 'pi pi-fw pi-video', to: '/survilance' },
            { blockedUsers: [4], label: 'meeting', icon: 'pi pi-fw pi-stopwatch', to: '/trevoga' },
            { blockedUsers: [4], label: 'important_dates', icon: 'pi pi-fw pi-calendar-clock', to: '/special-dates' },
            {
                blockedUsers: [1, 2],
                label: 'my_visitors',
                icon: 'pi pi-fw pi-users',
                to: '/pages/reception'
            },

        ]
    },
    {
        blockedUsers: [4],
        label: 'reference',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
       
            {
                blockedUsers: [3],
                label: 'staffs',
                icon: 'pi pi-fw pi-user',
                to: '/pages/staffs'
            },
            {
                blockedUsers: [],
                label: 'others',
                icon: 'pi pi-fw pi-users',
                to: '/pages/persons'
            },
     
        ]
    },
   
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
