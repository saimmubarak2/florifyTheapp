import React from 'react';

const Button = ({ children, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      className="primary-button"
      disabled={disabled}
    >
      <span>{children}</span>
    </button>
  );
};

export default Button;