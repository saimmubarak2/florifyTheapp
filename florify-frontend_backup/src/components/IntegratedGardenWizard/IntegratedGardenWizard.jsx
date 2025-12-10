import React, { useState, useRef } from 'react';
import { BlueprintModel } from '../EmptyGardenWizard/BlueprintModel';
import SectionedDrawingEditor from '../EmptyGardenWizard/SectionedDrawingEditor';
import FloorplanExporter from './FloorplanExporter';
import Button from '../Button';
import InputField from '../InputField';
import { saveGardenLocally, generateId } from '../../services/localStorageService';
import { extractFloorplanMeasurements } from '../../utils/floorplanMeasurements';
import './IntegratedGardenWizard.css';

// Pakistani cities list
const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Larkana',
  'Sheikhupura',
  'Jhang',
  'Rahim Yar Khan',
  'Gujrat',
  'Mardan',
  'Kasur',
  'Dera Ghazi Khan',
  'Sahiwal',
  'Nawabshah',
  'Mirpur Khas',
  'Okara',
  'Mandi Bahauddin',
  'Jacobabad',
  'Jhelum',
  'Khanewal',
  'Khairpur',
  'Kohat',
  'Hafizabad',
  'Sadiqabad',
  'Muzaffargarh',
  'Khanpur',
  'Gojra',
  'Mianwali',
  'Chiniot'
];

const IntegratedGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());
  const [drawingSectionsCompleted, setDrawingSectionsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    description: ''
  });

  // PNG export refs
  const exporterRef = useRef(null);

  const steps = [
    { 
      number: 1, 
      title: 'Garden Name', 
      description: 'Give your garden a unique name'
    },
    { 
      number: 2, 
      title: 'Location', 
      description: 'Select your city in Pakistan'
    },
    { 
      number: 3, 
      title: 'Description', 
      description: 'Describe your garden'
    },
    { 
      number: 4, 
      title: 'Create Floorplan', 
      description: 'Draw your garden layout'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleBlueprintChange = (newData) => {
    setBlueprintData(newData);
  };

  const handleDrawingSectionsComplete = () => {
    setDrawingSectionsCompleted(true);
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
      case 4:
        return drawingSectionsCompleted || blueprintModel.data.shapes.length > 0;
      default:
        return false;
    }
  };

  const handleSaveGarden = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a garden name');
      return;
    }

    if (!formData.city) {
      setError('Please select a city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Export PNGs using the exporter component
      let pngWithSkin = null;
      let pngWithoutSkin = null;

      if (exporterRef.current) {
        const exports = await exporterRef.current.exportBothPNGs();
        pngWithSkin = exports.withSkin;
        pngWithoutSkin = exports.withoutSkin;
      }

      // Extract measurements from floorplan
      const measurements = extractFloorplanMeasurements(blueprintModel);

      // Create garden data
      const gardenData = {
        id: generateId(),
        name: formData.name,
        city: formData.city,
        description: formData.description,
        userEmail: userEmail,
        blueprintData: blueprintData,
        pngWithSkin: pngWithSkin,
        pngWithoutSkin: pngWithoutSkin,
        measurements: measurements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      saveGardenLocally(gardenData);

      // Notify parent component
      if (onGardenCreated) {
        onGardenCreated(gardenData);
      }

    } catch (err) {
      console.error('Error saving garden:', err);
      setError('Failed to save garden. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-form">
              <h3 className="step-title">🌿 What would you like to call your garden?</h3>
              <p className="step-description">
                Choose a memorable name that reflects your garden's personality.
              </p>
              <div className="input-group">
                <label className="input-label">Garden Name *</label>
                <InputField
                  type="text"
                  name="name"
                  placeholder="e.g., My Backyard Paradise, Rose Garden"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-form">
              <h3 className="step-title">📍 Where is your garden located?</h3>
              <p className="step-description">
                Select your city to help us provide location-specific gardening recommendations.
              </p>
              <div className="input-group">
                <label className="input-label">City in Pakistan *</label>
                <select
                  className="city-select"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                >
                  <option value="">-- Select a City --</option>
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {formData.city && (
                <div className="selected-city-display">
                  <span className="city-badge">🏙️ {formData.city}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-form">
              <h3 className="step-title">📝 Describe your garden</h3>
              <p className="step-description">
                Tell us about your garden - its purpose, plants you'd like to grow, or any special features.
              </p>
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="description-textarea"
                  placeholder="e.g., A peaceful backyard garden with space for vegetables, flowers, and a seating area..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="6"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content floorplan-step">
            <div className="floorplan-header">
              <h3 className="step-title">🏠 Create Your Garden Floorplan</h3>
              <p className="step-description">
                Draw your property layout including buildings, pathways, and boundary walls.
              </p>
              <div className="drawing-status">
                {drawingSectionsCompleted ? (
                  <span className="status-complete">✅ Drawing sections completed!</span>
                ) : (
                  <span className="status-pending">Complete all 3 drawing sections (Buildings → Pathways → Walls)</span>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderEditor = () => {
    if (currentStep !== 4) return null;
    
    return (
      <div className="editor-panel">
        <SectionedDrawingEditor
          blueprintModel={blueprintModel}
          onBlueprintChange={handleBlueprintChange}
          onSectionsComplete={handleDrawingSectionsComplete}
        />
        {/* Hidden exporter for PNG generation */}
        <FloorplanExporter
          ref={exporterRef}
          blueprintModel={blueprintModel}
          gardenName={formData.name}
        />
      </div>
    );
  };

  return (
    <div className="integrated-garden-wizard">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2 className="wizard-title">CREATE YOUR GARDEN</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="wizard-layout">
          <div className="wizard-sidebar">
            <div className="wizard-progress">
              {steps.map((step) => (
                <div 
                  key={step.number} 
                  className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                >
                  <div className="step-number">
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="step-info">
                    <div className="step-title-small">{step.title}</div>
                    <div className="step-desc-small">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="step-content-wrapper">
              {renderStepContent()}
            </div>

            {/* Summary section on step 4 */}
            {currentStep === 4 && (
              <div className="garden-summary">
                <h4>📋 Garden Summary</h4>
                <div className="summary-item">
                  <strong>Name:</strong> {formData.name}
                </div>
                <div className="summary-item">
                  <strong>City:</strong> {formData.city}
                </div>
                {formData.description && (
                  <div className="summary-item">
                    <strong>Description:</strong> {formData.description.substring(0, 100)}...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="wizard-main">
            {currentStep === 4 ? (
              renderEditor()
            ) : (
              <div className="preview-panel">
                <div className="preview-content">
                  <div className="preview-icon">
                    {currentStep === 1 && '🌿'}
                    {currentStep === 2 && '🗺️'}
                    {currentStep === 3 && '📝'}
                  </div>
                  <h3>Step {currentStep} of 4</h3>
                  <p>{steps[currentStep - 1].title}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="wizard-actions">
          <div className="action-left">
            {currentStep > 1 && (
              <Button onClick={prevStep} className="secondary-btn">
                ← PREVIOUS
              </Button>
            )}
          </div>
          
          <div className="action-right">
            {currentStep < steps.length ? (
              <Button 
                onClick={nextStep} 
                disabled={!validateStep(currentStep)}
                className="primary-btn"
              >
                NEXT →
              </Button>
            ) : (
              <Button 
                onClick={handleSaveGarden} 
                disabled={loading || !formData.name.trim() || !formData.city}
                className="primary-btn save-btn"
              >
                {loading ? 'SAVING...' : 'SAVE GARDEN 💾'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedGardenWizard;
