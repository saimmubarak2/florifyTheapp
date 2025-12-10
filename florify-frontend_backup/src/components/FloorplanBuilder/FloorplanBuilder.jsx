/**
 * FloorplanBuilder - An embeddable floorplan creation wizard
 * Integrated from the Replit floorplan builder
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_EDITING_DPI,
  GRID_SPACING_FT,
  SNAP_THRESHOLD_FT,
  STEP_COLORS,
  PRESET_PLOTS,
  DRIVEWAY_WIDTHS,
  PATIO_WIDTHS,
  A2_WIDTH_FT,
  A2_HEIGHT_FT,
  WIZARD_STEPS,
  initialViewTransform,
  createShape,
  createDoor,
  createDriveway,
  createPathway,
  createPatio,
} from './schema.js';
import {
  worldToCanvas,
  canvasToWorld,
  pixelsPerFoot,
  snapToGrid,
  findSnapTarget,
  createRectangleVertices,
  constrainRectangleWidth,
  getBounds,
} from './lib/coordinate-math.js';
import {
  drawShape,
  drawGrassSkin,
  drawRoof,
  drawWallSkin,
  drawDoorLine,
  drawDoorSkin,
  drawDoorHandles,
  drawDoorLabel,
  drawDrivewaySkin,
  drawDrivewayStructure,
  drawPathwaySkin,
  drawPathwayStructure,
  drawPathwaySelection,
  smoothPathway,
  drawPatioSkin,
  drawPatioStructure,
  drawPatioHandles,
  drawPatioLabels,
  findShapeAtPoint,
  findDoorAtPoint,
  findDrivewayAtPoint,
  findPathwayAtPoint,
  findPatioAtPoint,
  findWallSegmentAtPoint,
} from './lib/renderers.js';
import { generateFloorplanPNG } from './lib/export-canvas.js';
import { extractMeasurements, getMeasurementSummary } from './lib/measurements.js';
import './FloorplanBuilder.css';

const WIZARD_STEP_INFO = [
  { step: 'plot-size', title: 'Plot Size', description: 'Define your plot boundary' },
  { step: 'house-shape', title: 'House Shape', description: 'Draw your house outline' },
  { step: 'add-doors', title: 'Add Doors', description: 'Place doors on walls' },
  { step: 'walls', title: 'Boundary Walls', description: 'Draw boundary walls' },
  { step: 'add-driveways', title: 'Driveways', description: 'Add driveways' },
  { step: 'add-pathways', title: 'Pathways', description: 'Draw pathways' },
  { step: 'add-patios', title: 'Patios', description: 'Add patios' },
  { step: 'export-save', title: 'Complete', description: 'Review and finish' },
];

export default function FloorplanBuilder({ onComplete, onDataChange, initialData }) {
  // Canvas state
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  
  // Floorplan data
  const [shapes, setShapes] = useState(initialData?.shapes || []);
  const [doors, setDoors] = useState(initialData?.doors || []);
  const [driveways, setDriveways] = useState(initialData?.driveways || []);
  const [pathways, setPathways] = useState(initialData?.pathways || []);
  const [patios, setPatios] = useState(initialData?.patios || []);
  
  // View state
  const [viewTransform, setViewTransform] = useState(initialViewTransform);
  const [gridEnabled] = useState(true);
  const [snapEnabled] = useState(true);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState('plot-size');
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Selection state
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedDoorId, setSelectedDoorId] = useState(null);
  const [selectedDrivewayId, setSelectedDrivewayId] = useState(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState(null);
  const [selectedPatioId, setSelectedPatioId] = useState(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [snapPoint, setSnapPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);
  
  // Special modes
  const [doorPlacementMode, setDoorPlacementMode] = useState({ active: false, doorType: 'single', width: 3 });
  const [drivewayDrawingMode, setDrivewayDrawingMode] = useState({ active: false, widthType: 'single', surfaceType: 'concrete' });
  const [pathwayDrawingMode, setPathwayDrawingMode] = useState({ active: false, width: 3, surfaceType: 'concrete' });
  const [patioDrawingMode, setPatioDrawingMode] = useState({ active: false, widthType: 'small', surfaceType: 'wooden' });
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  
  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        shapes,
        doors,
        driveways,
        pathways,
        patios,
        currentStep,
      });
    }
  }, [shapes, doors, driveways, pathways, patios, currentStep, onDataChange]);
  
  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw A2 sheet background
    const sheetTopLeft = worldToCanvas({ x: 0, y: 0 }, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height);
    const sheetBottomRight = worldToCanvas({ x: A2_WIDTH_FT, y: A2_HEIGHT_FT }, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sheetTopLeft.x, sheetTopLeft.y, sheetBottomRight.x - sheetTopLeft.x, sheetBottomRight.y - sheetTopLeft.y);
    
    // Draw grid
    if (gridEnabled) {
      drawGrid(ctx, viewTransform, canvasSize, sheetTopLeft, sheetBottomRight);
    }
    
    // Draw grass skins for plots
    shapes.forEach(shape => {
      if (shape.layer === 'plot') {
        drawGrassSkin(ctx, shape, viewTransform, canvasSize);
      }
    });
    
    // Draw roofs
    shapes.forEach(shape => {
      drawRoof(ctx, shape, viewTransform, canvasSize);
    });
    
    // Draw driveways
    driveways.forEach(driveway => {
      drawDrivewaySkin(ctx, driveway, viewTransform, canvasSize);
      drawDrivewayStructure(ctx, driveway, viewTransform, canvasSize);
    });
    
    // Draw pathways
    pathways.forEach(pathway => {
      if (pathway.id === selectedPathwayId) {
        drawPathwaySelection(ctx, pathway, viewTransform, canvasSize);
      }
      drawPathwaySkin(ctx, pathway, viewTransform, canvasSize);
      drawPathwayStructure(ctx, pathway, viewTransform, canvasSize);
    });
    
    // Draw patios
    patios.forEach(patio => {
      drawPatioSkin(ctx, patio, viewTransform, canvasSize);
      drawPatioStructure(ctx, patio, viewTransform, canvasSize);
      if (patio.id === selectedPatioId) {
        drawPatioHandles(ctx, patio, viewTransform, canvasSize);
        drawPatioLabels(ctx, patio, viewTransform, canvasSize);
      }
    });
    
    // Draw shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, viewTransform, shape.id === selectedShapeId, canvasSize);
      drawWallSkin(ctx, shape, viewTransform, canvasSize);
    });
    
    // Draw doors
    doors.forEach(door => {
      const wallShape = shapes.find(s => s.id === door.wallShapeId);
      if (wallShape) {
        drawDoorLine(ctx, door, wallShape, viewTransform, canvasSize);
      }
      drawDoorSkin(ctx, door, viewTransform, canvasSize);
      if (door.id === selectedDoorId) {
        drawDoorHandles(ctx, door, viewTransform, canvasSize);
        drawDoorLabel(ctx, door, viewTransform, canvasSize);
      }
    });
    
    // Draw current drawing
    if (isDrawing && currentPoints.length > 0) {
      drawTemporaryShape(ctx, currentPoints, viewTransform, activeTool, canvasSize);
    }
    
    // Draw snap indicator
    if (snapPoint) {
      drawSnapIndicator(ctx, snapPoint, viewTransform, canvasSize);
    }
    
  }, [shapes, doors, driveways, pathways, patios, viewTransform, gridEnabled, selectedShapeId, selectedDoorId, selectedDrivewayId, selectedPathwayId, selectedPatioId, isDrawing, currentPoints, activeTool, snapPoint, canvasSize]);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = canvasToWorld(canvasPoint, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height);
    
    // Middle mouse button or space for pan
    if (e.button === 1) {
      setIsPanning(true);
      setPanStart(canvasPoint);
      return;
    }
    
    // Door placement mode
    if (doorPlacementMode.active) {
      const wallResult = findWallSegmentAtPoint(shapes, worldPoint, 1.0);
      if (wallResult) {
        const newDoor = createDoor({
          type: doorPlacementMode.doorType,
          position: wallResult.closestPoint,
          width: doorPlacementMode.width,
          wallShapeId: wallResult.shape.id,
          wallSegmentIndex: wallResult.segmentIndex,
          rotation: wallResult.rotation,
        });
        setDoors([...doors, newDoor]);
        setDoorPlacementMode({ active: false, doorType: 'single', width: 3 });
      }
      return;
    }
    
    // Select mode
    if (activeTool === 'select') {
      // Check for clicks on elements
      const clickedDoor = findDoorAtPoint(doors, worldPoint);
      if (clickedDoor) {
        setSelectedDoorId(clickedDoor.id);
        setSelectedShapeId(null);
        return;
      }
      
      const clickedPatio = findPatioAtPoint(patios, worldPoint);
      if (clickedPatio) {
        setSelectedPatioId(clickedPatio.id);
        setSelectedShapeId(null);
        return;
      }
      
      const clickedPathway = findPathwayAtPoint(pathways, worldPoint);
      if (clickedPathway) {
        setSelectedPathwayId(clickedPathway.id);
        setSelectedShapeId(null);
        return;
      }
      
      const clickedDriveway = findDrivewayAtPoint(driveways, worldPoint);
      if (clickedDriveway) {
        setSelectedDrivewayId(clickedDriveway.id);
        setSelectedShapeId(null);
        return;
      }
      
      const clickedShape = findShapeAtPoint(shapes, worldPoint);
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setSelectedDoorId(null);
      } else {
        setSelectedShapeId(null);
        setSelectedDoorId(null);
        setSelectedDrivewayId(null);
        setSelectedPathwayId(null);
        setSelectedPatioId(null);
      }
    } else {
      // Drawing mode
      const point = snapEnabled ? snapToGrid(worldPoint, GRID_SPACING_FT) : worldPoint;
      
      if (activeTool === 'polygon' && isDrawing) {
        setCurrentPoints(prev => [...prev, point]);
      } else {
        setIsDrawing(true);
        setCurrentPoints([point]);
      }
    }
  }, [activeTool, viewTransform, shapes, doors, driveways, pathways, patios, snapEnabled, doorPlacementMode, canvasSize, isDrawing]);
  
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = canvasToWorld(canvasPoint, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height);
    
    setMousePosition(worldPoint);
    
    // Handle panning
    if (isPanning && panStart) {
      const dx = canvasPoint.x - panStart.x;
      const dy = canvasPoint.y - panStart.y;
      
      setViewTransform({
        ...viewTransform,
        panX: viewTransform.panX + dx,
        panY: viewTransform.panY + dy,
      });
      
      setPanStart(canvasPoint);
      return;
    }
    
    if (isDrawing) {
      const shouldSnap = snapEnabled && !(pathwayDrawingMode.active && activeTool === 'freehand');
      const point = shouldSnap ? snapToGrid(worldPoint, GRID_SPACING_FT) : worldPoint;
      
      if (activeTool === 'freehand') {
        setCurrentPoints(prev => [...prev, point]);
      } else if (activeTool !== 'polygon') {
        setCurrentPoints(prev => [prev[0], point]);
      }
      
      // Check for snap targets
      if (shouldSnap) {
        const allVertices = shapes.flatMap(s => s.vertices);
        const snap = findSnapTarget(point, allVertices, SNAP_THRESHOLD_FT);
        setSnapPoint(snap);
      }
    }
  }, [isDrawing, activeTool, viewTransform, snapEnabled, shapes, isPanning, panStart, pathwayDrawingMode, canvasSize]);
  
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    if (activeTool === 'polygon') return;
    
    if (isDrawing && currentPoints.length >= 2) {
      // Create element based on current mode
      if (pathwayDrawingMode.active && activeTool === 'freehand') {
        const smoothedVertices = smoothPathway(currentPoints, 0.3);
        const newPathway = createPathway({
          width: pathwayDrawingMode.width,
          surfaceType: pathwayDrawingMode.surfaceType,
          vertices: smoothedVertices,
        });
        setPathways([...pathways, newPathway]);
        setPathwayDrawingMode({ active: false, width: 3, surfaceType: 'concrete' });
        setActiveTool('select');
      } else if (drivewayDrawingMode.active && activeTool === 'rectangle') {
        const rectVertices = createRectangleVertices(currentPoints);
        const drivewayWidth = DRIVEWAY_WIDTHS[drivewayDrawingMode.widthType];
        const constrainedVertices = constrainRectangleWidth(rectVertices, drivewayWidth);
        const newDriveway = createDriveway({
          widthType: drivewayDrawingMode.widthType,
          surfaceType: drivewayDrawingMode.surfaceType,
          vertices: constrainedVertices,
        });
        setDriveways([...driveways, newDriveway]);
        setDrivewayDrawingMode({ active: false, widthType: 'single', surfaceType: 'concrete' });
        setActiveTool('select');
      } else if (patioDrawingMode.active && activeTool === 'rectangle') {
        const rectVertices = createRectangleVertices(currentPoints);
        const patioWidth = PATIO_WIDTHS[patioDrawingMode.widthType];
        const constrainedVertices = constrainRectangleWidth(rectVertices, patioWidth);
        const newPatio = createPatio({
          widthType: patioDrawingMode.widthType,
          surfaceType: patioDrawingMode.surfaceType,
          vertices: constrainedVertices,
        });
        setPatios([...patios, newPatio]);
        setPatioDrawingMode({ active: false, widthType: 'small', surfaceType: 'wooden' });
        setActiveTool('select');
      } else {
        // Regular shape creation
        const strokeColor = STEP_COLORS[currentStep];
        const layer = currentStep === 'plot-size' ? 'plot' : currentStep === 'house-shape' ? 'house' : currentStep === 'walls' ? 'wall' : 'default';
        const name = currentStep === 'plot-size' ? 'Plot Boundary' : currentStep === 'house-shape' ? 'House' : currentStep === 'walls' ? 'Wall' : undefined;
        
        const newShape = createShape({
          type: activeTool === 'rectangle' ? 'rectangle' : activeTool === 'freehand' ? 'freehand' : 'polygon',
          vertices: activeTool === 'rectangle' ? createRectangleVertices(currentPoints) : currentPoints,
          strokeColor,
          layer,
          name,
        });
        
        setShapes([...shapes, newShape]);
        setSelectedShapeId(newShape.id);
      }
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setSnapPoint(null);
  }, [isDrawing, currentPoints, activeTool, shapes, driveways, pathways, patios, currentStep, drivewayDrawingMode, pathwayDrawingMode, patioDrawingMode, isPanning]);
  
  const handleDoubleClick = useCallback(() => {
    if (isDrawing && activeTool === 'polygon' && currentPoints.length >= 2) {
      const strokeColor = STEP_COLORS[currentStep];
      const layer = currentStep === 'plot-size' ? 'plot' : currentStep === 'house-shape' ? 'house' : currentStep === 'walls' ? 'wall' : 'default';
      const name = currentStep === 'plot-size' ? 'Plot Boundary' : currentStep === 'house-shape' ? 'House' : currentStep === 'walls' ? 'Wall' : undefined;
      
      const newShape = createShape({
        type: 'polygon',
        vertices: currentPoints,
        strokeColor,
        layer,
        name,
      });
      
      setShapes([...shapes, newShape]);
      setSelectedShapeId(newShape.id);
      
      setIsDrawing(false);
      setCurrentPoints([]);
      setSnapPoint(null);
    }
  }, [isDrawing, activeTool, currentPoints, shapes, currentStep]);
  
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewTransform(t => ({
      ...t,
      zoom: Math.min(5, Math.max(0.1, t.zoom * zoomFactor)),
    }));
  }, []);
  
  // Wizard navigation
  const handleNext = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    
    if (currentStep === 'plot-size' && shapes.filter(s => s.layer === 'plot').length === 0) {
      alert('Please create a plot boundary before proceeding.');
      return;
    }
    
    if (currentIndex < WIZARD_STEPS.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(WIZARD_STEPS[currentIndex + 1]);
      setActiveTool('select');
    }
  }, [currentStep, completedSteps, shapes]);
  
  const handlePrevious = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1]);
      setActiveTool('select');
    }
  }, [currentStep]);
  
  // Preset handlers
  const handleCreatePreset = useCallback((width, height) => {
    const centerX = A2_WIDTH_FT / 2;
    const centerY = A2_HEIGHT_FT / 2;
    const startX = centerX - (width / 2);
    const startY = centerY - (height / 2);
    
    const newShape = createShape({
      type: 'rectangle',
      vertices: [
        { x: startX, y: startY },
        { x: startX + width, y: startY },
        { x: startX + width, y: startY + height },
        { x: startX, y: startY + height },
      ],
      strokeColor: STEP_COLORS['plot-size'],
      layer: 'plot',
      name: 'Plot Boundary',
    });
    
    setShapes([newShape]);
    setSelectedShapeId(newShape.id);
  }, []);
  
  const handleCreateHouseShape = useCallback((shapeType) => {
    const plotShape = shapes.find(s => s.layer === 'plot');
    if (!plotShape) {
      alert('Please create a plot boundary first');
      return;
    }
    
    const plotBounds = getBounds(plotShape.vertices);
    const plotCenterX = (plotBounds.min.x + plotBounds.max.x) / 2;
    const plotCenterY = (plotBounds.min.y + plotBounds.max.y) / 2;
    
    const size = 10;
    let vertices = [];
    
    switch (shapeType) {
      case 'rectangular':
        vertices = [
          { x: plotCenterX - size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY + size / 2 },
          { x: plotCenterX - size / 2, y: plotCenterY + size / 2 },
        ];
        break;
      case 'l-shaped':
        vertices = [
          { x: plotCenterX - size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY },
          { x: plotCenterX, y: plotCenterY },
          { x: plotCenterX, y: plotCenterY + size / 2 },
          { x: plotCenterX - size / 2, y: plotCenterY + size / 2 },
        ];
        break;
      case 'u-shaped':
        vertices = [
          { x: plotCenterX - size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX - size / 4, y: plotCenterY - size / 2 },
          { x: plotCenterX - size / 4, y: plotCenterY + size / 4 },
          { x: plotCenterX + size / 4, y: plotCenterY + size / 4 },
          { x: plotCenterX + size / 4, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY + size / 2 },
          { x: plotCenterX - size / 2, y: plotCenterY + size / 2 },
        ];
        break;
      default:
        vertices = [
          { x: plotCenterX - size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY + size / 2 },
          { x: plotCenterX - size / 2, y: plotCenterY + size / 2 },
        ];
    }
    
    const newShape = createShape({
      type: 'polygon',
      vertices,
      strokeColor: STEP_COLORS['house-shape'],
      layer: 'house',
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} House`,
    });
    
    setShapes([...shapes, newShape]);
    setSelectedShapeId(newShape.id);
  }, [shapes]);
  
  // Delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedShapeId) {
      setShapes(shapes.filter(s => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    } else if (selectedDoorId) {
      setDoors(doors.filter(d => d.id !== selectedDoorId));
      setSelectedDoorId(null);
    } else if (selectedDrivewayId) {
      setDriveways(driveways.filter(d => d.id !== selectedDrivewayId));
      setSelectedDrivewayId(null);
    } else if (selectedPathwayId) {
      setPathways(pathways.filter(p => p.id !== selectedPathwayId));
      setSelectedPathwayId(null);
    } else if (selectedPatioId) {
      setPatios(patios.filter(p => p.id !== selectedPatioId));
      setSelectedPatioId(null);
    }
  }, [selectedShapeId, selectedDoorId, selectedDrivewayId, selectedPathwayId, selectedPatioId, shapes, doors, driveways, pathways, patios]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
      if (e.key === 'Escape') {
        setIsDrawing(false);
        setCurrentPoints([]);
        setDoorPlacementMode({ active: false, doorType: 'single', width: 3 });
        setDrivewayDrawingMode({ active: false, widthType: 'single', surfaceType: 'concrete' });
        setPathwayDrawingMode({ active: false, width: 3, surfaceType: 'concrete' });
        setPatioDrawingMode({ active: false, widthType: 'small', surfaceType: 'wooden' });
        setActiveTool('select');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected]);
  
  // Get current step info
  const currentStepInfo = WIZARD_STEP_INFO.find(s => s.step === currentStep);
  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
  const isLastStep = currentStep === 'export-save';
  
  // Handle completion
  const handleComplete = async () => {
    try {
      const floorplanData = { shapes, doors, driveways, pathways, patios };
      
      // Generate PNGs
      const skinnedPNG = await generateFloorplanPNG(floorplanData, true, 150);
      const nonSkinnedPNG = await generateFloorplanPNG(floorplanData, false, 150);
      
      // Extract measurements
      const measurements = extractMeasurements(floorplanData);
      const measurementSummary = getMeasurementSummary(measurements);
      
      if (onComplete) {
        onComplete({
          floorplanData,
          skinnedPNG,
          nonSkinnedPNG,
          measurements,
          measurementSummary,
        });
      }
    } catch (err) {
      console.error('Error completing floorplan:', err);
    }
  };
  
  return (
    <div className="floorplan-builder">
      {/* Wizard Steps Header */}
      <div className="floorplan-wizard-steps">
        {WIZARD_STEP_INFO.map((step, index) => (
          <div 
            key={step.step}
            className={`wizard-step ${currentStep === step.step ? 'active' : ''} ${completedSteps.includes(step.step) ? 'completed' : ''}`}
            onClick={() => {
              if (completedSteps.includes(step.step) || index <= currentStepIndex) {
                setCurrentStep(step.step);
              }
            }}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
      
      <div className="floorplan-main">
        {/* Left Panel */}
        <div className="floorplan-panel">
          <h3 className="panel-title">{currentStepInfo?.title}</h3>
          <p className="panel-description">{currentStepInfo?.description}</p>
          
          {/* Plot Size Panel */}
          {currentStep === 'plot-size' && (
            <div className="panel-content">
              <h4>Preset Sizes</h4>
              <div className="preset-buttons">
                {Object.entries(PRESET_PLOTS).map(([key, plot]) => (
                  <button
                    key={key}
                    className="preset-btn"
                    onClick={() => handleCreatePreset(plot.width, plot.height)}
                  >
                    {plot.name} ({plot.width} × {plot.height} ft)
                  </button>
                ))}
              </div>
              <div className="divider"></div>
              <h4>Custom Draw</h4>
              <button className="tool-btn" onClick={() => setActiveTool('rectangle')}>
                Draw Rectangle
              </button>
              <button className="tool-btn" onClick={() => setActiveTool('polygon')}>
                Draw Polygon
              </button>
              {shapes.filter(s => s.layer === 'plot').length > 0 && (
                <button className="reset-btn" onClick={() => setShapes(shapes.filter(s => s.layer !== 'plot'))}>
                  Reset Plot
                </button>
              )}
            </div>
          )}
          
          {/* House Shape Panel */}
          {currentStep === 'house-shape' && (
            <div className="panel-content">
              <h4>Preset Shapes</h4>
              <div className="preset-buttons">
                <button className="preset-btn" onClick={() => handleCreateHouseShape('rectangular')}>
                  Rectangular
                </button>
                <button className="preset-btn" onClick={() => handleCreateHouseShape('l-shaped')}>
                  L-Shaped
                </button>
                <button className="preset-btn" onClick={() => handleCreateHouseShape('u-shaped')}>
                  U-Shaped
                </button>
              </div>
              <div className="divider"></div>
              <h4>Custom Draw</h4>
              <button className="tool-btn" onClick={() => setActiveTool('polygon')}>
                Draw Custom House
              </button>
            </div>
          )}
          
          {/* Add Doors Panel */}
          {currentStep === 'add-doors' && (
            <div className="panel-content">
              <h4>Door Types</h4>
              <button
                className={`tool-btn ${doorPlacementMode.active && doorPlacementMode.doorType === 'single' ? 'active' : ''}`}
                onClick={() => setDoorPlacementMode({ active: true, doorType: 'single', width: 3 })}
              >
                Single Door (3ft)
              </button>
              <button
                className={`tool-btn ${doorPlacementMode.active && doorPlacementMode.doorType === 'double' ? 'active' : ''}`}
                onClick={() => setDoorPlacementMode({ active: true, doorType: 'double', width: 6 })}
              >
                Double Door (6ft)
              </button>
              {doorPlacementMode.active && (
                <p className="hint">Click on a wall to place the door</p>
              )}
            </div>
          )}
          
          {/* Walls Panel */}
          {currentStep === 'walls' && (
            <div className="panel-content">
              <h4>Draw Walls</h4>
              <button className="tool-btn" onClick={() => setActiveTool('polygon')}>
                Draw Wall Polygon
              </button>
              <button className="tool-btn" onClick={() => setActiveTool('freehand')}>
                Freehand Wall
              </button>
            </div>
          )}
          
          {/* Driveways Panel */}
          {currentStep === 'add-driveways' && (
            <div className="panel-content">
              <h4>Driveway Width</h4>
              {Object.entries(DRIVEWAY_WIDTHS).map(([type, width]) => (
                <button
                  key={type}
                  className={`tool-btn ${drivewayDrawingMode.active && drivewayDrawingMode.widthType === type ? 'active' : ''}`}
                  onClick={() => {
                    setDrivewayDrawingMode({ active: true, widthType: type, surfaceType: 'concrete' });
                    setActiveTool('rectangle');
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({width}ft)
                </button>
              ))}
              {drivewayDrawingMode.active && (
                <p className="hint">Draw a rectangle for the driveway</p>
              )}
            </div>
          )}
          
          {/* Pathways Panel */}
          {currentStep === 'add-pathways' && (
            <div className="panel-content">
              <h4>Pathway Width</h4>
              {[2, 3, 4, 5].map(width => (
                <button
                  key={width}
                  className={`tool-btn ${pathwayDrawingMode.active && pathwayDrawingMode.width === width ? 'active' : ''}`}
                  onClick={() => {
                    setPathwayDrawingMode({ active: true, width, surfaceType: 'concrete' });
                    setActiveTool('freehand');
                  }}
                >
                  {width}ft Wide
                </button>
              ))}
              {pathwayDrawingMode.active && (
                <p className="hint">Draw a curved path by clicking and dragging</p>
              )}
            </div>
          )}
          
          {/* Patios Panel */}
          {currentStep === 'add-patios' && (
            <div className="panel-content">
              <h4>Patio Size</h4>
              {Object.entries(PATIO_WIDTHS).map(([type, width]) => (
                <button
                  key={type}
                  className={`tool-btn ${patioDrawingMode.active && patioDrawingMode.widthType === type ? 'active' : ''}`}
                  onClick={() => {
                    setPatioDrawingMode({ active: true, widthType: type, surfaceType: 'wooden' });
                    setActiveTool('rectangle');
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({width}ft)
                </button>
              ))}
              {patioDrawingMode.active && (
                <p className="hint">Draw a rectangle for the patio</p>
              )}
            </div>
          )}
          
          {/* Export Panel */}
          {currentStep === 'export-save' && (
            <div className="panel-content">
              <h4>Your Floorplan is Ready!</h4>
              <p>Click "Complete" to save your floorplan with your garden.</p>
              
              {/* Measurements preview */}
              {shapes.length > 0 && (
                <div className="measurements-preview">
                  <h5>Measurements:</h5>
                  {(() => {
                    const m = extractMeasurements({ shapes, driveways });
                    const summary = getMeasurementSummary(m);
                    return (
                      <ul>
                        {summary.plot && <li>{summary.plot}</li>}
                        {summary.building && <li>{summary.building}</li>}
                        {m.buildingToBottomBoundary !== null && (
                          <li>Building to bottom boundary: {m.buildingToBottomBoundary.toFixed(1)} ft</li>
                        )}
                        {summary.driveway && <li>{summary.driveway}</li>}
                      </ul>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          
          {/* Navigation */}
          <div className="panel-nav">
            <button 
              className="nav-btn prev" 
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              ← Previous
            </button>
            {isLastStep ? (
              <button className="nav-btn complete" onClick={handleComplete}>
                Complete ✓
              </button>
            ) : (
              <button className="nav-btn next" onClick={handleNext}>
                Next →
              </button>
            )}
          </div>
        </div>
        
        {/* Canvas */}
        <div className="floorplan-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            className={`floorplan-canvas ${activeTool !== 'select' ? 'drawing' : ''}`}
          />
          
          {/* Canvas controls */}
          <div className="canvas-controls">
            <button onClick={() => setViewTransform({ ...viewTransform, zoom: Math.min(5, viewTransform.zoom * 1.2) })}>+</button>
            <span>{(viewTransform.zoom * 100).toFixed(0)}%</span>
            <button onClick={() => setViewTransform({ ...viewTransform, zoom: Math.max(0.1, viewTransform.zoom / 1.2) })}>−</button>
            <button onClick={() => setViewTransform(initialViewTransform)}>Reset</button>
          </div>
          
          {/* Tool indicator */}
          <div className="tool-indicator">
            Tool: {activeTool}
            {doorPlacementMode.active && ' (Placing Door)'}
            {drivewayDrawingMode.active && ' (Drawing Driveway)'}
            {pathwayDrawingMode.active && ' (Drawing Pathway)'}
            {patioDrawingMode.active && ' (Drawing Patio)'}
          </div>
          
          {/* Mouse position */}
          {mousePosition && (
            <div className="mouse-position">
              X: {mousePosition.x.toFixed(1)}ft | Y: {mousePosition.y.toFixed(1)}ft
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function drawGrid(ctx, viewTransform, canvasSize, sheetTopLeft, sheetBottomRight) {
  ctx.save();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  const ppf = pixelsPerFoot(DEFAULT_EDITING_DPI) * viewTransform.zoom;
  const gridSize = GRID_SPACING_FT * ppf;
  
  const sheetWidth = sheetBottomRight.x - sheetTopLeft.x;
  const sheetHeight = sheetBottomRight.y - sheetTopLeft.y;
  
  ctx.beginPath();
  ctx.rect(sheetTopLeft.x, sheetTopLeft.y, sheetWidth, sheetHeight);
  ctx.clip();
  
  for (let x = sheetTopLeft.x; x < sheetBottomRight.x; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, sheetTopLeft.y);
    ctx.lineTo(x, sheetBottomRight.y);
    ctx.stroke();
  }
  
  for (let y = sheetTopLeft.y; y < sheetBottomRight.y; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(sheetTopLeft.x, y);
    ctx.lineTo(sheetBottomRight.x, y);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawTemporaryShape(ctx, points, viewTransform, tool, canvasSize) {
  if (points.length < 2) return;
  
  const canvasPoints = points.map(p => worldToCanvas(p, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height));
  
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
  
  for (let i = 1; i < canvasPoints.length; i++) {
    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
  }
  
  if (tool === 'rectangle' && canvasPoints.length === 2) {
    const [start, end] = canvasPoints;
    ctx.lineTo(end.x, start.y);
    ctx.lineTo(start.x, start.y);
  }
  
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSnapIndicator(ctx, point, viewTransform, canvasSize) {
  const canvasPoint = worldToCanvas(point, viewTransform, DEFAULT_EDITING_DPI, canvasSize.width, canvasSize.height);
  
  ctx.save();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvasPoint.x, canvasPoint.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
