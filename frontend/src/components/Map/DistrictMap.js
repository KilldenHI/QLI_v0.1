import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import './DistrictMap.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DistrictMap = ({ 
    districtsSimple,      // Обычный слой (только границы)
    districtsEco,         // Экологический слой (с рейтингом)
    loadingEco,           // Флаг загрузки эко-слоя
    selectedDistrict, 
    onSelectDistrict,
    onLoadEcoLayer        // Функция для загрузки эко-слоя
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const isMapInitializedRef = useRef(false);
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [activeLayer, setActiveLayer] = useState('simple'); // 'simple' или 'eco'
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || isMapInitializedRef.current) return;

        const map = L.map(mapRef.current).setView([55.751574, 37.573856], 10);
        map.setMinZoom(8);
        map.setMaxZoom(18);
        
        // Используем русские тайлы от NextGIS или другого провайдера
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abc',
            maxZoom: 25,
            minZoom: 5
        }).addTo(map);

        mapInstanceRef.current = map;
        isMapInitializedRef.current = true;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                isMapInitializedRef.current = false;
            }
        };
    }, []);

    // Получение цвета для эко-рейтинга (заливка)
    const getEcoFillColor = (rating) => {
        if (!rating && rating !== 0) return 'rgba(52, 152, 219, 0.3)';
        
        if (rating == 1) return 'rgba(46, 204, 113, 0.4)';      // Зелёный
        if (rating == 2) return 'rgba(243, 156, 18, 0.4)';       // Жёлто-зелёный
        if (rating == 3) return 'rgba(230, 126, 34, 0.4)';       // Оранжевый
        if (rating == 4) return 'rgba(231, 76, 60, 0.4)';        // Темно-оранжевый
        if (rating == 5) return 'rgba(192, 57, 43, 0.4)';                      // Красный
        
        return 'rgba(52, 152, 219, 0.3)';
    };

    // Получение цвета границы для эко-рейтинга
    const getEcoBorderColor = (rating) => {
        if (!rating && rating !== 0) return '#3498db';
        
        if (rating == 1) return '#2ecc71';
        if (rating == 2) return '#f39c12';
        if (rating == 3) return '#e67e22';
        if (rating == 4) return '#e74c3c';
        if (rating == 5) return '#c0392b';
        
        return '#3498db';
    };

    // Стили для обычного слоя
    const getSimpleStyle = useCallback((feature) => {
        const isSelected = selectedDistrict?.properties?.id === feature?.properties?.id;
        return {
            color: isSelected ? '#e74c3c' : '#3498db',
            weight: isSelected ? 3 : 1.5,
            opacity: 0.9,
            fillColor: isSelected ? '#e74c3c' : '#3498db',
            fillOpacity: 0.25,
        };
    }, [selectedDistrict]);

    // Стили для экологического слоя
    const getEcoStyle = useCallback((feature) => {
        const isSelected = selectedDistrict?.properties?.id === feature?.properties?.id;
        const rating = feature.properties.rating;
        
        return {
            color: isSelected ? '#e74c3c' : getEcoBorderColor(rating),
            weight: isSelected ? 3 : 1.5,
            opacity: 0.9,
            fillColor: getEcoFillColor(rating),
            fillOpacity: 0.5,
        };
    }, [selectedDistrict]);

    // Обработчик клика по району
    const onEachFeature = useCallback((feature, layer) => {
        const name = feature.properties.name;
        const id = feature.properties.id;

        layer.on('mouseover', (e) => {
            layer.setStyle({
                color: '#f39c12',
                weight: 3,
                fillOpacity: 0.6
            });
            setHoveredDistrict(name);
            setTooltipPos({ x: e.originalEvent.clientX + 15, y: e.originalEvent.clientY + 15 });
        });

        layer.on('mousemove', (e) => {
            setTooltipPos({ x: e.originalEvent.clientX + 15, y: e.originalEvent.clientY + 15 });
        });

        layer.on('mouseout', () => {
            // Восстанавливаем стиль в зависимости от активного слоя
            if (activeLayer === 'simple' && currentLayerRef.current?.options?.style) {
                layer.setStyle(currentLayerRef.current.options.style(feature));
            } else if (activeLayer === 'eco' && currentLayerRef.current?.options?.style) {
                layer.setStyle(currentLayerRef.current.options.style(feature));
            }
            setHoveredDistrict(null);
        });

        layer.on('click', () => {
            // Создаём объект района для передачи в App
            const districtData = {
                type: 'Feature',
                id: id,
                properties: {
                    id: id,
                    name: name,
                    center: feature.properties.center ? JSON.parse(feature.properties.center) : null
                }
            };
            onSelectDistrict(districtData);
        });
    }, [activeLayer, onSelectDistrict]);

    // Отрисовка обычного слоя
    const renderSimpleLayer = useCallback(() => {
        if (!mapInstanceRef.current || !districtsSimple?.features?.length) return;

        if (currentLayerRef.current) {
            mapInstanceRef.current.removeLayer(currentLayerRef.current);
        }

        const geoJsonLayer = L.geoJSON(districtsSimple, {
            style: getSimpleStyle,
            onEachFeature: onEachFeature
        });

        geoJsonLayer.addTo(mapInstanceRef.current);
        currentLayerRef.current = geoJsonLayer;
    }, [districtsSimple, getSimpleStyle, onEachFeature]);

    // Отрисовка экологического слоя
    const renderEcoLayer = useCallback(() => {
        if (!mapInstanceRef.current || !districtsEco?.features?.length) return;

        if (currentLayerRef.current) {
            mapInstanceRef.current.removeLayer(currentLayerRef.current);
        }

        const geoJsonLayer = L.geoJSON(districtsEco, {
            style: getEcoStyle,
            onEachFeature: onEachFeature
        });

        geoJsonLayer.addTo(mapInstanceRef.current);
        currentLayerRef.current = geoJsonLayer;
    }, [districtsEco, getEcoStyle, onEachFeature]);

    // Переключение слоя
    const switchLayer = useCallback((layerType) => {
        if (layerType === 'simple') {
            renderSimpleLayer();
            setActiveLayer('simple');
        } else if (layerType === 'eco') {
            // Если эко-слой ещё не загружен, загружаем его
            if (!districtsEco?.features?.length && onLoadEcoLayer) {
                onLoadEcoLayer();
            }
            renderEcoLayer();
            setActiveLayer('eco');
        }
    }, [renderSimpleLayer, renderEcoLayer, districtsEco, onLoadEcoLayer]);

    // Загружаем обычный слой при монтировании
    useEffect(() => {
        if (mapInstanceRef.current && districtsSimple?.features?.length && !currentLayerRef.current) {
            renderSimpleLayer();
        }
    }, [districtsSimple, renderSimpleLayer]);

    // Обновляем слой при изменении выбранного района
    useEffect(() => {
        if (currentLayerRef.current && mapInstanceRef.current) {
            if (activeLayer === 'simple') {
                renderSimpleLayer();
            } else if (activeLayer === 'eco') {
                renderEcoLayer();
            }
        }
    }, [selectedDistrict, activeLayer, renderSimpleLayer, renderEcoLayer]);

    // Центрирование карты
    useEffect(() => {
        const handleCenter = (e) => {
            const district = e.detail;
            const center = district.properties.center;
            if (center && center[0] && center[1] && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([center[1], center[0]], 13, {
                    duration: 0.8
                });
            }
        };

        window.addEventListener('centerDistrict', handleCenter);
        return () => window.removeEventListener('centerDistrict', handleCenter);
    }, []);

    return (
        <div className="map-container">
            <div ref={mapRef} className="map"></div>
            
            {/* Кнопка слоёв */}
            <button 
                className="layers-button"
                onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
                title="Слои карты"
            >
                🗺️
            </button>

            {/* Панель слоёв */}
            {isLayerPanelOpen && (
                <div className="layers-panel">
                    <div className="layers-panel-header">
                        <span>Слои карты</span>
                        <button onClick={() => setIsLayerPanelOpen(false)}>✕</button>
                    </div>
                    <div className="layers-list">
                        <div 
                            className={`layer-item ${activeLayer === 'simple' ? 'active' : ''}`}
                            onClick={() => {
                                switchLayer('simple');
                                setIsLayerPanelOpen(false);
                            }}
                        >
                            <div className="layer-preview simple-preview"></div>
                            <div className="layer-info">
                                <div className="layer-name">Стандартный</div>
                                <div className="layer-desc">Границы районов Москвы</div>
                            </div>
                            {activeLayer === 'simple' && <span className="layer-checkmark">✓</span>}
                        </div>
                        <div 
                            className={`layer-item ${activeLayer === 'eco' ? 'active' : ''}`}
                            onClick={() => {
                                switchLayer('eco');
                                setIsLayerPanelOpen(false);
                            }}
                        >
                            <div className="layer-preview eco-preview"></div>
                            <div className="layer-info">
                                <div className="layer-name">Экологический</div>
                                <div className="layer-desc">Окраска по экологическому рейтингу</div>
                            </div>
                            {activeLayer === 'eco' && <span className="layer-checkmark">✓</span>}
                        </div>
                    </div>
                    {activeLayer === 'eco' && (
                        <div className="eco-legend">
                            <div className="legend-title">Экологический рейтинг</div>
                            <div className="legend-items">
                                <div className="legend-item">
                                    <div className="legend-color" style={{ background: 'rgba(46, 204, 113, 0.5)' }}></div>
                                    <span>1-3 — Хорошо</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ background: 'rgba(243, 156, 18, 0.5)' }}></div>
                                    <span>4-5 — Удовлетворительно</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ background: 'rgba(230, 126, 34, 0.5)' }}></div>
                                    <span>6-7 — Плохо</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ background: 'rgba(231, 76, 60, 0.5)' }}></div>
                                    <span>8-9 — Очень плохо</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ background: 'rgba(192, 57, 43, 0.5)' }}></div>
                                    <span>10 — Критически</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {loadingEco && activeLayer === 'eco' && (
                        <div className="layers-loading">
                            <div className="loader-small"></div>
                            <span>Загрузка экологических данных...</span>
                        </div>
                    )}
                </div>
            )}

            {hoveredDistrict && (
                <div className="custom-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    📍 {hoveredDistrict}
                </div>
            )}
            <div className="custom-attribution">
                Москва | ИКЖ в районах
            </div>
        </div>
    );
};

export default DistrictMap;