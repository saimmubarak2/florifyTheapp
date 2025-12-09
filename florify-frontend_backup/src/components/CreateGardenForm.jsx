import React, { useState } from 'react';
import { createGarden } from '../api/gardens';
import Button from './Button';
import InputField from './InputField';
import './CreateGardenForm.css';

const CreateGardenForm = ({ onGardenCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Garden name and location are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await createGarden(formData);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        description: ''
      });
      
      // Notify parent component
      if (onGardenCreated) {
        onGardenCreated(response.garden);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-garden-form">
      <h2>Create New Garden</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="garden-name">Garden Name *</label>
          <InputField
            id="garden-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter garden name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="garden-location">Location *</label>
          <InputField
            id="garden-location"
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter garden location"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="garden-description">Description</label>
          <textarea
            id="garden-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter garden description (optional)"
            rows="4"
          />
        </div>
        
        <div className="form-actions">
          <Button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Creating...' : 'Create Garden'}
          </Button>
          
          {onCancel && (
            <Button 
              type="button" 
              onClick={onCancel}
              variant="secondary"
              className="cancel-button"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateGardenForm;