import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';
import SVGEditor from './SVGEditor';
import SectionedDrawingEditor from './SectionedDrawingEditor';
import BlueprintPDFDownloader from './BlueprintPDFDownloader';
import HouseFrontSelector from './HouseFrontSelector';
import WallConfigurator from './WallConfigurator';
import PathwayEditor from './PathwayEditor';
import Button from '../Button';
import TypewriterText from '../TypewriterText';

const EmptyGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());
  const [editorMode, setEditorMode] = useState('draw');
  const [useSectionedDrawing, setUseSectionedDrawing] = useState(true);
  const [drawingSectionsCompleted, setDrawingSectionsCompleted] = useState(false);
  const [gardenName, setGardenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { 
      number: 1, 
      title: 'Draw Your Garden', 
      description: 'Use sectioned drawing to create your garden blueprint',
      component: 'draw'
    },
    { 
      number: 2, 
      title: 'Download Image', 
      description: 'Download your blueprint as a high-quality image',
      component: 'download'
    },
    { 
      number: 3, 
      title: 'Save Blueprint', 
      description: 'Name and save your garden blueprint',
      component: 'save'
    }
  ];

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
        return drawingSectionsCompleted || blueprintModel.data.shapes.length > 0; // Drawing completed or has shapes
      case 2:
        return true; // Download step is always valid
      case 3:
        return gardenName.trim().length > 0; // Must have a name
      default:
        return false;
    }
  };

  const handleSaveGarden = async () => {
    if (!gardenName.trim()) {
      setError('Please enter a garden name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create garden data with blueprint
      const gardenData = {
        name: gardenName,
        description: 'Empty garden blueprint created with the garden wizard',
        location: 'Garden Blueprint',
        coordinates: { lat: 0, lng: 0 },
        userEmail: userEmail,
        blueprintData: blueprintData,
        isBlueprint: true
      };

      // For now, we'll just call the callback with the blueprint data
      // In a real implementation, you'd save this to your backend
      if (onGardenCreated) {
        onGardenCreated({
          ...gardenData,
          id: `blueprint-${Date.now()}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch {
      setError('Failed to save garden blueprint');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="drawing-mode-selector">
              <h4>🎨 Choose Drawing Mode</h4>
              <div className="mode-options">
                <button 
                  className={`mode-option ${useSectionedDrawing ? 'active' : ''}`}
                  onClick={() => setUseSectionedDrawing(true)}
                >
                  <div className="mode-icon">📋</div>
                  <div className="mode-title">Sectioned Drawing</div>
                  <div className="mode-desc">Draw in steps: buildings, pathways, walls</div>
                </button>
                <button 
                  className={`mode-option ${!useSectionedDrawing ? 'active' : ''}`}
                  onClick={() => setUseSectionedDrawing(false)}
                >
                  <div className="mode-icon">🖊️</div>
                  <div className="mode-title">Free Drawing</div>
                  <div className="mode-desc">Draw freely with all tools</div>
                </button>
              </div>
            </div>
            
            <div className="drawing-progress">
              <h5>Drawing Progress</h5>
              <div className="progress-info">
                <div className="progress-item">
                  <span className="progress-icon">🏠</span>
                  <span>Buildings: {blueprintModel.getShapesByRole('building').length}</span>
                </div>
                <div className="progress-item">
                  <span className="progress-icon">🛤️</span>
                  <span>Pathways: {blueprintModel.getShapesByRole('pathway').length}</span>
                </div>
                <div className="progress-item">
                  <span className="progress-icon">🧱</span>
                  <span>Walls: {blueprintModel.getShapesByRole('boundary').length}</span>
                </div>
              </div>
              
              <div className="drawing-tips">
                <p><strong>💡 Tip:</strong> Use the "Next →" button in the drawing area to move between drawing sections (buildings → pathways → walls). Complete all drawing sections to enable the main "NEXT →" button.</p>
                {drawingSectionsCompleted && (
                  <p style={{ color: '#27ae60', fontWeight: 'bold', marginTop: '10px' }}>
                    ✅ All drawing sections completed! You can now proceed to the download step.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="pdf-download-section">
              <h4>🖼️ Download Your Blueprint</h4>
              <p>Your garden blueprint is ready! You can download it as a high-quality image file that's perfect for printing or sharing.</p>
              
              <div className="download-features">
                <div className="feature-item">
                  <span className="feature-icon">🖨️</span>
                  <div className="feature-text">
                    <strong>Print Ready</strong>
                    <p>High-resolution image for printing</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎨</span>
                  <div className="feature-text">
                    <strong>High Quality</strong>
                    <p>PNG format for crisp printing</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📏</span>
                  <div className="feature-text">
                    <strong>Scale Information</strong>
                    <p>Includes legend and measurements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="review-content">
              <h3>Save Your Blueprint</h3>
              
              <div className="garden-name-input">
                <label htmlFor="garden-name">Garden Name *</label>
                <input
                  id="garden-name"
                  type="text"
                  value={gardenName}
                  onChange={(e) => setGardenName(e.target.value)}
                  placeholder="Enter a name for your garden blueprint"
                  className="name-input"
                />
              </div>
              
              <div className="blueprint-summary">
                <h4>Your Blueprint Contains:</h4>
                <ul>
                  <li>Drawn Elements: {blueprintModel.getShapesByRole('drawn').length} shapes</li>
                  <li>House Front: {blueprintModel.data.templates.selected || 'Not added'}</li>
                  <li>Boundary Walls: {blueprintModel.getShapesByRole('boundary').length > 0 ? 'Added' : 'Not added'}</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderEditor = () => {
    if (currentStep === 2) {
      return (
        <div className="editor-panel">
          <BlueprintPDFDownloader
            blueprintModel={blueprintModel}
            gardenName={gardenName}
          />
        </div>
      );
    }
    
    return (
      <div className="editor-panel">
        {useSectionedDrawing ? (
          <SectionedDrawingEditor
            blueprintModel={blueprintModel}
            onBlueprintChange={handleBlueprintChange}
            onSectionsComplete={handleDrawingSectionsComplete}
          />
        ) : (
          <SVGEditor
            blueprintModel={blueprintModel}
            onBlueprintChange={handleBlueprintChange}
            mode={editorMode}
          />
        )}
      </div>
    );
  };

  return (
    <div className="empty-garden-wizard">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2 className="wizard-title">CREATE EMPTY GARDEN BLUEPRINT</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="wizard-layout">
          <div className="wizard-sidebar">
            <div className="wizard-progress">
              {steps.map((step) => (
                <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}>
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
          </div>

          <div className="wizard-main">
            {renderEditor()}
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
                {currentStep === 1 && useSectionedDrawing && !drawingSectionsCompleted 
                  ? 'COMPLETE DRAWING FIRST' 
                  : 'NEXT →'
                }
              </Button>
            ) : (
              <Button 
                onClick={handleSaveGarden} 
                disabled={loading || !gardenName.trim()}
                className="primary-btn"
              >
                {loading ? 'SAVING...' : 'SAVE BLUEPRINT 📐'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyGardenWizard;