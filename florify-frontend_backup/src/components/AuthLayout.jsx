import React from 'react';
import Logo from './Logo';
import ImageSection from './ImageSection';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <Logo />
        <div className="form-container">
          {children}
        </div>
      </div>
      <ImageSection />
    </div>
  );
};

export default AuthLayout;