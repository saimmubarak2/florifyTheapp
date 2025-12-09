import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';
import SVGEditor from './SVGEditor';

const DrawingTest = () => {
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());
  const [mode, setMode] = useState('draw');

  const handleBlueprintChange = (newData) => {
    setBlueprintData(newData);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <h2>Drawing Test - AutoCAD-like Garden Editor</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            className={`mode-btn ${mode === 'view' ? 'active' : ''}`}
            onClick={() => setMode('view')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              background: mode === 'view' ? '#667eea' : 'white',
              color: mode === 'view' ? 'white' : 'black',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            👁️ View Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              background: mode === 'edit' ? '#667eea' : 'white',
              color: mode === 'edit' ? 'white' : 'black',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => setMode('draw')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              background: mode === 'draw' ? '#667eea' : 'white',
              color: mode === 'draw' ? 'white' : 'black',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🖊️ Draw Mode
          </button>
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
          <strong>Instructions:</strong><br/>
          • <strong>Draw Mode:</strong> Click and drag to draw pathways<br/>
          • <strong>Edit Mode:</strong> Click and drag existing shapes to move them<br/>
          • <strong>View Mode:</strong> Just view the blueprint<br/>
          • Use the grid as a guide for measurements
        </p>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <SVGEditor
          blueprintModel={blueprintModel}
          onBlueprintChange={handleBlueprintChange}
          mode={mode}
        />
      </div>
    </div>
  );
};

export default DrawingTest;