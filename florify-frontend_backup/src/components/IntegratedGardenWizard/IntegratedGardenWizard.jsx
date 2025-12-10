import React, { useState, useRef } from 'react';
import { BlueprintModel } from '../EmptyGardenWizard/BlueprintModel';
import SectionedDrawingEditor from '../EmptyGardenWizard/SectionedDrawingEditor';
import Button from '../Button';
import InputField from '../InputField';
import { saveGardenToLocal, generateGardenId } from '../../utils/localDatabase';
import './IntegratedGardenWizard.css';

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
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());
  const [drawingSectionsCompleted, setDrawingSectionsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const editorRef = useRef(null);

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

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;

  // Generate PNG from SVG (skinned version with visual styling)
  const generateSkinnedPNG = async () => {
    return new Promise((resolve, reject) => {
      try {
        const svgElement = createSVGElement(true); // With skin/styling
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const dpi = 150;
          const mmToInch = 0.0393701;
          const width = 297 * mmToInch * dpi;
          const height = 210 * mmToInch * dpi;

          canvas.width = width;
          canvas.height = height;

          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw the SVG
          ctx.drawImage(img, 20, 20, width - 40, height - 40);

          // Add title and legend
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`${formData.name} - ${formData.city}`, 20, height - 60);
          ctx.font = '12px Arial';
          ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 20, height - 40);

          // Add skin overlay (decorative elements)
          addSkinOverlay(ctx, width, height);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(svgUrl);
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/png');
        };

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };

        img.src = svgUrl;
      } catch (err) {
        reject(err);
      }
    });
  };

  // Generate PNG from SVG (non-skinned version - just colored lines)
  const generateNonSkinnedPNG = async () => {
    return new Promise((resolve, reject) => {
      try {
        const svgElement = createSVGElement(false); // Without skin/styling
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const dpi = 150;
          const mmToInch = 0.0393701;
          const width = 297 * mmToInch * dpi;
          const height = 210 * mmToInch * dpi;

          canvas.width = width;
          canvas.height = height;

          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw the SVG (plain, no decorations)
          ctx.drawImage(img, 20, 20, width - 40, height - 40);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(svgUrl);
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/png');
        };

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };

        img.src = svgUrl;
      } catch (err) {
        reject(err);
      }
    });
  };

  // Create SVG element for export
  const createSVGElement = (withSkin) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', blueprintModel.getViewBox());
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);

    // Grid (only for skinned version)
    if (withSkin) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', 'grid');
      pattern.setAttribute('width', '20');
      pattern.setAttribute('height', '20');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 20 0 L 0 0 0 20');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#e0e0e0');
      path.setAttribute('stroke-width', '0.5');
      pattern.appendChild(path);
      defs.appendChild(pattern);
      svg.appendChild(defs);

      const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      gridRect.setAttribute('width', '100%');
      gridRect.setAttribute('height', '100%');
      gridRect.setAttribute('fill', 'url(#grid)');
      svg.appendChild(gridRect);
    }

    // Render shapes
    blueprintModel.data.shapes.forEach(shape => {
      const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
      
      let element;
      if (shape.type === 'polyline') {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      } else {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      }
      
      element.setAttribute('points', points);
      element.setAttribute('stroke', shape.style.stroke);
      element.setAttribute('stroke-width', mmToPixels(shape.style.weight_mm));
      element.setAttribute('fill', withSkin ? (shape.style.fill || 'none') : 'none');
      
      svg.appendChild(element);
    });

    return svg;
  };

  // Add decorative skin overlay
  const addSkinOverlay = (ctx, width, height) => {
    // Add a subtle border
    ctx.strokeStyle = '#144345';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Add corner decorations
    ctx.fillStyle = '#144345';
    const cornerSize = 20;
    // Top-left
    ctx.fillRect(10, 10, cornerSize, 3);
    ctx.fillRect(10, 10, 3, cornerSize);
    // Top-right
    ctx.fillRect(width - 10 - cornerSize, 10, cornerSize, 3);
    ctx.fillRect(width - 13, 10, 3, cornerSize);
    // Bottom-left
    ctx.fillRect(10, height - 13, cornerSize, 3);
    ctx.fillRect(10, height - 10 - cornerSize, 3, cornerSize);
    // Bottom-right
    ctx.fillRect(width - 10 - cornerSize, height - 13, cornerSize, 3);
    ctx.fillRect(width - 13, height - 10 - cornerSize, 3, cornerSize);

    // Add legend box
    ctx.fillStyle = 'rgba(248, 249, 250, 0.9)';
    ctx.fillRect(width - 180, height - 120, 160, 100);
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.strokeRect(width - 180, height - 120, 160, 100);

    // Legend items
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('Legend:', width - 170, height - 100);

    const legendItems = [
      { color: '#e74c3c', label: 'Buildings' },
      { color: '#7f8c8d', label: 'Pathways' },
      { color: '#8e44ad', label: 'Boundary Walls' }
    ];

    legendItems.forEach((item, index) => {
      const y = height - 80 + (index * 20);
      ctx.fillStyle = item.color;
      ctx.fillRect(width - 170, y - 8, 12, 12);
      ctx.fillStyle = '#2c3e50';
      ctx.font = '10px Arial';
      ctx.fillText(item.label, width - 150, y);
    });
  };

  // Extract measurements from floorplan
  const extractMeasurements = () => {
    const measurements = {
      bottomBoundaryDistance: null,
      drivewayDistanceFromWall: null,
      drivewayPosition: null
    };

    const buildings = blueprintModel.getShapesByRole('building');
    const boundaries = blueprintModel.getShapesByRole('boundary');
    const pathways = blueprintModel.getShapesByRole('pathway');

    // Find the bottom-most point of buildings
    let lowestBuildingY = 0;
    buildings.forEach(building => {
      building.points.forEach(point => {
        if (point.y > lowestBuildingY) {
          lowestBuildingY = point.y;
        }
      });
    });

    // Find the bottom boundary (highest Y value in boundaries)
    let bottomBoundaryY = 0;
    boundaries.forEach(boundary => {
      boundary.points.forEach(point => {
        if (point.y > bottomBoundaryY) {
          bottomBoundaryY = point.y;
        }
      });
    });

    // Calculate distance from building to bottom boundary
    if (lowestBuildingY > 0 && bottomBoundaryY > 0) {
      measurements.bottomBoundaryDistance = Math.round(bottomBoundaryY - lowestBuildingY);
    }

    // Find driveway/pathway and calculate distances
    if (pathways.length > 0) {
      // Get leftmost and rightmost boundary points
      let leftBoundaryX = Infinity;
      let rightBoundaryX = 0;
      boundaries.forEach(boundary => {
        boundary.points.forEach(point => {
          if (point.x < leftBoundaryX) leftBoundaryX = point.x;
          if (point.x > rightBoundaryX) rightBoundaryX = point.x;
        });
      });

      // Find driveway center and inner edge
      let drivewayLeftX = Infinity;
      let drivewayRightX = 0;
      let drivewayAvgX = 0;
      let totalPoints = 0;

      pathways.forEach(pathway => {
        pathway.points.forEach(point => {
          if (point.x < drivewayLeftX) drivewayLeftX = point.x;
          if (point.x > drivewayRightX) drivewayRightX = point.x;
          drivewayAvgX += point.x;
          totalPoints++;
        });
      });

      if (totalPoints > 0) {
        drivewayAvgX /= totalPoints;
        const pageCenter = blueprintModel.data.page.width_mm / 2;

        // Determine if driveway is on left or right
        if (drivewayAvgX < pageCenter) {
          // Driveway is on the left - measure from right boundary to inner (right) edge
          measurements.drivewayPosition = 'left';
          measurements.drivewayDistanceFromWall = Math.round(rightBoundaryX - drivewayRightX);
        } else {
          // Driveway is on the right - measure from left boundary to inner (left) edge
          measurements.drivewayPosition = 'right';
          measurements.drivewayDistanceFromWall = Math.round(drivewayLeftX - leftBoundaryX);
        }
      }
    }

    return measurements;
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.city.trim()) {
      setError('Please fill in garden name and select a city');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate both PNG versions
      const [skinnedPNG, nonSkinnedPNG] = await Promise.all([
        generateSkinnedPNG(),
        generateNonSkinnedPNG()
      ]);

      // Extract measurements from floorplan
      const measurements = extractMeasurements();

      // Create garden data
      const gardenData = {
        id: generateGardenId(),
        name: formData.name,
        city: formData.city,
        description: formData.description,
        userEmail: userEmail,
        blueprintData: blueprintData,
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
    } finally {
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
            <div className="step-header">
              <h3 className="step-title">🏠 Create Your Empty Garden Floorplan</h3>
              <p className="step-description">
                Draw the layout of your property including buildings, pathways, and boundary walls.
              </p>
            </div>
            <div className="floorplan-container">
              <SectionedDrawingEditor
                ref={editorRef}
                blueprintModel={blueprintModel}
                onBlueprintChange={handleBlueprintChange}
                onSectionsComplete={handleDrawingSectionsComplete}
              />
            </div>
            {drawingSectionsCompleted && (
              <div className="completion-message">
                ✅ Floorplan complete! Click "Save Garden" to save your garden.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="integrated-wizard-overlay">
      <div className="integrated-wizard-modal">
        <div className="wizard-header">
          <h2 className="wizard-title">CREATE YOUR GARDEN</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

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

        <div className="wizard-content">
          {renderStepContent()}
          
          {error && <div className="error-message">{error}</div>}
        </div>

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
                onClick={handleSave} 
                disabled={loading || !validateStep(currentStep)}
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
