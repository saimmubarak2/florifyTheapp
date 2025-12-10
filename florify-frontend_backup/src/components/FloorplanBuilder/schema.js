/**
 * Floorplan Schema and Constants
 * Converted from TypeScript to JavaScript for Florify integration
 */

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_EDITING_DPI = 96;
export const SNAP_THRESHOLD_FT = 0.5;
export const GRID_SPACING_FT = 5;
export const MM_TO_INCHES = 1 / 25.4;

// A2 sheet dimensions: 594mm x 420mm (portrait)
// Scale: 191.5ft in real world = 420mm on paper
export const A2_SHEET_WIDTH_MM = 594;
export const A2_SHEET_HEIGHT_MM = 420;

// Real world dimensions that fit on A2 sheet at the specified scale (portrait orientation)
export const A2_WIDTH_FT = 191.5;
export const A2_HEIGHT_FT = 191.5 * (A2_SHEET_WIDTH_MM / A2_SHEET_HEIGHT_MM); // ~270.64 ft

// Drawing area bounds (world coordinates in feet)
export const SHEET_BOUNDS = {
  minX: 0,
  minY: 0,
  maxX: A2_WIDTH_FT,
  maxY: A2_HEIGHT_FT,
};

// Preset plot sizes for Pakistan
export const PRESET_PLOTS = {
  '1-kanal': { width: 50, height: 90, name: '1 Kanal' },
  '10-marla': { width: 35, height: 65, name: '10 Marla' },
  '5-marla': { width: 25, height: 45, name: '5 Marla' },
};

// Step-based color mapping
export const STEP_COLORS = {
  'plot-size': '#1e3a8a',     // Dark blue for plot boundary
  'house-shape': '#9a3412',   // Brick red for house
  'add-doors': '#4b5563',     // Gray for doors
  'walls': '#9333ea',         // Purple for walls
  'add-driveways': '#78716c', // Stone gray for driveways
  'add-pathways': '#92400e',  // Brown for pathways
  'add-patios': '#ea580c',    // Orange for patios
  'export-save': '#000000',   // Black for export
};

// Driveway width in feet based on type
export const DRIVEWAY_WIDTHS = {
  'single': 8,
  'double': 16,
  'triple': 24,
};

// Patio width in feet based on type
export const PATIO_WIDTHS = {
  'small': 8,
  'medium': 12,
  'large': 16,
};

// Wizard steps
export const WIZARD_STEPS = [
  'plot-size',
  'house-shape',
  'add-doors',
  'walls',
  'add-driveways',
  'add-pathways',
  'add-patios',
  'export-save',
];

// ============================================
// INITIAL STATE
// ============================================

export const initialViewTransform = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

/**
 * Create a new floorplan shape
 */
export function createShape({
  type = 'rectangle',
  vertices = [],
  strokeMm = 0.25,
  strokeColor = '#000000',
  fill,
  layer = 'default',
  labelVisibility = true,
  lockAspect = false,
  name,
  rotation = 0,
}) {
  return {
    id: crypto.randomUUID(),
    type,
    vertices,
    strokeMm,
    strokeColor,
    fill,
    layer,
    labelVisibility,
    lockAspect,
    name,
    rotation,
  };
}

/**
 * Create a new door
 */
export function createDoor({
  type = 'single',
  position,
  width = 3,
  wallShapeId,
  wallSegmentIndex,
  rotation = 0,
  freeRotate = false,
}) {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    width,
    wallShapeId,
    wallSegmentIndex,
    rotation,
    freeRotate,
  };
}

/**
 * Create a new driveway
 */
export function createDriveway({
  widthType = 'single',
  surfaceType = 'concrete',
  vertices = [],
  rotation = 0,
}) {
  return {
    id: crypto.randomUUID(),
    widthType,
    surfaceType,
    vertices,
    rotation,
    layer: 'driveway',
  };
}

/**
 * Create a new pathway
 */
export function createPathway({
  width = 3,
  surfaceType = 'concrete',
  vertices = [],
  rotation = 0,
}) {
  return {
    id: crypto.randomUUID(),
    width,
    surfaceType,
    vertices,
    rotation,
    layer: 'pathway',
  };
}

/**
 * Create a new patio
 */
export function createPatio({
  widthType = 'small',
  surfaceType = 'wooden',
  vertices = [],
  rotation = 0,
}) {
  return {
    id: crypto.randomUUID(),
    widthType,
    surfaceType,
    vertices,
    rotation,
    layer: 'patio',
  };
}
