import React, { useState, useEffect } from 'react';

const Logo = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`logo-container ${visible ? 'visible' : ''}`}>
      <div className="logo-box">
        <div className="logo-text">FLORIFY</div>
      </div>
    </div>
  );
};

export default Logo;