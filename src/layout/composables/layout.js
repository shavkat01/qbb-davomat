import { computed, reactive, watch } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

// Load configuration from localStorage on initial load
const loadConfigFromLocalStorage = () => {
    const savedConfig = localStorage.getItem('layoutConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        // Apply saved configuration to layoutConfig
        layoutConfig.preset = config.preset || layoutConfig.preset;
        layoutConfig.primary = config.primary || layoutConfig.primary;
        layoutConfig.surface = config.surface || layoutConfig.surface;
        layoutConfig.darkTheme = config.darkTheme !== undefined ? config.darkTheme : layoutConfig.darkTheme;
        layoutConfig.menuMode = config.menuMode || layoutConfig.menuMode;
        
        // Apply dark theme if saved in localStorage
        if (layoutConfig.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }
};

// Save configuration to localStorage whenever layoutConfig changes
const saveConfigToLocalStorage = () => {
    localStorage.setItem('layoutConfig', JSON.stringify({
        preset: layoutConfig.preset,
        primary: layoutConfig.primary,
        surface: layoutConfig.surface,
        darkTheme: layoutConfig.darkTheme,
        menuMode: layoutConfig.menuMode
    }));
};
loadConfigFromLocalStorage(); // Load configuration on component mount

// Watch layoutConfig for changes and save to localStorage
watch(() => layoutConfig, saveConfigToLocalStorage, { deep: true });

// Existing methods
const setActiveMenuItem = (item) => {
    layoutState.activeMenuItem = item.value || item;
};

const toggleDarkMode = () => {
    if (!document.startViewTransition) {
        executeDarkModeToggle();
        return;
    }
    document.startViewTransition(() => executeDarkModeToggle());
};

const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');
};

const toggleMenu = () => {
    if (layoutConfig.menuMode === 'overlay') {
        layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
    }

    if (window.innerWidth > 991) {
        layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
    } else {
        layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
    }
};

const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);
const isDarkTheme = computed(() => layoutConfig.darkTheme);
const getPrimary = computed(() => layoutConfig.primary);
const getSurface = computed(() => layoutConfig.surface);

export function useLayout() {
    return {
        layoutConfig,
        layoutState,
        toggleMenu,
        isSidebarActive,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode
    };
}
