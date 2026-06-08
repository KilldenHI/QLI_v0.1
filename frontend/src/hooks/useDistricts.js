import { useState, useEffect, useCallback } from 'react';
import api from '../api/districtsApi';

const useDistricts = () => {
    const [districtsSimple, setDistrictsSimple] = useState({ type: 'FeatureCollection', features: [] });
    const [districtsEco, setDistrictsEco] = useState({ type: 'FeatureCollection', features: [] });
    const [districtNames, setDistrictNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingEco, setLoadingEco] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ count: 0 });

    // Загрузка обычного слоя (быстрый)
    useEffect(() => {
        const loadSimpleData = async () => {
            try {
                setLoading(true);
                const [districtsData, namesData, statsData] = await Promise.all([
                    api.getDistrictsGeoJSONSimple(),
                    api.getDistrictNames(),
                    api.getStats()
                ]);
                setDistrictsSimple(districtsData);
                setDistrictNames(namesData);
                setStats(statsData);
                setError(null);
            } catch (err) {
                console.error('Load error:', err);
                setError('Не удалось загрузить данные районов. Убедитесь, что бэкенд запущен.');
            } finally {
                setLoading(false);
            }
        };
        loadSimpleData();
    }, []);

    // Загрузка экологического слоя (по требованию)
    const loadEcoLayer = useCallback(async () => {
        if (districtsEco.features.length > 0) return; // Уже загружено
        
        try {
            setLoadingEco(true);
            const ecoData = await api.getDistrictsGeoJSON();
            setDistrictsEco(ecoData);
        } catch (err) {
            console.error('Error loading eco layer:', err);
        } finally {
            setLoadingEco(false);
        }
    }, [districtsEco]);

    return { 
        districtsSimple, 
        districtsEco,
        districtNames, 
        loading, 
        loadingEco,
        error, 
        stats,
        loadEcoLayer
    };
};

export default useDistricts;