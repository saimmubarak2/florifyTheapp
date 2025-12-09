import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';

const HouseFrontSelector = ({ blueprintModel, onBlueprintChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(blueprintModel.data.templates.selected);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    blueprintModel.setHouseTemplate(templateId);
    
    // Remove existing house front shapes
    const existingHouseShapes = blueprintModel.getShapesByRole('houseFront');
    existingHouseShapes.forEach(shape => blueprintModel.removeShape(shape.id));
    
    // Add new house front shape
    const template = blueprintModel.getHouseTemplate(templateId);
    const houseShape = {
      type: 'polygon',
      role: 'houseFront',
      points: template.points,
      openings: template.openings.map(opening => ({
        start: opening.start,
        end: opening.end
      })),
      style: {
        stroke: '#e74c3c',
        weight_mm: 0.5,
        fill: '#f8f9fa'
      }
    };
    
    blueprintModel.addShape(houseShape);
    onBlueprintChange(blueprintModel.toJSON());
  };

  const houseTemplates = [
    {
      id: 'rectangular-simple',
      name: 'Simple Rectangular',
      description: 'Clean, straightforward design',
      preview: '🏠'
    },
    {
      id: 'rectangular-with-porch',
      name: 'With Porch',
      description: 'Classic front porch',
      preview: '🏡'
    },
    {
      id: 'l-shaped',
      name: 'L-Shaped',
      description: 'Modern L-shaped layout',
      preview: '🏘️'
    },
    {
      id: 'u-shaped',
      name: 'U-Shaped',
      description: 'Courtyard style',
      preview: '🏛️'
    },
    {
      id: 'split-level',
      name: 'Split Level',
      description: 'Multi-level design',
      preview: '🏗️'
    },
    {
      id: 'colonial',
      name: 'Colonial',
      description: 'Traditional colonial style',
      preview: '🏛️'
    },
    {
      id: 'ranch',
      name: 'Ranch',
      description: 'Single-story ranch',
      preview: '🏘️'
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, contemporary lines',
      preview: '🏢'
    },
    {
      id: 'cottage-style',
      name: 'Cottage',
      description: 'Charming cottage style',
      preview: '🏚️'
    },
    {
      id: 'victorian',
      name: 'Victorian',
      description: 'Ornate Victorian design',
      preview: '🏰'
    }
  ];

  return (
    <div className="house-front-selector">
      <div className="selector-header">
        <h3>Choose Your House Front</h3>
        <p>Select the style that best matches your home's architecture</p>
      </div>
      
      <div className="template-grid">
        {houseTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <div className="template-preview">
              <span className="template-icon">{template.preview}</span>
            </div>
            <div className="template-info">
              <h4 className="template-name">{template.name}</h4>
              <p className="template-description">{template.description}</p>
            </div>
            {selectedTemplate === template.id && (
              <div className="selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
      
      {selectedTemplate && (
        <div className="template-details">
          <h4>Customization Options</h4>
          <p>After selecting a template, you can:</p>
          <ul>
            <li>Adjust wall lengths by dragging corners</li>
            <li>Move door positions by dragging opening lines</li>
            <li>Resize the entire house front proportionally</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HouseFrontSelector;