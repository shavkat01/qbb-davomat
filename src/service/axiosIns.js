import axios from 'axios';
import router from '../router/index'
const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosIns = axios.create({
    baseURL: baseURL + '/api',
});

axiosIns.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosIns.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response.status === 401 && !error.config._retry) {
            error.config._retry = true;
            try {
                if(localStorage.getItem('refreshToken') !== 'null' && localStorage.getItem('refreshToken') !== 'undefined') {
                    const refreshToken = localStorage.getItem('refreshToken');
                    const response = await axios.post(`${baseURL + '/api'}/auth/refresh-token`, { refreshToken });
                    const { accessToken } = response.data;
                    
                    localStorage.setItem('accessToken', accessToken);
                    
                    error.config.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(error.config);
                }
            } catch (error) {
                router.push('/auth/login');
                localStorage.setItem('accessToken', null)
                localStorage.setItem('refreshToken', null)
            }
        }

        return Promise.reject(error);
    }
);

export default axiosIns;