import React, { useState } from 'react';
import Button from './Button';
import InputField from './InputField';
import TypewriterText from './TypewriterText';
import { createGarden } from '../api/gardens';
import '../styles/garden-wizard.css';

const SimpleCreateGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="garden-wizard">
      <div className="wizard-header">
        <h2>Create New Garden</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="wizard-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="wizard-form">
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
          
          <div className="wizard-actions">
            <Button 
              type="button" 
              onClick={onClose}
              variant="secondary"
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Creating...' : 'Create Garden'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleCreateGardenWizard;