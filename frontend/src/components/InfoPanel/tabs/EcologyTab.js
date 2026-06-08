import React, { useState } from 'react';

const EcologyTab = ({ district }) => {
    const props = district.properties;
    const eco = props.ecoRating || {};
    const [showTooltip, setShowTooltip] = useState(false);

    const getScoreColor = (score) => {
        if (!score && score !== 0) return '#6c757d';
        if (score >= 1 && score <= 3) return '#2e7d64';
        if (score >= 4 && score <= 5) return '#f9a825';
        if (score >= 6 && score <= 7) return '#ef6c00';
        if (score >= 8 && score <= 9) return '#d84315';
        if (score >= 10) return '#b71c1c';
        return '#6c757d';
    };

    const getBackgroundColor = (score) => {
        if (!score && score !== 0) return '#f1f3f4';
        if (score >= 1 && score <= 3) return 'rgba(46, 125, 100, 0.1)';
        if (score >= 4 && score <= 5) return 'rgba(249, 168, 37, 0.1)';
        if (score >= 6 && score <= 7) return 'rgba(239, 108, 0, 0.1)';
        if (score >= 8 && score <= 9) return 'rgba(216, 67, 21, 0.1)';
        if (score >= 10) return 'rgba(183, 28, 28, 0.1)';
        return '#f1f3f4';
    };

    const getSituationColor = (situation) => {
        if (!situation) return '#5f6368';
        if (situation.toLowerCase().includes('оптимальн')) return '#2e7d64';
        if (situation.toLowerCase().includes('благоприят')) return '#2e7d64';
        if (situation.toLowerCase().includes('хорош')) return '#2e7d64';
        if (situation.toLowerCase().includes('приемлем')) return '#f9a825';
        if (situation.toLowerCase().includes('плох')) return '#ef6c00';
        if (situation.toLowerCase().includes('критич')) return '#d84315';
        return '#5f6368';
    };

    const criteria = [
        { label: 'Плотность населения', value: eco.density_population, key: 'density_population' },
        { label: 'Загруженность шоссе', value: eco.highway_congestion, key: 'highway_congestion' },
        { label: 'Площадь зеленых насаждений', value: eco.green_area, key: 'green_area' },
        { label: 'Влияние объектов негативного воздействия', value: eco.negative_objects, key: 'negative_objects' },
        { label: 'Сотовые вышки', value: eco.cell_towers, key: 'cell_towers' },
        { label: 'Дополнительный балл', value: eco.dop_ball, key: 'dop_ball' }
    ];

    const validCriteria = criteria.filter(c => c.value !== undefined && c.value !== null);

    return (
        <div className="tab-content ecology-tab">
            <div className="eco-header-title">
                <span className="eco-district-number">#{props.id}</span>
                <span className="eco-district-name">{props.name}</span>
            </div>

            <div className="eco-status-block">
                <span className="eco-status-label">Экологическая обстановка</span>
                <span 
                    className="eco-status-value" 
                    style={{ color: getSituationColor(eco.situation), fontWeight: 600 }}
                >
                    "{eco.situation || 'Нет данных'}"
                </span>
            </div>

            <p className="eco-description">
                Каждый фактор воздействия имеет свой коэффициент. Чем сильнее параметр влияет на экологию района, тем больше его вес в итоговой оценке.
            </p>

            <div className="color-scale">
                <div className="scale-bar">
                    <div className="scale-segment scale-1-3" title="1-3: Хорошо">1-3</div>
                    <div className="scale-segment scale-4-5" title="4-5: Удовлетворительно">4-5</div>
                    <div className="scale-segment scale-6-7" title="6-7: Плохо">6-7</div>
                    <div className="scale-segment scale-8-9" title="8-9: Очень плохо">8-9</div>
                    <div className="scale-segment scale-10" title="10: Критически">10</div>
                </div>
                <div className="scale-labels">
                    <span>Хорошо</span>
                    <span>Удовлетворительно</span>
                    <span>Плохо</span>
                    <span>Очень плохо</span>
                    <span>Критически</span>
                </div>
            </div>

            <div className="average-score-container">
                <div 
                    className="average-score-circle" 
                    style={{ 
                        borderColor: getScoreColor(eco.average_ball),
                        background: `radial-gradient(circle at 30% 30%, ${getBackgroundColor(eco.average_ball)}80, transparent)`
                    }}
                >
                    <div className="average-score-value" style={{ color: getScoreColor(eco.average_ball) }}>
                        {eco.average_ball || '—'}
                    </div>
                    <div className="average-score-label">средний балл</div>
                </div>
                <div className="average-score-note">
                    Средневзвешенная оценка<br />
                    экологической ситуации<br />
                </div>
            </div>

            <h3 className="criteria-title">Ключевые критерии оценки</h3>

            <div className="criteria-list-simple">
                {validCriteria.map((criterion, index) => (
                    <div key={index} className="criterion-row">
                        <div 
                            className="criterion-circle"
                            style={{
                                backgroundColor: getBackgroundColor(criterion.value),
                                borderColor: getScoreColor(criterion.value)
                            }}
                        >
                            <span 
                                className="criterion-value-bold"
                                style={{ color: getScoreColor(criterion.value) }}
                            >
                                {criterion.value}
                            </span>
                        </div>
                        <span className="criterion-label-text">
                            {criterion.label}
                            {criterion.key === 'dop_ball' && (
                                <span 
                                    className="info-icon"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                >
                                    ?
                                    {showTooltip && (
                                        <span className="tooltip">
                                            Рассчитывается по совокупности:
                                            <br />• Водоемы
                                            <br />• Велосипедные парковки
                                            <br />• Спортивные площадки
                                            <br />• Места накопления отходов
                                        </span>
                                    )}
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            <div className="data-source">
                <span className="material-icons data-source-icon">link</span>
                <span className="data-source-text">
                    Данные взяты с портала{' '}
                    <a 
                        href="https://ecostandardgroup.ru/center/ecorating/moscow/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="data-source-link"
                    >
                        ecostandardgroup.ru
                    </a>
                </span>
            </div>
        </div>
    );
};

export default EcologyTab;