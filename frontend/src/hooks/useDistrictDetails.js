import { useState, useCallback } from 'react';
import api from '../api/districtsApi';

const useDistrictDetails = () => {
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadDistrictDetails = useCallback(async (districtId) => {
        if (!districtId) {
            setSelectedDistrict(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching details for district:', districtId);
            const details = await api.getDistrictDetails(districtId);
            console.log('Received details:', details);
            
            // Формируем полный объект района
            const fullDistrict = {
                id: details.id,
                properties: {
                    id: details.id,
                    name: details.name,
                    center: details.center,
                    smolInf: details.smolInf,
                    final_index: details.quality_components.final_index,  // Изменено с quality_index на final_index
                    quality_components: details.quality_components,
                    ecoRating: details.ecoRating,
                    infrastructure: details.infrastructure
                }
            };
            
            setSelectedDistrict(fullDistrict);
        } catch (err) {
            console.error('Error loading district details:', err);
            setError('Не удалось загрузить информацию о районе');
            setSelectedDistrict(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSelectedDistrict = useCallback(() => {
        setSelectedDistrict(null);
        setError(null);
    }, []);

    return {
        selectedDistrict,
        loading,
        error,
        loadDistrictDetails,
        clearSelectedDistrict
    };
};

export default useDistrictDetails;