import React, { useState, useRef, useEffect } from 'react';

const SectionedDrawingEditor = ({ blueprintModel, onBlueprintChange, onSectionsComplete }) => {
  const svgRef = useRef(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drawingTool, setDrawingTool] = useState('line');

  const sections = [
    {
      id: 'buildings',
      title: 'Step 1: Draw Buildings',
      description: 'Draw the outline of your house and other buildings',
      color: '#e74c3c',
      role: 'building',
      detailedGuidance: {
        title: '🏠 Draw Your Buildings',
        instructions: [
          'Start by drawing the main house outline using the rectangle tool',
          'Add any additional buildings like garages, sheds, or extensions',
          'Use the line tool for irregular building shapes',
          'Use the polygon tool for complex building outlines',
          'Don\'t worry about doors and windows yet - we\'ll add those later',
          'Make sure buildings are drawn to scale using the grid as a guide'
        ],
        tips: [
          '💡 Tip: Use the grid lines to keep your buildings aligned',
          '📏 Tip: A typical house might be 10-15 grid squares wide',
          '🎯 Tip: You can always go back and edit shapes later'
        ],
        examples: [
          'Example: Draw a rectangle for the main house',
          'Example: Add a smaller rectangle for the garage',
          'Example: Use lines to create an L-shaped house'
        ]
      }
    },
    {
      id: 'pathways',
      title: 'Step 2: Draw Pathways',
      description: 'Draw driveways, walkways, and paths',
      color: '#7f8c8d',
      role: 'pathway',
      detailedGuidance: {
        title: '🛤️ Draw Your Pathways',
        instructions: [
          'Draw the main driveway from the street to your house',
          'Add walkways connecting different areas of your garden',
          'Include paths to the front door, back door, and garden areas',
          'Use the rectangle tool for wide driveways',
          'Use the line tool for narrow walkways',
          'Use the polygon tool for curved or irregular paths'
        ],
        tips: [
          '💡 Tip: Driveways are usually 3-4 meters wide',
          '📏 Tip: Walkways are typically 1-1.5 meters wide',
          '🎯 Tip: Consider how people will move around your garden'
        ],
        examples: [
          'Example: Draw a straight driveway from street to garage',
          'Example: Add a curved path from driveway to front door',
          'Example: Create a network of paths around the garden'
        ]
      }
    },
    {
      id: 'walls',
      title: 'Step 3: Draw Boundary Walls',
      description: 'Draw walls and fences around your property',
      color: '#8e44ad',
      role: 'boundary',
      detailedGuidance: {
        title: '🧱 Draw Your Boundary Walls',
        instructions: [
          'Draw walls and fences around the perimeter of your property',
          'Include any internal walls that divide different garden areas',
          'Mark where gates and openings will be located',
          'Use the line tool for straight walls and fences',
          'Use the polygon tool for curved or irregular boundaries',
          'Don\'t forget to leave space for gates and entrances'
        ],
        tips: [
          '💡 Tip: Property boundaries are usually straight lines',
          '📏 Tip: Leave 1-2 meter gaps for gates and entrances',
          '🎯 Tip: Consider privacy and security when placing walls'
        ],
        examples: [
          'Example: Draw a rectangular boundary around your property',
          'Example: Add internal walls to separate different garden areas',
          'Example: Leave gaps for gates and entrances'
        ]
      }
    }
  ];

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Convert SVG pixels to mm
  const pixelsToMm = (pixels) => pixels / 3.78;

  // Get mouse position relative to SVG
  const getMousePosition = (event) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const svg = svgRef.current;
    const viewBox = svg.getAttribute('viewBox');
    
    if (viewBox) {
      const [minX, minY, width, height] = viewBox.split(' ').map(Number);
      const x = ((event.clientX - rect.left) / rect.width) * width + minX;
      const y = ((event.clientY - rect.top) / rect.height) * height + minY;
      return { x, y };
    } else {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y };
    }
  };

  // Handle mouse down for drawing
  const handleMouseDown = (event) => {
    const { x, y } = getMousePosition(event);
    const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
    
    if (event.button === 0) { // Left click
      setIsDrawing(true);
      setCurrentPath([mmPos]);
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (event) => {
    const { x, y } = getMousePosition(event);
    setMousePos({ x, y });
    
    if (isDrawing) {
      const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
      
      if (drawingTool === 'line') {
        setCurrentPath([currentPath[0], mmPos]);
      } else if (drawingTool === 'rectangle') {
        const start = currentPath[0];
        setCurrentPath([start, { x: mmPos.x, y: start.y }, mmPos, { x: start.x, y: mmPos.y }, start]);
      } else if (drawingTool === 'polygon') {
        setCurrentPath(prev => [...prev, mmPos]);
      }
    }
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentPath.length >= 2) {
      const currentSectionData = sections[currentSection];
      const newShape = {
        type: drawingTool === 'line' ? 'polyline' : 'polygon',
        role: currentSectionData.role,
        points: currentPath,
        style: {
          stroke: currentSectionData.color,
          weight_mm: 0.8,
          fill: drawingTool === 'rectangle' ? `${currentSectionData.color}20` : 'none'
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
    }
    
    setCurrentPath([]);
  };

  // Handle double click to finish polygon
  const handleDoubleClick = (event) => {
    if (drawingTool === 'polygon' && currentPath.length >= 3) {
      setIsDrawing(false);
      
      const currentSectionData = sections[currentSection];
      const newShape = {
        type: 'polygon',
        role: currentSectionData.role,
        points: currentPath,
        style: {
          stroke: currentSectionData.color,
          weight_mm: 0.8,
          fill: `${currentSectionData.color}20`
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
      setCurrentPath([]);
    }
  };

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none',
      className: 'shape'
    };

    switch (shape.type) {
      case 'polyline':
        return (
          <polyline
            {...commonProps}
            points={points}
          />
        );
      case 'polygon':
        return (
          <polygon
            {...commonProps}
            points={points}
          />
        );
      default:
        return null;
    }
  };

  // Render current drawing path
  const renderCurrentPath = () => {
    if (currentPath.length < 2) return null;
    
    const points = currentPath.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const currentSectionData = sections[currentSection];
    
    return (
      <g>
        {drawingTool === 'line' ? (
          <polyline
            points={points}
            stroke={currentSectionData.color}
            strokeWidth={mmToPixels(0.8)}
            fill="none"
            strokeDasharray="5,5"
            className="current-path"
          />
        ) : (
          <polygon
            points={points}
            stroke={currentSectionData.color}
            strokeWidth={mmToPixels(0.8)}
            fill={`${currentSectionData.color}20`}
            strokeDasharray="5,5"
            className="current-path"
          />
        )}
      </g>
    );
  };

  const currentSectionData = sections[currentSection];
  const canGoNext = currentSection < sections.length - 1;
  const canGoPrevious = currentSection > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentSection(currentSection + 1);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentSection(currentSection - 1);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handleFinish = () => {
    // Notify parent that all drawing sections are completed
    if (onSectionsComplete) {
      onSectionsComplete();
    }
    console.log('Drawing completed!', blueprintModel.toJSON());
    alert('Drawing completed! You can now proceed to the download step using the main wizard navigation.');
  };

  return (
    <div className="sectioned-drawing-editor">
      <div className="drawing-header">
        <div className="section-info">
          <h3 style={{ color: currentSectionData.color, margin: 0 }}>
            {currentSectionData.title}
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
            {currentSectionData.description}
          </p>
        </div>
        
        <div className="section-progress">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`progress-dot ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
              style={{ backgroundColor: section.color }}
            />
          ))}
        </div>
      </div>

      <div className="drawing-toolbar">
        <div className="tool-buttons">
          <button 
            className={`tool-btn ${drawingTool === 'line' ? 'active' : ''}`}
            onClick={() => setDrawingTool('line')}
          >
            📏 Line
          </button>
          <button 
            className={`tool-btn ${drawingTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setDrawingTool('rectangle')}
          >
            ⬜ Rectangle
          </button>
          <button 
            className={`tool-btn ${drawingTool === 'polygon' ? 'active' : ''}`}
            onClick={() => setDrawingTool('polygon')}
          >
            🔷 Polygon
          </button>
        </div>
        
        <div className="mouse-coords">
          {Math.round(pixelsToMm(mousePos.x))}mm, {Math.round(pixelsToMm(mousePos.y))}mm
        </div>
      </div>

      <div className="drawing-canvas">
        <svg
          ref={svgRef}
          viewBox={blueprintModel.getViewBox()}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="blueprint-svg"
          style={{ cursor: 'crosshair' }}
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Render all shapes */}
          {blueprintModel.data.shapes.map(shape => (
            <g key={shape.id}>
              {renderShape(shape)}
            </g>
          ))}
          
          {/* Render current drawing path */}
          {renderCurrentPath()}
        </svg>
      </div>

      <div className="drawing-instructions">
        <div className="guidance-section">
          <h4 style={{ color: currentSectionData.color, margin: '0 0 15px 0' }}>
            {currentSectionData.detailedGuidance.title}
          </h4>
          
          <div className="instructions-grid">
            <div className="instructions-column">
              <h5>📋 Instructions:</h5>
              <ul>
                {currentSectionData.detailedGuidance.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
            
            <div className="tips-column">
              <h5>💡 Tips:</h5>
              <ul>
                {currentSectionData.detailedGuidance.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            
            <div className="examples-column">
              <h5>🎯 Examples:</h5>
              <ul>
                {currentSectionData.detailedGuidance.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="tool-instructions">
            <p>
              <strong>Current Tool: {drawingTool === 'line' ? 'Line Tool' : drawingTool === 'rectangle' ? 'Rectangle Tool' : 'Polygon Tool'}</strong>
              {drawingTool === 'line' && ' - Click and drag to draw a line'}
              {drawingTool === 'rectangle' && ' - Click and drag to draw a rectangle'}
              {drawingTool === 'polygon' && ' - Click to add points, double-click to finish'}
            </p>
            <p style={{ color: currentSectionData.color, fontWeight: 'bold' }}>
              Drawing with {currentSectionData.color} color
            </p>
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
              <strong>Navigation:</strong> Use "Next →" below to move between drawing sections. Use the main wizard "NEXT →" button to proceed to download.
            </p>
          </div>
        </div>
      </div>

      <div className="drawing-navigation">
        <button 
          className="nav-btn prev-btn"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
        >
          ← Previous
        </button>
        
        <div className="section-indicator">
          Drawing Step {currentSection + 1} of {sections.length}
        </div>
        
        {canGoNext ? (
          <button 
            className="nav-btn next-btn"
            onClick={handleNext}
          >
            Next Section →
          </button>
        ) : (
          <button 
            className="nav-btn finish-btn"
            onClick={handleFinish}
          >
            ✅ Complete All Drawing
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionedDrawingEditor;