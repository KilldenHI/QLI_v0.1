import React, { useState } from 'react';

const AboutTab = ({ district }) => {
    const props = district.properties;
    const infra = props.infrastructure || {};
    const qualityComponents = props.quality_components || {};
    
    const [showLeisureTooltip, setShowLeisureTooltip] = useState(false);
    const [showCrimeTooltip, setShowCrimeTooltip] = useState(false);
    const [showQualityTooltip, setShowQualityTooltip] = useState(false);

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '—';
        return num.toLocaleString();
    };

    const getCrimeColor = (crime) => {
        if (crime === undefined || crime === null) return '#5f6368';
        if (crime <= 5) return '#2e7d64';
        if (crime <= 10) return '#f9a825';
        if (crime <= 15) return '#ef6c00';
        return '#d84315';
    };

    const getCrimeText = (crime) => {
        if (crime === undefined || crime === null) return 'Нет данных';
        if (crime <= 5) return 'Низкий';
        if (crime <= 10) return 'Средний';
        if (crime <= 15) return 'Повышенный';
        return 'Высокий';
    };

    const getQualityColor = (index) => {
        if (index === undefined || index === null) return '#5f6368';
        if (index >= 80) return '#1a73e8';
        if (index >= 60) return '#2e7d64';
        if (index >= 40) return '#f9a825';
        if (index >= 20) return '#ef6c00';
        return '#d84315';
    };

    const getQualityText = (index) => {
        if (index === undefined || index === null) return 'Нет данных';
        if (index >= 80) return 'Отличное качество жизни';
        if (index >= 60) return 'Хорошее качество жизни';
        if (index >= 40) return 'Удовлетворительное качество жизни';
        if (index >= 20) return 'Низкое качество жизни';
        return 'Критическое качество жизни';
    };

    return (
        <div className="tab-content about-tab">
            {/* Общая информация */}
            <section className="info-card">
                <h3>Общая информация</h3>
                <p className="district-description">
                    {props.smolInf || 'Информация о районе будет добавлена позже'}
                </p>
            </section>

            {/* Индекс качества жизни */}
            {props.final_index !== undefined && props.final_index !== null && (
                <section className="quality-card">
                    <div className="quality-header">
                        <div className="quality-title">
                            <span className="material-icons quality-icon">analytics</span>
                            <h3>Индекс качества жизни</h3>
                            <span 
                                className="info-icon quality-info-icon"
                                onMouseEnter={() => setShowQualityTooltip(true)}
                                onMouseLeave={() => setShowQualityTooltip(false)}
                            >
                                ?
                                {showQualityTooltip && (
                                    <span className="tooltip quality-tooltip">
                                        Комплексный показатель, учитывающий:
                                        <br />• Экологическую ситуацию
                                        <br />• Транспортную доступность
                                        <br />• Уровень преступности
                                        <br />• Развитие инфраструктуры
                                        <br />• Социальные объекты
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="quality-value-container">
                            <div className="quality-circle" style={{ borderColor: getQualityColor(props.final_index) }}>
                                <div className="quality-number">{props.final_index}</div>
                                <div className="quality-max">из 100</div>
                            </div>
                            <div className="quality-status" style={{ color: getQualityColor(props.final_index) }}>
                                {getQualityText(props.final_index)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="quality-methodology">
                        <span className="material-icons methodology-icon">description</span>
                        <span className="methodology-text">
                            Подробную методологию расчёта Индекса качества жизни можно скачать по ссылке:
                        </span>
                        <a 
                            href="/methodology.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="methodology-link"
                            download="МЕТОДОЛОГИЯ РАСЧЁТА ИНДЕКСА КАЧЕСТВА ЖИЗНИ.pdf"
                        >
                            Скачать методологию (PDF)
                        </a>
                    </div>
                </section>
            )}

            {/* Инфраструктура */}
            <section className="info-card">
                <h3>Инфраструктура</h3>
                <div className="infra-stats">
                    <div className="infra-item">
                        <span className="material-icons infra-icon">subway</span>
                        <div className="infra-info">
                            <span className="infra-label">Входы метро</span>
                            <span className="infra-value">{formatNumber(infra.metro_exits)}</span>
                        </div>
                    </div>

                    <div className="infra-item">
                        <span className="material-icons infra-icon">local_hospital</span>
                        <div className="infra-info">
                            <span className="infra-label">Медицинские учреждения</span>
                            <span className="infra-value">{formatNumber(infra.med_institutions)}</span>
                        </div>
                    </div>

                    <div className="infra-item">
                        <span className="material-icons infra-icon">school</span>
                        <div className="infra-info">
                            <span className="infra-label">Школы</span>
                            <span className="infra-value">{formatNumber(infra.schools)}</span>
                        </div>
                    </div>

                    <div className="infra-item">
                        <span className="material-icons infra-icon">local_activity</span>
                        <div className="infra-info">
                            <span className="infra-label">
                                Точки досуга
                                <span 
                                    className="info-icon"
                                    onMouseEnter={() => setShowLeisureTooltip(true)}
                                    onMouseLeave={() => setShowLeisureTooltip(false)}
                                >
                                    ?
                                    {showLeisureTooltip && (
                                        <span className="tooltip infra-tooltip">
                                            Включает:
                                            <br />• Спортивные площадки
                                            <br />• Кинотеатры
                                            <br />• Музеи
                                            <br />• Театры
                                            <br />• Аттракционы
                                            <br />• Библиотеки
                                        </span>
                                    )}
                                </span>
                            </span>
                            <span className="infra-value">{formatNumber(infra.leisure_facilities)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Безопасность */}
            <section className="info-card">
                <h3>Безопасность</h3>
                
                <div className="crime-item">
                    <div className="crime-header">
                        <span className="material-icons crime-icon">gavel</span>
                        <span className="crime-label">
                            Уровень преступности
                            <span 
                                className="info-icon"
                                onMouseEnter={() => setShowCrimeTooltip(true)}
                                onMouseLeave={() => setShowCrimeTooltip(false)}
                            >
                                ?
                                {showCrimeTooltip && (
                                    <span className="tooltip crime-tooltip">
                                        Количество преступлений на 1000 человек<br />
                                        *Данные за весь административный округ
                                    </span>
                                )}
                            </span>
                        </span>
                    </div>
                    <div className="crime-value">
                        <span 
                            className="crime-number" 
                            style={{ color: getCrimeColor(infra.crime_per_1000) }}
                        >
                            {formatNumber(infra.crime_per_1000)}
                        </span>
                        <span className="crime-unit">преступлений на 1000 чел</span>
                    </div>
                    <div className="crime-status" style={{ color: getCrimeColor(infra.crime_per_1000) }}>
                        {getCrimeText(infra.crime_per_1000)} уровень
                    </div>
                </div>
            </section>

            {/* Расположение */}
            <section className="info-card">
                <h3>Расположение</h3>
                <p>Город Москва, Российская Федерация</p>
                {props.center && props.center[0] && props.center[1] && (
                    <div className="coordinates">
                        <span className="coord-label">Центр:</span>
                        <code>
                            {props.center[1].toFixed(4)}° с.ш., {props.center[0].toFixed(4)}° в.д.
                        </code>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AboutTab;