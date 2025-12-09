import React, { useState } from 'react';
import BlueprintViewer from './BlueprintViewer';
import { BlueprintModel } from './BlueprintModel';

const BlueprintTestPage = () => {
  const [blueprintModel] = useState(() => {
    const model = new BlueprintModel();
    
    // Add a sample house front
    model.setHouseTemplate('rectangular-simple');
    const houseTemplate = model.getHouseTemplate('rectangular-simple');
    model.addShape({
      type: 'polygon',
      role: 'houseFront',
      points: houseTemplate.points,
      openings: houseTemplate.openings.map(opening => ({
        start: opening.start,
        end: opening.end
      })),
      style: {
        stroke: '#e74c3c',
        weight_mm: 0.5,
        fill: '#f8f9fa'
      }
    });
    
    // Add boundary walls
    const wallConfig = model.getWallConfigurations()['all-sides'];
    model.addShape({
      type: 'polygon',
      role: 'boundary',
      points: wallConfig.points,
      openings: wallConfig.openings.map(opening => ({
        start: opening.start,
        end: opening.end
      })),
      style: {
        stroke: '#8e44ad',
        weight_mm: 0.8,
        fill: 'none'
      }
    });
    
    // Add some pathways
    model.addShape({
      type: 'polyline',
      role: 'pathway',
      points: [
        { x: 150, y: 60 },
        { x: 190, y: 60 },
        { x: 190, y: 290 }
      ],
      style: {
        stroke: '#7f8c8d',
        weight_mm: 1.0,
        fill: 'none'
      }
    });
    
    // Add a garden bed
    model.addShape({
      type: 'polygon',
      role: 'gardenBed',
      points: [
        { x: 20, y: 100 },
        { x: 80, y: 100 },
        { x: 80, y: 150 },
        { x: 20, y: 150 }
      ],
      style: {
        stroke: '#27ae60',
        weight_mm: 0.5,
        fill: '#d5f4e6'
      }
    });
    
    return model;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Garden Blueprint Viewer Test</h1>
      <p>This is a test page to demonstrate the blueprint viewer component.</p>
      
      <BlueprintViewer 
        blueprintData={blueprintModel.toJSON()}
        title="Sample Garden Blueprint"
      />
    </div>
  );
};

export default BlueprintTestPage;