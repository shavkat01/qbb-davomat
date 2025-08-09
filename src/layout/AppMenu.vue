<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';


const model = ref([
    {
        blockedUsers: [3],
        label: 'Aсосий',
        items: [
            { blockedUsers: [4], label: 'Бош саҳифа', icon: 'pi pi-fw pi-home', to: '/' },
            { blockedUsers: [4], label: 'Давомат', icon: 'pi pi-fw pi-calendar', to: '/attendance' },
            { blockedUsers: [4], label: 'Онлайн кузатув', icon: 'pi pi-fw pi-video', to: '/survilance' },
            { blockedUsers: [4], label: 'Йиғин', icon: 'pi pi-fw pi-stopwatch', to: '/trevoga' },
            { blockedUsers: [4], label: 'Муҳим саналар', icon: 'pi pi-fw pi-calendar-clock', to: '/special-dates' },
            {
                blockedUsers: [1, 2],
                label: 'Қабулимдагилар',
                icon: 'pi pi-fw pi-users',
                to: '/pages/reception'
            },

        ]
    },
    {
        blockedUsers: [4],
        label: 'Маълумотнома',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
       
            {
                blockedUsers: [3],
                label: 'Ходимлар',
                icon: 'pi pi-fw pi-user',
                to: '/pages/staffs'
            },
            {
                blockedUsers: [],
                label: 'Бoшқалар',
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
