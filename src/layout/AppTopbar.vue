<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useI18n } from 'vue-i18n'

import uz_flag from '@/assets/demo/flags/uz_flag.jfif'
import ru_flag from '@/assets/demo/flags/ru_flag.jfif'
import oz_flag from '@/assets/demo/flags/uk_flag.png'
import AppConfigurator from './AppConfigurator.vue';
import SnowFalling from '@/components/SnowFalling.vue';
import { useRouter } from "vue-router";
import { ref } from "vue";
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const { t, locale } = useI18n()
const router = useRouter();

const clock = ref(null);
const menu = ref(null);

const langMenuItems = ref([
    {
        name: "O'zbekcha",
        value: 'uz',
        img: uz_flag,
    },
    {
        name: 'Русский',
        value: 'ru',
        img: ru_flag,
    },
    {
        name: 'Ўзбекча',
        value: 'oz',
        img: oz_flag,
    }
]);

const toggleMenuLang = (event) => {
    menu.value.toggle(event);
};

function changeLang(lang) {
    locale.value = lang.value;
    localStorage.setItem('lang', JSON.stringify(lang))
}
function updateClock() {
				const now = new Date();

				// Extract individual components from the date
				const day = String(now.getDate()).padStart(2, '0');
				const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
				const year = now.getFullYear();
				const hours = String(now.getHours()).padStart(2, '0');
				const minutes = String(now.getMinutes()).padStart(2, '0');
				const seconds = String(now.getSeconds()).padStart(2, '0');

				// Format date as dd-mm-yyyy and time as 24-hour
				const formattedDateTime = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

				// Update the clock element
				clock.value = formattedDateTime;
			}

			// Update clock initially
			updateClock();

			// Set interval to update the clock every minute
			setInterval(updateClock, 1000);
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <span>ҚББ ДAВОМAТ</span>
            </router-link>
        </div>

        <div>
			<div v-if="clock" id="clock" class="w-full text-3xl flex gap-10 text-primary">
                <div>
                    <i class="pi pi-calendar mr-1 !text-3xl"></i>
                    {{ clock.split(' ')[0] }}
                </div>
                <div>
                    <i class="pi pi-clock mr-1 !text-3xl"></i>
                    {{ clock.split(' ')[1] }}
                </div>
            </div>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <!-- <screen-recorder/> -->
                <button @click="toggleMenuLang" class="p-link layout-topbar-button">
                    <i class="pi pi-language"></i>
                </button>
                <Menu ref="menu" :model="langMenuItems" :popup="true" >
                    <template #item="{ item, props }">
                        <a v-ripple class="flex align-items-center" v-bind="props.action" @click="changeLang(item)">
                            <img width="24" :src="item.img" alt="">
                            <span class="ml-3">{{ item.name }}</span>
                        </a>
                    </template>
                </Menu>
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button> -->
                    <!-- <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button> -->
                    <div class="layout-config-menu">
                        <div class="relative">
                            <button
                                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                                type="button"
                                class="layout-topbar-action"
                            >
                                <i class="pi pi-user"></i>
                            </button>
                            <div
                                class="config-panel hidden absolute top-[3.25rem] right-0 w-64 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]"
                            >
                                <Button @click="router.push('/auth/login')" type="button" label="Secondary" severity="secondary" class="w-full">
                                    <i class="pi pi-calendar"></i>
                                    <span>Чиқиш</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
