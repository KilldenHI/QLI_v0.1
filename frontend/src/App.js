import React, { useState, useCallback } from 'react';
import DistrictMap from './components/Map/DistrictMap';
import CompactSidebar from './components/Sidebar/CompactSidebar';
import InfoPanel from './components/InfoPanel/InfoPanel';
import Loader from './components/common/Loader';
import ErrorMessage from './components/common/ErrorMessage';
import useDistricts from './hooks/useDistricts';
import useDistrictDetails from './hooks/useDistrictDetails';
import './App.css';

function App() {
    const { districtsSimple, districtNames, loading, error, stats, loadEcoLayer, districtsEco, loadingEco } = useDistricts();
    const { selectedDistrict, loading: detailsLoading, error: detailsError, loadDistrictDetails, clearSelectedDistrict } = useDistrictDetails();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleSelectDistrict = useCallback((districtData) => {
        if (districtData === null) {
            clearSelectedDistrict();
            return;
        }
        
        let districtId = null;
        let districtName = null;
        
        if (districtData.id) {
            districtId = districtData.id;
            districtName = districtData.name;
        } else if (districtData.properties?.id) {
            districtId = districtData.properties.id;
            districtName = districtData.properties.name;
        }
        
        if (districtId) {
            loadDistrictDetails(districtId);
        }
        
        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [loadDistrictDetails, clearSelectedDistrict]);

    const handleClosePanel = useCallback(() => {
        clearSelectedDistrict();
    }, [clearSelectedDistrict]);

    const handleCenterDistrict = useCallback(() => {
        if (selectedDistrict?.properties?.center) {
            window.dispatchEvent(new CustomEvent('centerDistrict', {
                detail: selectedDistrict
            }));
        } else if (selectedDistrict?.center) {
            window.dispatchEvent(new CustomEvent('centerDistrict', {
                detail: selectedDistrict
            }));
        }
    }, [selectedDistrict]);

    const handleLoadEcoLayer = useCallback(() => {
        if (!districtsEco?.features?.length) {
            loadEcoLayer();
        }
    }, [districtsEco, loadEcoLayer]);

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="app">
            <CompactSidebar
                districts={districtNames}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={handleSelectDistrict}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                statsCount={stats.count}
            />
            
            <div className="map-wrapper">
                <DistrictMap
                    districtsSimple={districtsSimple}
                    districtsEco={districtsEco}
                    loadingEco={loadingEco}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={handleSelectDistrict}
                    onLoadEcoLayer={handleLoadEcoLayer}
                />
            </div>

            {(selectedDistrict || detailsLoading) && (
                <InfoPanel
                    district={selectedDistrict}
                    loading={detailsLoading}
                    error={detailsError}
                    onClose={handleClosePanel}
                    onCenter={handleCenterDistrict}
                />
            )}
        </div>
    );
}

export default App;