import React, { useState } from 'react';

const PathwayEditor = ({ blueprintModel, onBlueprintChange }) => {
  const [pathwayType, setPathwayType] = useState('driveway');

  const pathwayTypes = [
    {
      id: 'driveway',
      name: 'Driveway',
      description: 'Main vehicle access to your property',
      icon: '🚗',
      style: {
        stroke: '#7f8c8d',
        weight_mm: 1.0,
        fill: '#ecf0f1'
      }
    },
    {
      id: 'walkway',
      name: 'Walkway',
      description: 'Pedestrian path through the garden',
      icon: '🚶',
      style: {
        stroke: '#95a5a6',
        weight_mm: 0.6,
        fill: '#f8f9fa'
      }
    },
    {
      id: 'patio',
      name: 'Patio Area',
      description: 'Outdoor living space',
      icon: '🪑',
      style: {
        stroke: '#34495e',
        weight_mm: 0.8,
        fill: '#ecf0f1'
      }
    },
    {
      id: 'garden-bed',
      name: 'Garden Bed',
      description: 'Area designated for planting',
      icon: '🌱',
      style: {
        stroke: '#27ae60',
        weight_mm: 0.5,
        fill: '#d5f4e6'
      }
    }
  ];

  const handlePathwayTypeChange = (typeId) => {
    setPathwayType(typeId);
  };

  const handleClearPathways = () => {
    const pathwayShapes = blueprintModel.getShapesByRole('pathway');
    pathwayShapes.forEach(shape => blueprintModel.removeShape(shape.id));
    onBlueprintChange(blueprintModel.toJSON());
  };

  const handleClearGardenBeds = () => {
    const gardenBedShapes = blueprintModel.getShapesByRole('gardenBed');
    gardenBedShapes.forEach(shape => blueprintModel.removeShape(shape.id));
    onBlueprintChange(blueprintModel.toJSON());
  };

  const getCurrentStyle = () => {
    const type = pathwayTypes.find(t => t.id === pathwayType);
    return type ? type.style : pathwayTypes[0].style;
  };

  return (
    <div className="pathway-editor">
      <div className="editor-header">
        <h3>Pathways & Areas</h3>
        <p>Draw driveways, walkways, patios, and garden beds</p>
      </div>
      
      <div className="pathway-types">
        <h4>Select Pathway Type:</h4>
        <div className="type-grid">
          {pathwayTypes.map((type) => (
            <div
              key={type.id}
              className={`type-card ${pathwayType === type.id ? 'selected' : ''}`}
              onClick={() => handlePathwayTypeChange(type.id)}
            >
              <span className="type-icon">{type.icon}</span>
              <div className="type-info">
                <h5>{type.name}</h5>
                <p>{type.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="drawing-instructions">
        <h4>Drawing Instructions:</h4>
        <div className="instructions-grid">
          <div className="instruction">
            <span className="instruction-icon">🖱️</span>
            <div>
              <strong>Click and Drag:</strong>
              <p>Click to start drawing, drag to create the path, release to finish</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon">📏</span>
            <div>
              <strong>Precise Drawing:</strong>
              <p>Use the grid as a guide for accurate measurements</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon">✏️</span>
            <div>
              <strong>Edit Mode:</strong>
              <p>Switch to edit mode to move or resize existing pathways</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="current-style-preview">
        <h4>Current Style:</h4>
        <div className="style-preview">
          <div 
            className="preview-line"
            style={{
              borderColor: getCurrentStyle().stroke,
              borderWidth: `${getCurrentStyle().weight_mm * 3.78}px`,
              backgroundColor: getCurrentStyle().fill
            }}
          ></div>
          <span className="style-label">
            {pathwayTypes.find(t => t.id === pathwayType)?.name}
          </span>
        </div>
      </div>
      
      <div className="editor-actions">
        <button 
          className="clear-btn"
          onClick={handleClearPathways}
        >
          Clear All Pathways
        </button>
        <button 
          className="clear-btn"
          onClick={handleClearGardenBeds}
        >
          Clear Garden Beds
        </button>
      </div>
      
      <div className="pathway-tips">
        <h4>Design Tips:</h4>
        <ul>
          <li>Start with the main driveway from the street to your house</li>
          <li>Add walkways connecting different areas of your garden</li>
          <li>Create patio areas for outdoor seating and dining</li>
          <li>Designate garden beds for different types of plants</li>
          <li>Consider accessibility - ensure paths are wide enough</li>
        </ul>
      </div>
    </div>
  );
};

export default PathwayEditor;