import React, { useState } from 'react';
import Button from '../Button';
import InputField from '../InputField';
import { saveGardenToLocal, generateGardenId } from '../../utils/localDatabase';
import './IntegratedGardenWizard.css';

// Lazy load the FloorplanWrapper - it's a heavy component
const FloorplanWrapper = React.lazy(() => import('../../floorplan/FloorplanWrapper'));

// Pakistan cities for the dropdown
const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Faisalabad',
  'Rawalpindi',
  'Gujranwala',
  'Peshawar',
  'Multan',
  'Hyderabad',
  'Islamabad',
  'Quetta',
  'Bahawalpur',
  'Sargodha',
  'Sialkot',
  'Sukkur',
  'Larkana',
  'Sheikhupura',
  'Rahim Yar Khan',
  'Jhang',
  'Dera Ghazi Khan',
  'Gujrat',
  'Sahiwal',
  'Wah Cantonment',
  'Mardan',
  'Kasur',
  'Okara',
  'Mingora',
  'Nawabshah',
  'Chiniot',
  'Kotri',
  'Kamoke',
  'Hafizabad',
  'Sadiqabad',
  'Mirpur Khas',
  'Burewala',
  'Kohat',
  'Khanewal',
  'Dera Ismail Khan',
  'Turbat',
  'Muzaffargarh',
  'Abbottabad',
  'Mandi Bahauddin',
  'Shikarpur',
  'Jacobabad',
  'Jhelum',
  'Khanpur',
  'Khairpur',
  'Khuzdar',
  'Pakpattan',
  'Hub',
  'Daska'
];

const IntegratedGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { number: 1, title: 'Garden Name', description: 'Name your garden' },
    { number: 2, title: 'Location', description: 'Select city in Pakistan' },
    { number: 3, title: 'Description', description: 'Describe your garden' },
    { number: 4, title: 'Create Floorplan', description: 'Design your empty garden' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFloorplanComplete = async (result) => {
    // Floorplan is complete, save the garden
    await handleSave(result);
  };

  const handleFloorplanCancel = () => {
    // Go back to step 3
    setCurrentStep(3);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return formData.city.trim().length > 0;
      case 3:
        return true; // Description is optional
      default:
        return false;
    }
  };

  const handleSave = async (floorplanResult) => {
    if (!formData.name.trim() || !formData.city.trim()) {
      setError('Please fill in garden name and select a city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {
        floorplanData: fpData,
        skinnedPNG,
        nonSkinnedPNG,
        measurements
      } = floorplanResult;

      // Create garden data
      const gardenData = {
        id: generateGardenId(),
        name: formData.name,
        city: formData.city,
        description: formData.description,
        userEmail: userEmail,
        floorplanData: fpData,
        skinnedPNG: skinnedPNG,
        nonSkinnedPNG: nonSkinnedPNG,
        measurements: measurements,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      saveGardenToLocal(gardenData);

      // Notify parent
      if (onGardenCreated) {
        onGardenCreated(gardenData);
      }
    } catch (err) {
      console.error('Error saving garden:', err);
      setError('Failed to save garden. Please try again.');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3 className="step-title">🌱 What would you like to call your garden?</h3>
              <p className="step-description">
                Choose a name that reflects your garden's personality and purpose.
              </p>
            </div>
            <div className="input-group">
              <label className="input-label">Garden Name *</label>
              <InputField
                type="text"
                placeholder="e.g., My Backyard Paradise, Urban Herb Garden"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3 className="step-title">📍 Where is your garden located?</h3>
              <p className="step-description">
                Select the city in Pakistan where your garden is located.
              </p>
            </div>
            <div className="input-group">
              <label className="input-label">City *</label>
              <select
                className="city-select"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              >
                <option value="">Select a city...</option>
                {PAKISTAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3 className="step-title">📝 Describe your garden</h3>
              <p className="step-description">
                Tell us about your garden - its size, features, or any special characteristics.
              </p>
            </div>
            <div className="input-group">
              <label className="input-label">Description (Optional)</label>
              <textarea
                className="description-textarea"
                placeholder="e.g., A medium-sized backyard garden with space for vegetables and flowers..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="5"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content floorplan-step">
            <div className="floorplan-wrapper">
              <React.Suspense fallback={
                <div className="loading-floorplan">
                  <div className="loading-spinner"></div>
                  <p>Loading Floorplan Builder...</p>
                </div>
              }>
                <FloorplanWrapper
                  onComplete={handleFloorplanComplete}
                  onCancel={handleFloorplanCancel}
                />
              </React.Suspense>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="integrated-wizard-overlay">
      <div className={`integrated-wizard-modal ${currentStep === 4 ? 'floorplan-mode' : ''}`}>
        <div className="wizard-header">
          <h2 className="wizard-title">CREATE YOUR GARDEN</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {currentStep !== 4 && (
          <div className="wizard-progress">
            {steps.map((step) => (
              <div 
                key={step.number} 
                className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
              >
                <div className="step-number">{step.number}</div>
                <div className="step-info">
                  <div className="step-title-small">{step.title}</div>
                  <div className="step-desc-small">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="wizard-content">
          {renderStepContent()}
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {currentStep !== 4 && (
          <div className="wizard-actions">
            <div className="action-left">
              {currentStep > 1 && (
                <Button onClick={prevStep} className="secondary-btn">
                  ← PREVIOUS
                </Button>
              )}
            </div>
            
            <div className="action-right">
              <Button 
                onClick={nextStep} 
                disabled={!validateStep(currentStep)}
                className="primary-btn"
              >
                {currentStep === 3 ? 'CREATE FLOORPLAN →' : 'NEXT →'}
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Saving your garden...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedGardenWizard;
