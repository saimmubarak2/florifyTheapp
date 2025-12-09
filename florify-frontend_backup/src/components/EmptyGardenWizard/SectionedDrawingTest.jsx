import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';
import SectionedDrawingEditor from './SectionedDrawingEditor';

const SectionedDrawingTest = () => {
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());

  const handleBlueprintChange = (newData) => {
    setBlueprintData(newData);
  };

  const clearAll = () => {
    blueprintModel.data.shapes = [];
    setBlueprintData(blueprintModel.toJSON());
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Sectioned Drawing Test</h2>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Test the sectioned drawing: buildings (red), pathways (grey), walls (purple)
          </p>
        </div>
        <button 
          onClick={clearAll}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear All
        </button>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <SectionedDrawingEditor
          blueprintModel={blueprintModel}
          onBlueprintChange={handleBlueprintChange}
        />
      </div>
    </div>
  );
};

export default SectionedDrawingTest;