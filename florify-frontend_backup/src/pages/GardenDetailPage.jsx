import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGardenFromLocal, updateGardenInLocal, deleteGardenFromLocal, downloadGardenImage } from '../utils/localDatabase';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './GardenDetailPage.css';

// Pakistan cities for the dropdown
const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala',
  'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta',
  'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat',
  'Sahiwal', 'Wah Cantonment', 'Mardan', 'Kasur', 'Okara',
  'Mingora', 'Nawabshah', 'Chiniot', 'Kotri', 'Kamoke',
  'Hafizabad', 'Sadiqabad', 'Mirpur Khas', 'Burewala', 'Kohat',
  'Khanewal', 'Dera Ismail Khan', 'Turbat', 'Muzaffargarh', 'Abbottabad',
  'Mandi Bahauddin', 'Shikarpur', 'Jacobabad', 'Jhelum', 'Khanpur',
  'Khairpur', 'Khuzdar', 'Pakpattan', 'Hub', 'Daska'
];

const GardenDetailPage = () => {
  const { gardenId } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState('skinned');
  const [editData, setEditData] = useState({
    name: '',
    city: '',
    description: ''
  });

  useEffect(() => {
    loadGarden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gardenId]);

  const loadGarden = () => {
    try {
      setLoading(true);
      const gardenData = getGardenFromLocal(gardenId);
      
      if (gardenData) {
        setGarden(gardenData);
        setEditData({
          name: gardenData.name,
          city: gardenData.city || gardenData.location || '',
          description: gardenData.description || ''
        });
      } else {
        setError('Garden not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: garden.name,
      city: garden.city || garden.location || '',
      description: garden.description || ''
    });
  };

  const handleSave = () => {
    try {
      setLoading(true);
      const updatedGarden = updateGardenInLocal(gardenId, editData);
      setGarden(updatedGarden);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this garden?')) {
      try {
        setLoading(true);
        deleteGardenFromLocal(gardenId);
        navigate('/');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadImage = (type) => {
    try {
      downloadGardenImage(garden, type);
    } catch (err) {
      alert('Failed to download image: ' + err.message);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="garden-detail-page">
        <div className="loading">Loading garden details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="garden-detail-page">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="garden-detail-page">
        <div className="error">
          <h2>Garden Not Found</h2>
          <p>The garden you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const measurements = garden.measurements || {};

  return (
    <div className="garden-detail-page">
      <div className="garden-detail-container">
        <div className="garden-header">
          <div className="header-content">
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back
            </button>
            <h1>{garden.name}</h1>
            <span className="garden-city">📍 {garden.city || garden.location}</span>
          </div>
          <div className="garden-actions">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} className="edit-btn">
                  ✏️ Edit
                </Button>
                <Button onClick={handleDelete} className="delete-btn">
                  🗑️ Delete
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading} className="save-btn">
                  {loading ? 'Saving...' : '💾 Save'}
                </Button>
                <Button onClick={handleCancel} className="cancel-btn">
                  ❌ Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="garden-content edit-mode">
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="name">Garden Name *</label>
                <InputField
                  id="name"
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter garden name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  className="city-select"
                  value={editData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                >
                  <option value="">Select a city...</option>
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter garden description"
                  rows="4"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="garden-content">
            {/* Floorplan Images Section */}
            {(garden.skinnedPNG || garden.nonSkinnedPNG) && (
              <div className="floorplan-section">
                <h2>🏡 Garden Floorplan</h2>
                
                <div className="image-tabs">
                  <button 
                    className={`tab-btn ${activeImageTab === 'skinned' ? 'active' : ''}`}
                    onClick={() => setActiveImageTab('skinned')}
                  >
                    🎨 Styled View
                  </button>
                  <button 
                    className={`tab-btn ${activeImageTab === 'nonskinned' ? 'active' : ''}`}
                    onClick={() => setActiveImageTab('nonskinned')}
                  >
                    📐 Blueprint View
                  </button>
                </div>

                <div className="floorplan-image-container">
                  {activeImageTab === 'skinned' && garden.skinnedPNG ? (
                    <img 
                      src={garden.skinnedPNG} 
                      alt={`${garden.name} - Styled View`}
                      className="floorplan-image"
                    />
                  ) : garden.nonSkinnedPNG ? (
                    <img 
                      src={garden.nonSkinnedPNG} 
                      alt={`${garden.name} - Blueprint View`}
                      className="floorplan-image"
                    />
                  ) : (
                    <div className="no-image">No image available</div>
                  )}
                </div>

                <div className="download-buttons">
                  {garden.skinnedPNG && (
                    <Button 
                      onClick={() => handleDownloadImage('skinned')}
                      className="download-btn"
                    >
                      📥 Download Styled Image
                    </Button>
                  )}
                  {garden.nonSkinnedPNG && (
                    <Button 
                      onClick={() => handleDownloadImage('nonskinned')}
                      className="download-btn"
                    >
                      📥 Download Blueprint
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Measurements Section */}
            {(measurements.bottomBoundaryDistance || measurements.drivewayDistanceFromWall) && (
              <div className="measurements-section">
                <h2>📏 Extracted Measurements</h2>
                <div className="measurements-grid">
                  {measurements.bottomBoundaryDistance && (
                    <div className="measurement-card">
                      <div className="measurement-icon">🏠↔️🧱</div>
                      <div className="measurement-label">Building to Bottom Boundary</div>
                      <div className="measurement-value">
                        {measurements.bottomBoundaryDistance} mm
                      </div>
                      <div className="measurement-converted">
                        ≈ {(measurements.bottomBoundaryDistance / 10).toFixed(1)} cm
                        ≈ {(measurements.bottomBoundaryDistance / 304.8).toFixed(2)} ft
                      </div>
                    </div>
                  )}
                  
                  {measurements.drivewayDistanceFromWall && (
                    <div className="measurement-card">
                      <div className="measurement-icon">🚗↔️🧱</div>
                      <div className="measurement-label">
                        Driveway ({measurements.drivewayPosition}) to {measurements.drivewayPosition === 'left' ? 'Right' : 'Left'} Wall
                      </div>
                      <div className="measurement-value">
                        {measurements.drivewayDistanceFromWall} mm
                      </div>
                      <div className="measurement-converted">
                        ≈ {(measurements.drivewayDistanceFromWall / 10).toFixed(1)} cm
                        ≈ {(measurements.drivewayDistanceFromWall / 304.8).toFixed(2)} ft
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Garden Info Section */}
            <div className="info-section">
              <h2>📋 Garden Details</h2>
              
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-label">Location</span>
                  <span className="info-value">{garden.city || garden.location}</span>
                </div>
                
                <div className="info-card">
                  <span className="info-label">Created</span>
                  <span className="info-value">
                    {new Date(garden.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="info-card">
                  <span className="info-label">Elements Drawn</span>
                  <span className="info-value">
                    {garden.blueprintData?.shapes?.length || 0} shapes
                  </span>
                </div>
              </div>
              
              {garden.description && (
                <div className="description-section">
                  <h3>Description</h3>
                  <p>{garden.description}</p>
                </div>
              )}
            </div>

            {/* Blueprint Data Section */}
            {garden.blueprintData && garden.blueprintData.shapes.length > 0 && (
              <div className="blueprint-data-section">
                <h2>🗺️ Blueprint Elements</h2>
                <div className="elements-grid">
                  <div className="element-card buildings">
                    <span className="element-icon">🏠</span>
                    <span className="element-label">Buildings</span>
                    <span className="element-count">
                      {garden.blueprintData.shapes.filter(s => s.role === 'building').length}
                    </span>
                  </div>
                  <div className="element-card pathways">
                    <span className="element-icon">🛤️</span>
                    <span className="element-label">Pathways</span>
                    <span className="element-count">
                      {garden.blueprintData.shapes.filter(s => s.role === 'pathway').length}
                    </span>
                  </div>
                  <div className="element-card boundaries">
                    <span className="element-icon">🧱</span>
                    <span className="element-label">Boundaries</span>
                    <span className="element-count">
                      {garden.blueprintData.shapes.filter(s => s.role === 'boundary').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="garden-footer">
          <Button onClick={() => navigate('/')} className="back-btn">
            ← Back to Gardens
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GardenDetailPage;
