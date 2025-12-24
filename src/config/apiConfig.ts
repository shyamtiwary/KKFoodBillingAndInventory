const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:55219';
// For mobile testing, you might need to use your machine's IP address:
// const API_BASE_URL = 'http://192.168.x.x:55219'; 


export const SERVICE_URLS = {
    INVENTORY: `${API_BASE_URL}/api/Products`,
    BILLING: `${API_BASE_URL}/api/Bills`,
    AUTH: `${API_BASE_URL}/api/Auth`,
};

