import React from 'react';
import './Loader.css';

const Loader = () => (
  <div className="loader-container">
    <div className="loader-spinner"></div>
    <p>Загрузка карты районов Москвы...</p>
    <p className="loader-subtitle">Загрузка данных из базы...</p>
  </div>
);

export default Loader;