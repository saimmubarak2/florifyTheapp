import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGardenById, updateGardenLocally, deleteGardenLocally } from '../services/localStorageService';
import { formatMeasurements } from '../utils/floorplanMeasurements';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './GardenDetailPage.css';

const GardenDetailPage = () => {
  const { gardenId } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState({
    name: '',
    city: '',
    description: ''
  });

  useEffect(() => {
    loadGarden();
  }, [gardenId]);

  const loadGarden = async () => {
    try {
      setLoading(true);
      const gardenData = getGardenById(gardenId);
      if (gardenData) {
        setGarden(gardenData);
        setEditData({
          name: gardenData.name,
          city: gardenData.city || '',
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
      city: garden.city || '',
      description: garden.description || ''
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedGarden = updateGardenLocally(gardenId, editData);
      setGarden(updatedGarden);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this garden?')) {
      try {
        setLoading(true);
        deleteGardenLocally(gardenId);
        navigate('/');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formattedMeasurements = garden.measurements ? formatMeasurements(garden.measurements) : [];

  return (
    <div className="garden-detail-page">
      <div className="garden-detail-container">
        <div className="garden-header">
          <div className="header-left">
            <Button onClick={() => navigate('/')} variant="secondary" className="back-btn">
              ← Back
            </Button>
            <div className="header-title">
              <h1>{garden.name}</h1>
              {garden.city && <span className="location-badge">📍 {garden.city}</span>}
            </div>
          </div>
          <div className="garden-actions">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="secondary">
                  ✏️ Edit
                </Button>
                <Button onClick={handleDelete} variant="danger">
                  🗑️ Delete
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save'}
                </Button>
                <Button onClick={handleCancel} variant="secondary">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'floorplan' ? 'active' : ''}`}
            onClick={() => setActiveTab('floorplan')}
          >
            🏠 Floorplan
          </button>
          <button 
            className={`tab-btn ${activeTab === 'measurements' ? 'active' : ''}`}
            onClick={() => setActiveTab('measurements')}
          >
            📏 Measurements
          </button>
          <button 
            className={`tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloads')}
          >
            📥 Downloads
          </button>
        </div>

        <div className="garden-content">
          {activeTab === 'overview' && (
            <>
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="name">Garden Name</label>
                    <InputField
                      id="name"
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter garden name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <InputField
                      id="city"
                      type="text"
                      value={editData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
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
              ) : (
                <div className="garden-info">
                  <div className="info-grid">
                    <div className="info-card">
                      <div className="info-icon">📍</div>
                      <div className="info-content">
                        <h3>Location</h3>
                        <p>{garden.city || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">📅</div>
                      <div className="info-content">
                        <h3>Created</h3>
                        <p>{new Date(garden.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">🏠</div>
                      <div className="info-content">
                        <h3>Elements</h3>
                        <p>{garden.measurements?.shapeCounts?.total || 0} shapes</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">📐</div>
                      <div className="info-content">
                        <h3>Type</h3>
                        <p>Floorplan</p>
                      </div>
                    </div>
                  </div>
                  
                  {garden.description && (
                    <div className="info-section description-section">
                      <h3>Description</h3>
                      <p>{garden.description}</p>
                    </div>
                  )}

                  {/* Preview thumbnail */}
                  {garden.pngWithSkin && (
                    <div className="preview-section">
                      <h3>Preview</h3>
                      <div className="preview-image-container">
                        <img 
                          src={garden.pngWithSkin} 
                          alt="Garden floorplan preview" 
                          className="preview-image"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'floorplan' && (
            <div className="floorplan-section">
              <h2>🏠 Floorplan Views</h2>
              
              <div className="floorplan-grid">
                <div className="floorplan-card">
                  <h3>With Skin (Presentation View)</h3>
                  <p>Complete view with legend, title, and visual enhancements</p>
                  {garden.pngWithSkin ? (
                    <div className="floorplan-image-container">
                      <img 
                        src={garden.pngWithSkin} 
                        alt="Floorplan with skin" 
                        className="floorplan-image"
                      />
                    </div>
                  ) : (
                    <div className="no-image">No image available</div>
                  )}
                </div>
                
                <div className="floorplan-card">
                  <h3>Without Skin (Raw View)</h3>
                  <p>Clean view with just the colored lines (for technical use)</p>
                  {garden.pngWithoutSkin ? (
                    <div className="floorplan-image-container">
                      <img 
                        src={garden.pngWithoutSkin} 
                        alt="Floorplan without skin" 
                        className="floorplan-image"
                      />
                    </div>
                  ) : (
                    <div className="no-image">No image available</div>
                  )}
                </div>
              </div>
              
              <div className="legend-section">
                <h3>Legend</h3>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
                    <span>Buildings</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#7f8c8d' }}></span>
                    <span>Pathways / Driveway</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#8e44ad' }}></span>
                    <span>Boundary Walls</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'measurements' && (
            <div className="measurements-section">
              <h2>📏 Extracted Measurements</h2>
              <p className="section-description">
                These measurements are automatically extracted from your floorplan drawing.
              </p>
              
              {formattedMeasurements.length > 0 ? (
                <div className="measurements-grid">
                  {formattedMeasurements.map((item, index) => (
                    <div key={index} className="measurement-card">
                      <div className="measurement-label">{item.label}</div>
                      <div className="measurement-value">{item.value}</div>
                      {item.valueMM && (
                        <div className="measurement-raw">{item.valueMM}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-measurements">
                  <p>No measurements available. Draw buildings, pathways, and boundary walls to see extracted measurements.</p>
                </div>
              )}
              
              {garden.measurements?.shapeCounts && (
                <div className="shape-counts">
                  <h3>Shape Counts</h3>
                  <div className="counts-grid">
                    <div className="count-item">
                      <span className="count-value">{garden.measurements.shapeCounts.buildings}</span>
                      <span className="count-label">Buildings</span>
                    </div>
                    <div className="count-item">
                      <span className="count-value">{garden.measurements.shapeCounts.pathways}</span>
                      <span className="count-label">Pathways</span>
                    </div>
                    <div className="count-item">
                      <span className="count-value">{garden.measurements.shapeCounts.boundaries}</span>
                      <span className="count-label">Boundaries</span>
                    </div>
                    <div className="count-item">
                      <span className="count-value">{garden.measurements.shapeCounts.total}</span>
                      <span className="count-label">Total</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="downloads-section">
              <h2>📥 Download Options</h2>
              
              <div className="download-cards">
                <div className="download-card">
                  <div className="download-icon">🖼️</div>
                  <h3>Floorplan with Skin</h3>
                  <p>High-quality PNG with legend, title, and visual enhancements. Perfect for presentations.</p>
                  <Button 
                    onClick={() => downloadImage(garden.pngWithSkin, `${garden.name}-floorplan-full.png`)}
                    disabled={!garden.pngWithSkin}
                  >
                    Download PNG
                  </Button>
                </div>
                
                <div className="download-card">
                  <div className="download-icon">📐</div>
                  <h3>Floorplan (Raw)</h3>
                  <p>Clean PNG with just the colored lines. Ideal for technical documentation.</p>
                  <Button 
                    onClick={() => downloadImage(garden.pngWithoutSkin, `${garden.name}-floorplan-raw.png`)}
                    disabled={!garden.pngWithoutSkin}
                  >
                    Download PNG
                  </Button>
                </div>
                
                <div className="download-card">
                  <div className="download-icon">📋</div>
                  <h3>Garden Data (JSON)</h3>
                  <p>Export all garden data including measurements in JSON format.</p>
                  <Button 
                    onClick={() => {
                      const dataStr = JSON.stringify(garden, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      downloadImage(url, `${garden.name}-data.json`);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download JSON
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GardenDetailPage;
