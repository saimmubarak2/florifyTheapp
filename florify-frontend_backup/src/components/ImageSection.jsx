import React, { useState, useEffect } from 'react';
import AnimatedText from './AnimatedText';

const ImageSection = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`image-section ${visible ? 'visible' : ''}`}>
      <div className="image-container">
        <div className="image-overlay">
          <AnimatedText delay={800} className="overlay-title">
            Discovering the Best<br />Furniture for Your Home
          </AnimatedText>
          <AnimatedText delay={1000} className="overlay-text">
            Our practice is Designing Complete Environments exceptional<br />
            buildings communities and place in special situations
          </AnimatedText>
          <div className="feature-badges">
            <span className="badge">✓ 100% Guarantee</span>
            <span className="badge">✓ Free delivery London area</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSection;