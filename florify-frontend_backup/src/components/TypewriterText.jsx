import React, { useState, useEffect } from 'react';

const TypewriterText = ({ 
  text, 
  delay = 0, 
  speed = 50, 
  className = '', 
  children,
  onClick 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsTyping(true);
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay, speed]);

  if (children) {
    return (
      <div 
        className={`typewriter-wrapper ${className}`}
        onClick={onClick}
        style={{ 
          opacity: isTyping ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <span 
      className={`typewriter-text ${className} ${isTyping ? 'typing' : ''}`}
      onClick={onClick}
    >
      {displayedText}
      {isTyping && <span className="cursor">|</span>}
    </span>
  );
};

export default TypewriterText;