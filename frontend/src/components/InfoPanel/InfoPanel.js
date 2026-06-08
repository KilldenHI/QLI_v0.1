import React, { useEffect, useState } from 'react';
import AboutTab from './tabs/AboutTab';
import EcologyTab from './tabs/EcologyTab';
import TransportTab from './tabs/TransportTab';
import './InfoPanel.css';

function InfoPanel({ district, loading, error, onClose, onCenter }) {
    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (loading) {
        return (
            <div className="info-panel">
                <div className="panel-header">
                    <button className="panel-close-btn" onClick={onClose}>✕</button>
                    <div className="panel-title">
                        <h2>Загрузка...</h2>
                    </div>
                </div>
                <div className="panel-loading">
                    <div className="loader-spinner-small"></div>
                    <p>Загрузка информации о районе...</p>
                </div>
            </div>
        );
    }

    if (error || !district) {
        return (
            <div className="info-panel">
                <div className="panel-header">
                    <button className="panel-close-btn" onClick={onClose}>✕</button>
                    <div className="panel-title">
                        <h2>Ошибка</h2>
                    </div>
                </div>
                <div className="panel-error">
                    <p>{error || 'Не удалось загрузить информацию о районе'}</p>
                    <button className="btn-secondary" onClick={onClose}>Закрыть</button>
                </div>
            </div>
        );
    }

    return (
        <div className="info-panel">
            <div className="panel-header">
                <button className="panel-close-btn" onClick={onClose}>✕</button>
                <div className="panel-title">
                    <h2>{district.properties.name}</h2>
                    <span className="panel-badge">ID: {district.properties.id}</span>
                </div>
            </div>

            <div className="panel-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                    onClick={() => setActiveTab('about')}
                >
                    О районе
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'ecology' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ecology')}
                >
                    Экология
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transport')}
                >
                    Транспорт
                </button>
            </div>

            <div className="panel-content">
                {activeTab === 'about' && (
                    <AboutTab district={district} />
                )}
                {activeTab === 'ecology' && (
                    <EcologyTab district={district} />
                )}
                {activeTab === 'transport' && (
                    <TransportTab district={district} />
                )}
            </div>

            <div className="panel-footer">
                <button className="btn-primary" onClick={onCenter}>
                    Центрировать на карте
                </button>
                <button className="btn-secondary" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </div>
    );
}

export default InfoPanel;