import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 30000,
});

export default {
    // ============= ДЛЯ КАРТЫ =============
    
    // Получить GeoJSON с границами и рейтингом (для карты)
    getDistrictsGeoJSON: async () => {
        const response = await apiClient.get('/districts/geojson');
        return response.data;
    },
    
    // Получить GeoJSON только с границами (без рейтинга) - быстрее
    getDistrictsGeoJSONSimple: async () => {
        const response = await apiClient.get('/districts/geojson/simple');
        return response.data;
    },
    
    // Получить список районов (ID и название) для боковой панели
    getDistrictNames: async () => {
        const response = await apiClient.get('/districts/names');
        return response.data;
    },
    
    // Получить количество районов
    getStats: async () => {
        const response = await apiClient.get('/districts/count');
        return response.data;
    },
    
    // ============= ДЛЯ INFO PANEL =============
    
    // Получить полную информацию о районе по ID
    getDistrictDetails: async (id) => {
        const response = await apiClient.get(`/districts/${id}/details`);
        return response.data;
    },
    
    // Получить только инфраструктурные данные района
    getDistrictInfrastructure: async (id) => {
        const response = await apiClient.get(`/districts/${id}/infrastructure`);
        return response.data;
    },

    // Получить только экологический рейтинг района
    getDistrictEcoRating: async (id) => {
        const response = await apiClient.get(`/districts/${id}/ecorating`);
        return response.data;
    },
    
    // Получить только текстовую информацию района
    getDistrictInfo: async (id) => {
        const response = await apiClient.get(`/districts/${id}/info`);
        return response.data;
    }
};