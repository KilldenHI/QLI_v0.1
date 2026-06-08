import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="error-container">
    <h2>Ошибка</h2>
    <p>{message}</p>
    <button onClick={onRetry}>Перезагрузить</button>
  </div>
);

export default ErrorMessage;