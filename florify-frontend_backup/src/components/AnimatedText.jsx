import React, { useState, useEffect } from 'react';

const AnimatedText = ({ children, delay = 0, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`animated-text ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedText;