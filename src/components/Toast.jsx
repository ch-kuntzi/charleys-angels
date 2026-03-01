import React from 'react';

const Toast = ({ toasts }) => {
  return (
    <div className="toast-container">
      {toasts.map(({ id, message, type }) => (
        <div key={id} className={`toast ${type}`}>
          {message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
