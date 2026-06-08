import React, { useState, useRef, useEffect } from 'react';
import './CompactSidebar.css';

const CompactSidebar = ({ districts, selectedDistrict, onSelectDistrict, isOpen, onToggle, statsCount }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);

    const filteredDistricts = districts.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 100);
        }
    }, [isOpen]);

    const handleDistrictClick = (district) => {
        onSelectDistrict(district);
        if (window.innerWidth < 768) {
            onToggle();
        }
    };

    return (
        <>
            <button className={`sidebar-toggle ${isOpen ? 'active' : ''}`} onClick={onToggle}>
                <span className="material-icons">{isOpen ? 'close' : 'menu'}</span>
            </button>

            <div className={`compact-sidebar ${isOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="material-icons logo-icon">location_city</span>
                        <span className="logo-text">Районы Москвы</span>
                    </div>
                    <span className="stats-badge">{statsCount} районов</span>
                </div>

                <div className="search-wrapper">
                    <span className="material-icons search-icon">search</span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="search-input"
                        placeholder="Поиск района..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="material-icons search-clear" onClick={() => setSearchTerm('')}>
                            close
                        </button>
                    )}
                </div>

                <div className="districts-list">
                    {filteredDistricts.length === 0 ? (
                        <div className="no-results">
                            <span className="material-icons">search_off</span>
                            <p>Ничего не найдено</p>
                        </div>
                    ) : (
                        filteredDistricts.map(district => (
                            <div
                                key={district.id}
                                className={`district-row ${selectedDistrict?.properties?.id === district.id ? 'selected' : ''}`}
                                onClick={() => handleDistrictClick(district)}
                            >
                                <span className="district-id">#{district.id}</span>
                                <span className="district-name">{district.name}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-footer">
                    <button 
                        className="reset-btn"
                        onClick={() => onSelectDistrict(null)}
                    >
                        <span className="material-icons">layers_clear</span>
                        Сбросить выделение
                    </button>
                </div>
            </div>
        </>
    );
};

export default CompactSidebar;