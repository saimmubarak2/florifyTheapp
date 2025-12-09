import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGarden, updateGarden, deleteGarden } from '../api/gardens';
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
  const [editData, setEditData] = useState({
    name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadGarden();
  }, [gardenId]);

  const loadGarden = async () => {
    try {
      setLoading(true);
      const response = await getGarden(gardenId);
      setGarden(response.garden);
      setEditData({
        name: response.garden.name,
        location: response.garden.location,
        description: response.garden.description || ''
      });
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
      location: garden.location,
      description: garden.description || ''
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await updateGarden(gardenId, editData);
      setGarden(response.garden);
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
        await deleteGarden(gardenId);
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

  return (
    <div className="garden-detail-page">
      <div className="garden-detail-container">
        <div className="garden-header">
          <h1>{garden.name}</h1>
          <div className="garden-actions">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="secondary">
                  Edit Garden
                </Button>
                <Button onClick={handleDelete} variant="danger">
                  Delete Garden
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="secondary">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="garden-content">
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
                <label htmlFor="location">Location</label>
                <InputField
                  id="location"
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter garden location"
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
              <div className="info-section">
                <h3>Location</h3>
                <p>{garden.location}</p>
              </div>
              
              {garden.description && (
                <div className="info-section">
                  <h3>Description</h3>
                  <p>{garden.description}</p>
                </div>
              )}
              
              <div className="info-section">
                <h3>Created</h3>
                <p>{new Date(garden.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="garden-footer">
          <Button onClick={() => navigate('/')} variant="secondary">
            Back to Gardens
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GardenDetailPage;