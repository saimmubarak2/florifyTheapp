/**
 * FloorplanWrapper - Wraps the Floorplan builder for integration with Florify
 * Provides callbacks for exporting PNGs when the floorplan is complete
 */

import { useState, useCallback, useEffect } from "react";
import { WizardSteps } from "@/components/WizardSteps";
import { PlotSizePanel } from "@/components/PlotSizePanel";
import { HouseShapePanel } from "@/components/HouseShapePanel";
import { AddDoorsPanel } from "@/components/AddDoorsPanel";
import { WallsPanel } from "@/components/WallsPanel";
import { AddDrivewaysPanel } from "@/components/AddDrivewaysPanel";
import { AddPathwaysPanel } from "@/components/AddPathwaysPanel";
import { PatioPanel } from "@/components/PatioPanel";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportFloorplanToDataURL } from "@/lib/export-canvas";
import { extractMeasurements } from "@/lib/measurements";
import {
  type WizardStep,
  type FloorplanShape,
  type ViewTransform,
  type ToolType,
  type Door,
  type DoorType,
  type Driveway,
  type DrivewayWidth,
  type DrivewaySurface,
  type Pathway,
  type PathwaySurface,
  type Patio,
  type PatioWidth,
  type PatioSurface,
  A2_WIDTH_FT,
  A2_HEIGHT_FT,
} from "@shared/schema";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const initialViewTransform: ViewTransform = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

export interface FloorplanExportData {
  floorplanData: {
    shapes: FloorplanShape[];
    doors: Door[];
    driveways: Driveway[];
    pathways: Pathway[];
    patios: Patio[];
  };
  skinnedPNG: string;
  nonSkinnedPNG: string;
  measurements: ReturnType<typeof extractMeasurements>;
}

interface FloorplanWrapperProps {
  onComplete: (data: FloorplanExportData) => void;
  onCancel?: () => void;
}

export default function FloorplanWrapper({ onComplete, onCancel }: FloorplanWrapperProps) {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('plot-size');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [shapes, setShapes] = useState<FloorplanShape[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [patios, setPatios] = useState<Patio[]>([]);
  const [viewTransform, setViewTransform] = useState<ViewTransform>(initialViewTransform);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedDrivewayId, setSelectedDrivewayId] = useState<string | null>(null);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);
  const [selectedPatioId, setSelectedPatioId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [doorPlacementMode, setDoorPlacementMode] = useState<{ active: boolean; doorType: DoorType; width: number }>({ active: false, doorType: 'single', width: 3 });
  const [drivewayDrawingMode, setDrivewayDrawingMode] = useState<{ active: boolean; widthType: DrivewayWidth; surfaceType: DrivewaySurface }>({ active: false, widthType: 'single', surfaceType: 'concrete' });
  const [pathwayDrawingMode, setPathwayDrawingMode] = useState<{ active: boolean; width: number; surfaceType: PathwaySurface }>({ active: false, width: 3, surfaceType: 'concrete' });
  const [patioDrawingMode, setPatioDrawingMode] = useState<{ active: boolean; widthType: PatioWidth; surfaceType: PatioSurface }>({ active: false, widthType: 'small', surfaceType: 'wooden' });
  const [isExporting, setIsExporting] = useState(false);

  const selectedShape = shapes.find(s => s.id === selectedShapeId) || null;
  const selectedDoor = doors.find(d => d.id === selectedDoorId) || null;

  // Wizard Navigation
  const handleNext = useCallback(() => {
    const stepOrder: WizardStep[] = ['plot-size', 'house-shape', 'add-doors', 'walls', 'add-driveways', 'add-pathways', 'add-patios', 'export-save'];
    const currentIndex = stepOrder.indexOf(currentStep);

    // Validate current step
    if (currentStep === 'plot-size' && shapes.length === 0) {
      toast({
        title: "Plot Required",
        description: "Please create a plot boundary before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentIndex < stepOrder.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }, [currentStep, completedSteps, shapes.length, toast]);

  const handlePrevious = useCallback(() => {
    const stepOrder: WizardStep[] = ['plot-size', 'house-shape', 'add-doors', 'walls', 'add-driveways', 'add-pathways', 'add-patios', 'export-save'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  // Complete and export
  const handleComplete = useCallback(async () => {
    if (shapes.length === 0) {
      toast({
        title: "No Floorplan",
        description: "Please create at least a plot boundary before completing.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      toast({
        title: "Exporting...",
        description: "Generating floorplan images",
      });

      // Export with skins
      const skinnedPNG = await exportFloorplanToDataURL(
        shapes, doors, driveways, pathways, patios,
        { format: 'png', dpi: '150', includeGrid: false, includeMeasurements: true, includeSkins: true }
      );

      // Export without skins
      const nonSkinnedPNG = await exportFloorplanToDataURL(
        shapes, doors, driveways, pathways, patios,
        { format: 'png', dpi: '150', includeGrid: false, includeMeasurements: true, includeSkins: false }
      );

      // Extract measurements
      const measurements = extractMeasurements({ shapes, driveways });

      // Call the callback with all data
      onComplete({
        floorplanData: {
          shapes,
          doors,
          driveways,
          pathways,
          patios,
        },
        skinnedPNG,
        nonSkinnedPNG,
        measurements,
      });

      toast({
        title: "Complete!",
        description: "Floorplan exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export floorplan",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [shapes, doors, driveways, pathways, patios, onComplete, toast]);

  // Plot Creation
  const handleCreatePreset = useCallback((width: number, height: number) => {
    const centerX = A2_WIDTH_FT / 2;
    const centerY = A2_HEIGHT_FT / 2;
    const startX = centerX - (width / 2);
    const startY = centerY - (height / 2);
    
    const newShape: FloorplanShape = {
      id: crypto.randomUUID(),
      type: 'rectangle',
      vertices: [
        { x: startX, y: startY },
        { x: startX + width, y: startY },
        { x: startX + width, y: startY + height },
        { x: startX, y: startY + height },
      ],
      strokeMm: 0.25,
      strokeColor: '#1e3a8a',
      layer: 'plot',
      labelVisibility: true,
      lockAspect: false,
      name: 'Plot Boundary',
      rotation: 0,
    };

    setShapes([newShape]);
    setSelectedShapeId(newShape.id);
    toast({
      title: "Plot Created",
      description: `Created ${width} × ${height} ft plot boundary`,
    });
  }, [toast]);

  const handleStartCustomDraw = useCallback(() => {
    setActiveTool('freehand');
    toast({
      title: "Custom Draw Mode",
      description: "Draw your custom boundary. Click 'Esc' or right-click when done.",
    });
  }, [toast]);

  const handleReset = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
    toast({
      title: "Plot Reset",
      description: "All shapes have been removed",
    });
  }, [toast]);

  // House Shape Creation
  const handleCreateHouseShape = useCallback((shapeType: 'rectangular' | 'l-shaped' | 'mirror-l' | 'u-shaped') => {
    const plotShape = shapes.find(s => s.layer === 'plot');
    if (!plotShape) {
      toast({
        title: "No Plot Found",
        description: "Please create a plot boundary first",
        variant: "destructive",
      });
      return;
    }

    const plotXs = plotShape.vertices.map(v => v.x);
    const plotYs = plotShape.vertices.map(v => v.y);
    const plotCenterX = (Math.min(...plotXs) + Math.max(...plotXs)) / 2;
    const plotCenterY = (Math.min(...plotYs) + Math.max(...plotYs)) / 2;

    const size = 10;
    let vertices: { x: number; y: number }[] = [];

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
      case 'mirror-l':
        vertices = [
          { x: plotCenterX - size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY - size / 2 },
          { x: plotCenterX + size / 2, y: plotCenterY + size / 2 },
          { x: plotCenterX, y: plotCenterY + size / 2 },
          { x: plotCenterX, y: plotCenterY },
          { x: plotCenterX - size / 2, y: plotCenterY },
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
    }

    const newShape: FloorplanShape = {
      id: crypto.randomUUID(),
      type: 'polygon',
      vertices,
      strokeMm: 0.25,
      strokeColor: '#9a3412',
      layer: 'house',
      labelVisibility: true,
      lockAspect: false,
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} House`,
      rotation: 0,
    };

    setShapes([...shapes, newShape]);
    setSelectedShapeId(newShape.id);
    toast({
      title: "House Shape Created",
      description: `Added ${shapeType} house outline`,
    });
  }, [shapes, toast]);

  const handleStartHouseCustomDraw = useCallback(() => {
    setActiveTool('polygon');
    toast({
      title: "Custom House Draw Mode",
      description: "Click to draw house outline. Right-click or Esc when done.",
    });
  }, [toast]);

  // Door Management
  const handleAddDoor = useCallback((doorType: DoorType, width: number) => {
    setDoorPlacementMode({ active: true, doorType, width });
    setActiveTool('select');
    toast({
      title: "Door Placement Mode",
      description: "Click on a house wall to place the door",
    });
  }, [toast]);

  const handlePlaceDoor = useCallback((door: Door) => {
    setDoors([...doors, door]);
    setDoorPlacementMode({ active: false, doorType: 'single', width: 3 });
    toast({
      title: "Door Added",
      description: "Door placed on wall successfully",
    });
  }, [doors, toast]);

  const handleUpdateDoor = useCallback((doorId: string, updates: Partial<Door>) => {
    setDoors(doors.map(d => d.id === doorId ? { ...d, ...updates } : d));
  }, [doors]);

  const handleDeleteDoor = useCallback((doorId: string) => {
    setDoors(doors.filter(d => d.id !== doorId));
    if (selectedDoorId === doorId) {
      setSelectedDoorId(null);
    }
  }, [doors, selectedDoorId]);

  // Driveway Management
  const handleStartDrivewayDrawing = useCallback((widthType: DrivewayWidth, surfaceType: DrivewaySurface) => {
    setDrivewayDrawingMode({ active: true, widthType, surfaceType });
    setActiveTool('rectangle');
    toast({
      title: "Driveway Drawing Mode",
      description: "Click and drag on the canvas to draw a driveway rectangle",
    });
  }, [toast]);

  const handleUpdateDriveway = useCallback((drivewayId: string, updates: Partial<Driveway>) => {
    setDriveways(driveways.map(d => d.id === drivewayId ? { ...d, ...updates } : d));
  }, [driveways]);

  const handleDeleteDriveway = useCallback((drivewayId: string) => {
    setDriveways(driveways.filter(d => d.id !== drivewayId));
    if (selectedDrivewayId === drivewayId) {
      setSelectedDrivewayId(null);
    }
  }, [driveways, selectedDrivewayId]);

  // Pathway Management
  const handleStartPathwayDrawing = useCallback((width: number, surfaceType: PathwaySurface) => {
    setPathwayDrawingMode({ active: true, width, surfaceType });
    setActiveTool('freehand');
    toast({
      title: "Pathway Drawing Mode",
      description: "Click and hold to draw a freehand curved pathway",
    });
  }, [toast]);

  const handleUpdatePathway = useCallback((pathwayId: string, updates: Partial<Pathway>) => {
    setPathways(pathways.map(p => p.id === pathwayId ? { ...p, ...updates } : p));
  }, [pathways]);

  const handleDeletePathway = useCallback((pathwayId: string) => {
    setPathways(pathways.filter(p => p.id !== pathwayId));
    if (selectedPathwayId === pathwayId) {
      setSelectedPathwayId(null);
    }
  }, [pathways, selectedPathwayId]);

  // Patio Management
  const handleStartPatioDrawing = useCallback((widthType: PatioWidth, surfaceType: PatioSurface) => {
    setPatioDrawingMode({ active: true, widthType, surfaceType });
    setActiveTool('rectangle');
    toast({
      title: "Patio Drawing Mode",
      description: "Draw a rectangle for your patio. The width will be constrained automatically.",
    });
  }, [toast]);

  const handleUpdatePatio = useCallback((patioId: string, updates: Partial<Patio>) => {
    setPatios(patios.map(p => p.id === patioId ? { ...p, ...updates } : p));
  }, [patios]);

  const handleDeletePatio = useCallback((patioId: string) => {
    setPatios(patios.filter(p => p.id !== patioId));
    if (selectedPatioId === patioId) {
      setSelectedPatioId(null);
    }
  }, [patios, selectedPatioId]);

  // Shape Updates
  const handleUpdateShape = useCallback((updates: Partial<FloorplanShape>) => {
    if (!selectedShapeId) return;

    setShapes(shapes.map(s =>
      s.id === selectedShapeId ? { ...s, ...updates } : s
    ));
  }, [selectedShapeId, shapes]);

  // Drawing Mode Reset Handlers
  const handleResetDrivewayDrawingMode = useCallback(() => {
    setDrivewayDrawingMode({ active: false, widthType: 'single', surfaceType: 'concrete' });
    setActiveTool('select');
  }, []);

  const handleResetPatioDrawingMode = useCallback(() => {
    setPatioDrawingMode({ active: false, widthType: 'small', surfaceType: 'wooden' });
    setActiveTool('select');
  }, []);

  const handleResetPathwayDrawingMode = useCallback(() => {
    setPathwayDrawingMode({ active: false, width: 3, surfaceType: 'concrete' });
    setActiveTool('select');
  }, []);

  // View Controls
  const handleZoomIn = useCallback(() => {
    setViewTransform(t => ({ ...t, zoom: Math.min(t.zoom * 1.2, 5) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewTransform(t => ({ ...t, zoom: Math.max(t.zoom / 1.2, 0.1) }));
  }, []);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < commandHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, commandHistory.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setActiveTool('select');
      if (e.key === '2') setActiveTool('line');
      if (e.key === '3') setActiveTool('rectangle');
      if (e.key === '4') setActiveTool('polygon');
      if (e.key === '5') setActiveTool('freehand');
      if (e.key === '6') setActiveTool('delete');
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setActiveTool(prev => prev === 'pan' ? 'select' : 'pan');
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        if (selectedShapeId) {
          setShapes(shapes.filter(s => s.id !== selectedShapeId));
          setSelectedShapeId(null);
        } else if (selectedDoorId) {
          handleDeleteDoor(selectedDoorId);
        }
      }

      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        setGridEnabled(!gridEnabled);
      }

      if (e.key === 'Escape' && doorPlacementMode.active) {
        setDoorPlacementMode({ active: false, doorType: 'single', width: 3 });
        toast({
          title: "Cancelled",
          description: "Door placement cancelled",
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, selectedDoorId, shapes, gridEnabled, snapEnabled, doorPlacementMode.active, handleUndo, handleRedo, handleDeleteDoor, toast]);

  const getStepPrompt = (): string => {
    switch (currentStep) {
      case 'plot-size':
        return 'Guide us on how big your house is. Choose a plot or draw custom.';
      case 'house-shape':
        return 'Tell us about house shape.';
      case 'add-doors':
        return 'Add doors to your house walls. Click a wall segment to place doors.';
      case 'walls':
        return 'Draw walls using the polygon tool. Walls will be drawn in purple.';
      case 'add-driveways':
        return 'Add driveways to your property. Choose width and surface type, then draw on canvas.';
      case 'add-pathways':
        return 'Add pathways to your property. Choose width and surface type, then draw freehand curved paths.';
      case 'add-patios':
        return 'Add patios to your property. Choose size and surface type, then draw on canvas.';
      case 'export-save':
        return 'Your floorplan is ready! Click "Complete & Save" to finish.';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Steps Bar */}
      <div className="h-20 border-b px-8 flex items-center justify-between bg-muted/20">
        <WizardSteps
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
        
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'plot-size'}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          {currentStep === 'export-save' ? (
            <Button
              onClick={handleComplete}
              disabled={isExporting || shapes.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Complete & Save
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentStep === 'export-save'}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r bg-muted/5 overflow-y-auto flex-shrink-0 shadow-sm">
          {currentStep === 'plot-size' && (
            <PlotSizePanel
              onCreatePreset={handleCreatePreset}
              onStartCustomDraw={handleStartCustomDraw}
              onReset={handleReset}
              hasPlot={shapes.length > 0}
            />
          )}
          {currentStep === 'house-shape' && (
            <HouseShapePanel
              onCreateHouseShape={handleCreateHouseShape}
              onStartCustomDraw={handleStartHouseCustomDraw}
            />
          )}
          {currentStep === 'add-doors' && (
            <AddDoorsPanel
              onAddDoor={handleAddDoor}
              isPlacementMode={doorPlacementMode.active}
            />
          )}
          {currentStep === 'walls' && (
            <WallsPanel
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />
          )}
          {currentStep === 'add-driveways' && (
            <AddDrivewaysPanel
              onStartDrawing={handleStartDrivewayDrawing}
              isDrawingMode={drivewayDrawingMode.active}
            />
          )}
          {currentStep === 'add-pathways' && (
            <AddPathwaysPanel
              onStartDrawing={handleStartPathwayDrawing}
              isDrawingMode={pathwayDrawingMode.active}
            />
          )}
          {currentStep === 'add-patios' && (
            <PatioPanel
              onStartDrawing={handleStartPatioDrawing}
              isDrawingMode={patioDrawingMode.active}
            />
          )}
          {currentStep === 'export-save' && (
            <div className="p-4">
              <h3 className="text-base font-semibold mb-4">Complete Your Floorplan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your floorplan is ready! Click "Complete & Save" to generate the images and save your garden.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <strong>What will be saved:</strong>
                </p>
                <ul className="text-xs text-green-700 mt-2 space-y-1">
                  <li>✓ Styled floorplan image (with textures)</li>
                  <li>✓ Blueprint image (code lines only)</li>
                  <li>✓ All measurements and dimensions</li>
                </ul>
              </div>
              <Button
                onClick={handleComplete}
                disabled={isExporting || shapes.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isExporting ? 'Exporting...' : 'Complete & Save'}
              </Button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <FloorplanCanvas
              shapes={shapes}
              doors={doors}
              driveways={driveways}
              pathways={pathways}
              patios={patios}
              viewTransform={viewTransform}
              selectedShapeId={selectedShapeId}
              selectedDoorId={selectedDoorId}
              selectedDrivewayId={selectedDrivewayId}
              selectedPathwayId={selectedPathwayId}
              selectedPatioId={selectedPatioId}
              activeTool={activeTool}
              gridEnabled={gridEnabled}
              snapEnabled={snapEnabled}
              currentStep={currentStep}
              doorPlacementMode={doorPlacementMode}
              drivewayDrawingMode={drivewayDrawingMode}
              pathwayDrawingMode={pathwayDrawingMode}
              patioDrawingMode={patioDrawingMode}
              onShapesChange={setShapes}
              onDoorsChange={setDoors}
              onDrivewaysChange={setDriveways}
              onPathwaysChange={setPathways}
              onPatiosChange={setPatios}
              onViewTransformChange={setViewTransform}
              onSelectShape={setSelectedShapeId}
              onSelectDoor={setSelectedDoorId}
              onSelectDriveway={setSelectedDrivewayId}
              onSelectPathway={setSelectedPathwayId}
              onSelectPatio={setSelectedPatioId}
              onPlaceDoor={handlePlaceDoor}
              onResetDrivewayDrawingMode={handleResetDrivewayDrawingMode}
              onResetPatioDrawingMode={handleResetPatioDrawingMode}
              onResetPathwayDrawingMode={handleResetPathwayDrawingMode}
            />
          </div>

          {/* Step Prompt */}
          <div className="h-14 border-t px-6 flex items-center bg-muted/20">
            <p className="text-sm font-medium text-foreground">{getStepPrompt()}</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l bg-muted/5 overflow-y-auto flex-shrink-0 shadow-sm">
          <PropertiesPanel
            selectedShape={selectedShape}
            selectedDoor={selectedDoor}
            onUpdateShape={handleUpdateShape}
            onUpdateDoor={handleUpdateDoor}
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        gridEnabled={gridEnabled}
        snapEnabled={snapEnabled}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={() => {}}
        onSave={() => {}}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < commandHistory.length - 1}
      />
    </div>
  );
}
