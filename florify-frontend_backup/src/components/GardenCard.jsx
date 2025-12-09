import React from 'react';
import '../styles/garden-card.css';

const GardenCard = ({ garden, onClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="garden-card" onClick={onClick}>
      <div className="garden-image-container">
        {garden.imageUrl ? (
          <img 
            src={garden.imageUrl} 
            alt={garden.name}
            className="garden-image"
          />
        ) : (
          <div className="garden-placeholder">
            <span className="placeholder-icon">🌱</span>
          </div>
        )}
        <div className="garden-overlay">
          <span className="view-garden">View Garden →</span>
        </div>
      </div>
      
      <div className="garden-info">
        <h4 className="garden-name">{garden.name}</h4>
        <p className="garden-location">📍 {garden.location}</p>
        <p className="garden-date">Created {formatDate(garden.createdAt)}</p>
        
        <div className="garden-stats">
          <div className="stat-item">
            <span className="stat-label">Plants</span>
            <span className="stat-value">{garden.plantCount || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className={`stat-value status-${garden.status || 'active'}`}>
              {garden.status || 'Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenCard;