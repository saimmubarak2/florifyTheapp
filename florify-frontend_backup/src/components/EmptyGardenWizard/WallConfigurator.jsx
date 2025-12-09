import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';

const WallConfigurator = ({ blueprintModel, onBlueprintChange }) => {
  const [selectedConfig, setSelectedConfig] = useState(null);

  const handleConfigSelect = (configId) => {
    setSelectedConfig(configId);
    
    // Remove existing boundary shapes
    const existingBoundaryShapes = blueprintModel.getShapesByRole('boundary');
    existingBoundaryShapes.forEach(shape => blueprintModel.removeShape(shape.id));
    
    // Add new boundary configuration
    const configs = blueprintModel.getWallConfigurations();
    const config = configs[configId];
    
    if (config) {
      const boundaryShape = {
        type: 'polygon',
        role: 'boundary',
        points: config.points,
        openings: config.openings.map(opening => ({
          start: opening.start,
          end: opening.end
        })),
        style: {
          stroke: '#8e44ad',
          weight_mm: 0.8,
          fill: 'none'
        }
      };
      
      blueprintModel.addShape(boundaryShape);
      onBlueprintChange(blueprintModel.toJSON());
    }
  };

  const wallConfigurations = [
    {
      id: 'all-sides',
      name: 'All Sides with Gate',
      description: 'Complete perimeter with entrance gate',
      features: ['Full privacy', 'Secure boundary', 'Single entrance'],
      preview: '🏰',
      icon: '🔒'
    },
    {
      id: 'two-sides',
      name: 'Two Sides Open',
      description: 'Partial walls, open front and back',
      features: ['Open feel', 'Easy access', 'Less privacy'],
      preview: '🏘️',
      icon: '🌅'
    },
    {
      id: 'no-walls',
      name: 'No Boundary Walls',
      description: 'Property line only, no physical walls',
      features: ['Open design', 'Natural boundaries', 'Maximum visibility'],
      preview: '🌳',
      icon: '🌿'
    }
  ];

  return (
    <div className="wall-configurator">
      <div className="configurator-header">
        <h3>Boundary Wall Configuration</h3>
        <p>Choose how you want to define your garden boundaries</p>
      </div>
      
      <div className="config-grid">
        {wallConfigurations.map((config) => (
          <div
            key={config.id}
            className={`config-card ${selectedConfig === config.id ? 'selected' : ''}`}
            onClick={() => handleConfigSelect(config.id)}
          >
            <div className="config-preview">
              <span className="config-icon">{config.preview}</span>
              <div className="config-badge">
                <span className="badge-icon">{config.icon}</span>
              </div>
            </div>
            
            <div className="config-info">
              <h4 className="config-name">{config.name}</h4>
              <p className="config-description">{config.description}</p>
              
              <div className="config-features">
                <h5>Features:</h5>
                <ul>
                  {config.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            {selectedConfig === config.id && (
              <div className="selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
      
      {selectedConfig && (
        <div className="config-details">
          <h4>Customization Tips</h4>
          <div className="tips-grid">
            <div className="tip">
              <span className="tip-icon">📏</span>
              <div>
                <strong>Adjust Wall Lengths:</strong>
                <p>Drag the corner points to resize walls to your property dimensions</p>
              </div>
            </div>
            <div className="tip">
              <span className="tip-icon">🚪</span>
              <div>
                <strong>Position Gates:</strong>
                <p>Move gate openings by dragging the dashed lines</p>
              </div>
            </div>
            <div className="tip">
              <span className="tip-icon">📐</span>
              <div>
                <strong>Angled Walls:</strong>
                <p>Create custom angles by adjusting individual corner points</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WallConfigurator;