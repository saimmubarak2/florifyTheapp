import React from 'react';
import '../styles/garden-card.css';

const GardenCard = ({ garden, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine the image to show (skinned PNG or imageUrl)
  const imageSource = garden.skinnedPNG || garden.imageUrl;
  
  // Get location (city or location field)
  const locationDisplay = garden.city || garden.location || 'Unknown Location';

  // Get measurements if available
  const measurements = garden.measurements || {};

  return (
    <div className="garden-card" onClick={onClick}>
      <div className="garden-image-container">
        {imageSource ? (
          <img 
            src={imageSource} 
            alt={garden.name}
            className="garden-image"
          />
        ) : (
          <div className="garden-placeholder">
            <span className="placeholder-icon">🏡</span>
          </div>
        )}
        <div className="garden-overlay">
          <span className="view-garden">View Garden →</span>
        </div>
        {garden.skinnedPNG && (
          <div className="blueprint-badge">📐 Floorplan</div>
        )}
      </div>
      
      <div className="garden-info">
        <h4 className="garden-name">{garden.name}</h4>
        <p className="garden-location">📍 {locationDisplay}</p>
        {garden.description && (
          <p className="garden-description">{garden.description.substring(0, 60)}{garden.description.length > 60 ? '...' : ''}</p>
        )}
        <p className="garden-date">Created {formatDate(garden.createdAt)}</p>
        
        {(measurements.buildingToBottomBoundary !== undefined || measurements.plotWidth !== undefined) && (
          <div className="garden-measurements">
            {measurements.plotWidth && measurements.plotHeight && (
              <div className="measurement-item">
                <span className="measurement-icon">📐</span>
                <span className="measurement-text">
                  Plot: {measurements.plotWidth.toFixed(0)} × {measurements.plotHeight.toFixed(0)} ft
                </span>
              </div>
            )}
            {measurements.buildingToBottomBoundary !== null && (
              <div className="measurement-item">
                <span className="measurement-icon">🏠</span>
                <span className="measurement-text">
                  {measurements.buildingToBottomBoundary.toFixed(1)} ft to boundary
                </span>
              </div>
            )}
            {measurements.drivewayDistanceFromOppositeWall !== null && measurements.drivewayPosition && (
              <div className="measurement-item">
                <span className="measurement-icon">🚗</span>
                <span className="measurement-text">
                  Driveway: {measurements.drivewayDistanceFromOppositeWall.toFixed(1)} ft from {measurements.drivewayPosition === 'left' ? 'right' : 'left'} wall
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="garden-stats">
          <div className="stat-item">
            <span className="stat-label">Elements</span>
            <span className="stat-value">
              {garden.floorplanData?.shapes?.length || garden.blueprintData?.shapes?.length || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className={`stat-value status-active`}>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenCard;