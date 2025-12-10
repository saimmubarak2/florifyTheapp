import React from 'react';
import '../styles/garden-card.css';

const GardenCard = ({ garden, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get thumbnail from PNG with skin or fall back to imageUrl
  const getThumbnail = () => {
    if (garden.pngWithSkin) {
      return garden.pngWithSkin;
    }
    if (garden.imageUrl) {
      return garden.imageUrl;
    }
    return null;
  };

  const thumbnail = getThumbnail();
  const location = garden.city || garden.location || 'Location not set';

  return (
    <div className="garden-card" onClick={onClick}>
      <div className="garden-image-container">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={garden.name}
            className="garden-image"
          />
        ) : (
          <div className="garden-placeholder">
            <span className="placeholder-icon">🏠</span>
            <span className="placeholder-text">Floorplan</span>
          </div>
        )}
        <div className="garden-overlay">
          <span className="view-garden">View Details →</span>
        </div>
      </div>
      
      <div className="garden-info">
        <h4 className="garden-name">{garden.name}</h4>
        <p className="garden-location">📍 {location}</p>
        <p className="garden-date">Created {formatDate(garden.createdAt)}</p>
        
        {garden.description && (
          <p className="garden-description">
            {garden.description.length > 60 
              ? garden.description.substring(0, 60) + '...' 
              : garden.description}
          </p>
        )}
        
        <div className="garden-stats">
          {garden.measurements?.shapeCounts ? (
            <>
              <div className="stat-item">
                <span className="stat-label">Elements</span>
                <span className="stat-value">{garden.measurements.shapeCounts.total || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Type</span>
                <span className="stat-value status-active">
                  Floorplan
                </span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GardenCard;
