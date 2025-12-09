import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import LandingPage from './pages/LandingPage';
import GardenDetailPage from './pages/GardenDetailPage';
import BlueprintTestPage from './components/EmptyGardenWizard/BlueprintTestPage';
import DrawingTest from './components/EmptyGardenWizard/DrawingTest';
import SimpleDrawingTest from './components/EmptyGardenWizard/SimpleDrawingTest';
import SectionedDrawingTest from './components/EmptyGardenWizard/SectionedDrawingTest';
import ImageDownloadTest from './components/EmptyGardenWizard/ImageDownloadTest';

function App() {
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (email) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUserEmail('');
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <SignupPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/confirm" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <EmailConfirmationPage />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <LandingPage onLogout={handleLogout} userEmail={userEmail} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/garden/:gardenId" 
          element={
            isAuthenticated ? 
            <GardenDetailPage /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/test-blueprint" 
          element={<BlueprintTestPage />} 
        />
        <Route 
          path="/test-drawing" 
          element={<DrawingTest />} 
        />
        <Route 
          path="/simple-drawing" 
          element={<SimpleDrawingTest />} 
        />
        <Route 
          path="/sectioned-drawing" 
          element={<SectionedDrawingTest />} 
        />
        <Route 
          path="/image-download" 
          element={<ImageDownloadTest />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
