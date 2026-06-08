import React from 'react';

const TransportTab = ({ district }) => {
    const props = district.properties;

    return (
        <div className="tab-content transport-tab">
            <div className="transport-header">
                <span className="material-icons transport-icon">directions_transit</span>
                <div className="transport-title">
                    <h3>Транспортная доступность</h3>
                    <p>Информация о транспортной инфраструктуре района</p>
                </div>
            </div>

            <div className="in-development">
                <span className="material-icons dev-icon">construction</span>
                <h4>Раздел в разработке</h4>
                <p>Скоро здесь появится подробная информация о:</p>
                <ul>
                    <li>Ближайшие станции метро</li>
                    <li>Маршруты общественного транспорта</li>
                    <li>Железнодорожные станции и МЦД</li>
                    <li>Транспортная загруженность</li>
                    <li>Велоинфраструктура</li>
                    <li>Парковочные зоны</li>
                </ul>
                <div className="dev-note">
                    Мы работаем над наполнением этого раздела актуальными данными
                </div>
            </div>
        </div>
    );
};

export default TransportTab;