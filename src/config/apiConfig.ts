const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:55219';

export const SERVICE_URLS = {
    INVENTORY: `${API_BASE_URL}/api/Products`,
    BILLING: `${API_BASE_URL}/api/Bills`,
    AUTH: `${API_BASE_URL}/api/Auth`,
};

