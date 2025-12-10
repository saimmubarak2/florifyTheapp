import React, { useState, useRef, useCallback } from 'react';
import { BlueprintModel } from '../EmptyGardenWizard/BlueprintModel';
import SectionedDrawingEditor from '../EmptyGardenWizard/SectionedDrawingEditor';
import FloorplanImageGenerator from './FloorplanImageGenerator';
import Button from '../Button';
import InputField from '../InputField';
import { createGardenWithFloorplan } from '../../api/gardens';
import { PAKISTAN_CITIES } from '../../data/pakistanCities';
import { extractFloorplanMeasurements } from '../../utils/floorplanMeasurements';
import './IntegratedGardenWizard.css';

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

  // Image generator ref for capturing images
  const imageGeneratorRef = useRef(null);

  const steps = [
    { number: 1, title: 'Garden Name', description: 'Name your garden' },
    { number: 2, title: 'Location', description: 'Select city in Pakistan' },
    { number: 3, title: 'Description', description: 'Describe your garden' },
    { number: 4, title: 'Create Floorplan', description: 'Draw your garden layout' }
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
    if (!formData.name.trim() || !formData.city.trim()) {
      setError('Please fill in garden name and location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate both PNG images (with and without skin)
      let imageWithSkin = null;
      let imageWithoutSkin = null;

      if (imageGeneratorRef.current) {
        const images = await imageGeneratorRef.current.generateImages();
        imageWithSkin = images.withSkin;
        imageWithoutSkin = images.withoutSkin;
      }

      // Extract measurements from the floorplan
      const measurements = extractFloorplanMeasurements(blueprintModel);

      // Create garden data
      const gardenData = {
        name: formData.name.trim(),
        city: formData.city,
        description: formData.description.trim(),
        blueprintData: blueprintData,
        imageWithSkin: imageWithSkin,
        imageWithoutSkin: imageWithoutSkin,
        measurements: measurements,
        userEmail: userEmail,
        isBlueprint: true,
        createdAt: new Date().toISOString()
      };

      // Save to backend/local storage
      const savedGarden = await createGardenWithFloorplan(gardenData);

      // Notify parent component
      if (onGardenCreated) {
        onGardenCreated(savedGarden);
      }

      onClose();
    } catch (err) {
      console.error('Error saving garden:', err);
      setError(err.message || 'Failed to save garden. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content-panel">
            <div className="step-header">
              <h3>What would you like to call your garden?</h3>
              <p>Choose a name that reflects your garden's personality and purpose.</p>
            </div>
            <div className="input-group">
              <label className="input-label">Garden Name *</label>
              <InputField
                type="text"
                placeholder="e.g., My Backyard Paradise, Urban Garden"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content-panel">
            <div className="step-header">
              <h3>Where is your garden located?</h3>
              <p>Select your city in Pakistan to help us provide location-specific recommendations.</p>
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
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>
            {formData.city && (
              <div className="selected-city-info">
                <span className="city-icon">📍</span>
                <span>Selected: {formData.city}</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content-panel">
            <div className="step-header">
              <h3>Describe your garden</h3>
              <p>Tell us more about your garden - its style, what you want to grow, or any special features.</p>
            </div>
            <div className="input-group">
              <label className="input-label">Description (Optional)</label>
              <textarea
                className="description-textarea"
                placeholder="Describe your garden plans, preferred plants, style, etc..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="6"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content-panel floorplan-step">
            <div className="step-header compact">
              <h3>Create Your Garden Floorplan</h3>
              <p>Use the drawing tools to create your garden layout. Draw buildings, pathways, and boundary walls.</p>
            </div>
            <div className="drawing-status">
              {drawingSectionsCompleted ? (
                <div className="status-complete">
                  <span className="status-icon">✅</span>
                  <span>Drawing complete! You can save your garden now.</span>
                </div>
              ) : (
                <div className="status-pending">
                  <span className="status-icon">🎨</span>
                  <span>Complete all drawing sections to proceed.</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
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

            <div className="step-content-wrapper">
              {renderStepContent()}
            </div>

            {/* Summary when on step 4 */}
            {currentStep === 4 && (
              <div className="garden-summary">
                <h4>Garden Summary</h4>
                <div className="summary-item">
                  <span className="summary-label">Name:</span>
                  <span className="summary-value">{formData.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">City:</span>
                  <span className="summary-value">{formData.city}</span>
                </div>
                {formData.description && (
                  <div className="summary-item">
                    <span className="summary-label">Description:</span>
                    <span className="summary-value truncate">{formData.description}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="wizard-main">
            {currentStep === 4 ? (
              <div className="editor-panel">
                <SectionedDrawingEditor
                  blueprintModel={blueprintModel}
                  onBlueprintChange={handleBlueprintChange}
                  onSectionsComplete={handleDrawingSectionsComplete}
                />
                {/* Hidden image generator component */}
                <FloorplanImageGenerator
                  ref={imageGeneratorRef}
                  blueprintModel={blueprintModel}
                  gardenName={formData.name}
                />
              </div>
            ) : (
              <div className="preview-panel">
                <div className="preview-content">
                  <div className="preview-icon">
                    {currentStep === 1 && '🌱'}
                    {currentStep === 2 && '📍'}
                    {currentStep === 3 && '📝'}
                  </div>
                  <h3>
                    {currentStep === 1 && 'Name Your Garden'}
                    {currentStep === 2 && 'Select Your Location'}
                    {currentStep === 3 && 'Add Description'}
                  </h3>
                  <p>
                    {currentStep === 1 && 'A good name helps you organize and identify your garden projects.'}
                    {currentStep === 2 && 'Location helps us provide climate-appropriate plant suggestions.'}
                    {currentStep === 3 && 'Descriptions help you remember your plans and share them with others.'}
                  </p>
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
                disabled={loading || !drawingSectionsCompleted}
                className="primary-btn save-btn"
              >
                {loading ? 'SAVING...' : 'SAVE GARDEN 🌱'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedGardenWizard;
