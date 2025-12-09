import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';
import BlueprintPDFDownloader from './BlueprintPDFDownloader';

const ImageDownloadTest = () => {
  const [blueprintModel] = useState(() => {
    const model = new BlueprintModel();
    
    // Add some sample shapes for testing
    model.addShape({
      type: 'polygon',
      role: 'building',
      points: [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 100 },
        { x: 50, y: 100 }
      ],
      style: {
        stroke: '#e74c3c',
        weight_mm: 0.8,
        fill: '#e74c3c20'
      }
    });
    
    model.addShape({
      type: 'polyline',
      role: 'pathway',
      points: [
        { x: 150, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 150 }
      ],
      style: {
        stroke: '#7f8c8d',
        weight_mm: 0.8,
        fill: 'none'
      }
    });
    
    model.addShape({
      type: 'polyline',
      role: 'boundary',
      points: [
        { x: 20, y: 20 },
        { x: 250, y: 20 },
        { x: 250, y: 180 },
        { x: 20, y: 180 }
      ],
      style: {
        stroke: '#8e44ad',
        weight_mm: 0.8,
        fill: 'none'
      }
    });
    
    return model;
  });
  
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());

  const handleBlueprintChange = (newData) => {
    setBlueprintData(newData);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '15px', 
        background: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Image Download Test</h2>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Test the image download functionality with sample blueprint data
          </p>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <BlueprintPDFDownloader
          blueprintModel={blueprintModel}
          gardenName="Test Garden Blueprint"
        />
      </div>
    </div>
  );
};

export default ImageDownloadTest;