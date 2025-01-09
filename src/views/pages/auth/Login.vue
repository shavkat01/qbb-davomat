<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { ref, computed, onMounted } from 'vue';
import axios from "@/service/axiosIns.js";
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(async () => {
        if(localStorage.getItem('refreshToken') !== 'null'){
            try{
                await axios.post('/auth/logout');
                localStorage.setItem('accessToken', null)
                localStorage.setItem('refreshToken', null)
                localStorage.setItem('userData', null);
            }catch(e){
                localStorage.setItem('accessToken', null)
                localStorage.setItem('refreshToken', null)
            }
        }
})


const username = ref('');
const password = ref('');
const checked = ref(false);



async function signIn() {
    // submitted.value = true;

    // if (username.value.length < 4) return
    try {
        const response = await axios.post('/auth/login', {username: username.value, password: password.value});
        const { accessToken, refreshToken, user } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userData', JSON.stringify(user));

        router.push('/')
    } catch (error) { 
        // toast.add({ severity: 'error', summary: t('status'), detail: t('error'), life: 3000 });
    }
}
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-2">
                            <img src="/public/logo.png" width="60" alt="">
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Хуш келибсиз!</div>
                        <span class="text-muted-color font-medium">Илтимос давом эттириш учун дастурга киринг</span>
                    </div>

                    <div>
                        <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Фойдаланувчи</label>
                        <InputText id="username" type="text" placeholder="Киритиш" class="w-full md:w-[30rem] mb-8" v-model="username" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Парол</label>
                        <Password id="password1" v-model="password" placeholder="Киритиш" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Эслаб қолиш</label>
                            </div>
                        </div>
                        <Button label="Кириш" class="w-full" @click="signIn"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
