import React, { useState, useRef, useEffect } from 'react';

const SVGEditor = ({ blueprintModel, onBlueprintChange, mode = 'draw' }) => {
  const svgRef = useRef(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drawingTool, setDrawingTool] = useState('line'); // line, rectangle, polygon

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
    if (mode !== 'draw') return;
    
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
    
    if (isDrawing && mode === 'draw') {
      const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
      
      if (drawingTool === 'line') {
        // For line tool, update the end point
        setCurrentPath([currentPath[0], mmPos]);
      } else if (drawingTool === 'rectangle') {
        // For rectangle, calculate opposite corner
        const start = currentPath[0];
        setCurrentPath([start, { x: mmPos.x, y: start.y }, mmPos, { x: start.x, y: mmPos.y }, start]);
      } else if (drawingTool === 'polygon') {
        // For polygon, add points as you move
        setCurrentPath(prev => [...prev, mmPos]);
      }
    }
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = (event) => {
    if (!isDrawing || mode !== 'draw') return;
    
    setIsDrawing(false);
    
    if (currentPath.length >= 2) {
      const newShape = {
        type: drawingTool === 'line' ? 'polyline' : 'polygon',
        role: 'drawn',
        points: currentPath,
        style: {
          stroke: '#2c3e50',
          weight_mm: 0.5,
          fill: drawingTool === 'rectangle' ? '#f8f9fa' : 'none'
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
      
      const newShape = {
        type: 'polygon',
        role: 'drawn',
        points: currentPath,
        style: {
          stroke: '#2c3e50',
          weight_mm: 0.5,
          fill: '#f8f9fa'
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
      setCurrentPath([]);
    }
  };

  // Handle shape selection
  const handleShapeClick = (event, shapeId) => {
    event.stopPropagation();
    setSelectedShape(shapeId);
  };

  // Handle shape dragging
  const handleShapeMouseDown = (event, shapeId) => {
    if (mode !== 'edit') return;
    
    event.stopPropagation();
    setSelectedShape(shapeId);
    
    const { x, y } = getMousePosition(event);
    setDragState({
      shapeId,
      startX: x,
      startY: y,
      startPoints: [...blueprintModel.getShape(shapeId).points]
    });
  };

  // Add event listeners for dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMoveDrag = (event) => {
      if (mode !== 'edit') return;
      
      const { x, y } = getMousePosition(event);
      const deltaX = pixelsToMm(x - dragState.startX);
      const deltaY = pixelsToMm(y - dragState.startY);
      
      const newPoints = dragState.startPoints.map(point => ({
        x: point.x + deltaX,
        y: point.y + deltaY
      }));
      
      blueprintModel.updateShape(dragState.shapeId, { points: newPoints });
      onBlueprintChange(blueprintModel.toJSON());
    };

    const handleMouseUpDrag = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMoveDrag);
    document.addEventListener('mouseup', handleMouseUpDrag);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDrag);
      document.removeEventListener('mouseup', handleMouseUpDrag);
    };
  }, [dragState, mode, blueprintModel, onBlueprintChange]);

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const isSelected = selectedShape === shape.id;
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none',
      className: `shape ${isSelected ? 'selected' : ''}`,
      onClick: (e) => handleShapeClick(e, shape.id),
      onMouseDown: (e) => handleShapeMouseDown(e, shape.id),
      style: {
        cursor: mode === 'edit' ? 'move' : 'pointer'
      }
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
    
    return (
      <g>
        {drawingTool === 'line' ? (
          <polyline
            points={points}
            stroke="#3498db"
            strokeWidth={mmToPixels(0.5)}
            fill="none"
            strokeDasharray="3,3"
            className="current-path"
          />
        ) : (
          <polygon
            points={points}
            stroke="#3498db"
            strokeWidth={mmToPixels(0.5)}
            fill="rgba(52, 152, 219, 0.1)"
            strokeDasharray="3,3"
            className="current-path"
          />
        )}
      </g>
    );
  };

  return (
    <div className="svg-editor">
      <div className="editor-controls">
        <div className="mode-buttons">
          <button 
            className={`mode-btn ${mode === 'view' ? 'active' : ''}`}
            onClick={() => {
              setMode('view');
              setSelectedShape(null);
            }}
          >
            👁️ View
          </button>
          <button 
            className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => {
              setMode('edit');
              setSelectedShape(null);
            }}
          >
            ✏️ Edit
          </button>
          <button 
            className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => {
              setMode('draw');
              setSelectedShape(null);
            }}
          >
            🖊️ Draw
          </button>
        </div>
        
        {mode === 'draw' && (
          <div className="drawing-tools">
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
        )}
        
        <div className="mouse-coords">
          {Math.round(pixelsToMm(mousePos.x))}mm, {Math.round(pixelsToMm(mousePos.y))}mm
        </div>
      </div>
      
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
        style={{ 
          cursor: mode === 'draw' ? 'crosshair' : mode === 'edit' ? 'move' : 'default' 
        }}
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
      
      {mode === 'draw' && (
        <div className="drawing-instructions">
          <p>
            <strong>{drawingTool === 'line' ? 'Line Tool:' : drawingTool === 'rectangle' ? 'Rectangle Tool:' : 'Polygon Tool:'}</strong>
            {drawingTool === 'line' && ' Click and drag to draw a line'}
            {drawingTool === 'rectangle' && ' Click and drag to draw a rectangle'}
            {drawingTool === 'polygon' && ' Click to add points, double-click to finish'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SVGEditor;