/**
 * Floorplan Measurements Extraction Utility
 * 
 * This utility extracts meaningful measurements from the floorplan data:
 * - Distance from bottom-most building line to bottom boundary wall
 * - Driveway distances from boundary walls (left or right depending on position)
 * - Other useful spatial relationships
 */

/**
 * Get the bounding box of a set of points
 */
const getBoundingBox = (points) => {
  if (!points || points.length === 0) return null;
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

/**
 * Get the overall bounding box for all shapes of a given role
 */
const getRoleBoundingBox = (shapes, role) => {
  const roleShapes = shapes.filter(s => s.role === role);
  if (roleShapes.length === 0) return null;
  
  const allPoints = roleShapes.flatMap(s => s.points || []);
  return getBoundingBox(allPoints);
};

/**
 * Determine if driveway is on left or right side of the page
 */
const getDrivewayPosition = (pathwayBounds, pageBounds) => {
  if (!pathwayBounds) return 'unknown';
  
  const pageCenter = pageBounds.width / 2;
  const pathwayCenter = pathwayBounds.centerX;
  
  return pathwayCenter < pageCenter ? 'left' : 'right';
};

/**
 * Extract all meaningful measurements from the floorplan
 * @param {BlueprintModel} blueprintModel - The blueprint model with shape data
 * @returns {Object} Measurements object with all extracted data
 */
export const extractFloorplanMeasurements = (blueprintModel) => {
  const shapes = blueprintModel.data.shapes || [];
  const pageData = blueprintModel.data.page;
  
  // Get bounding boxes for each role
  const buildingBounds = getRoleBoundingBox(shapes, 'building');
  const pathwayBounds = getRoleBoundingBox(shapes, 'pathway');
  const boundaryBounds = getRoleBoundingBox(shapes, 'boundary');
  
  // Page dimensions
  const pageBounds = {
    width: pageData.width_mm,
    height: pageData.height_mm,
    minX: 0,
    minY: 0,
    maxX: pageData.width_mm,
    maxY: pageData.height_mm
  };
  
  const measurements = {
    // Page info
    pageWidth_mm: pageBounds.width,
    pageHeight_mm: pageBounds.height,
    
    // Building measurements
    building: buildingBounds ? {
      width_mm: buildingBounds.width,
      height_mm: buildingBounds.height,
      topEdge_mm: buildingBounds.minY,
      bottomEdge_mm: buildingBounds.maxY,
      leftEdge_mm: buildingBounds.minX,
      rightEdge_mm: buildingBounds.maxX,
      centerX_mm: buildingBounds.centerX,
      centerY_mm: buildingBounds.centerY
    } : null,
    
    // Boundary measurements
    boundary: boundaryBounds ? {
      width_mm: boundaryBounds.width,
      height_mm: boundaryBounds.height,
      topEdge_mm: boundaryBounds.minY,
      bottomEdge_mm: boundaryBounds.maxY,
      leftEdge_mm: boundaryBounds.minX,
      rightEdge_mm: boundaryBounds.maxX
    } : null,
    
    // Pathway/Driveway measurements
    pathway: pathwayBounds ? {
      width_mm: pathwayBounds.width,
      height_mm: pathwayBounds.height,
      topEdge_mm: pathwayBounds.minY,
      bottomEdge_mm: pathwayBounds.maxY,
      leftEdge_mm: pathwayBounds.minX,
      rightEdge_mm: pathwayBounds.maxX,
      position: getDrivewayPosition(pathwayBounds, pageBounds)
    } : null,
    
    // Calculated distances
    distances: {}
  };
  
  // Calculate: Distance from bottom-most building line to bottom boundary wall
  if (buildingBounds && boundaryBounds) {
    measurements.distances.buildingToBottomBoundary_mm = 
      boundaryBounds.maxY - buildingBounds.maxY;
    
    measurements.distances.buildingToBottomBoundary_ft = 
      mmToFeet(boundaryBounds.maxY - buildingBounds.maxY);
  }
  
  // Calculate: Driveway distances from boundary walls
  if (pathwayBounds && boundaryBounds) {
    const drivewayPosition = measurements.pathway.position;
    
    if (drivewayPosition === 'left') {
      // Driveway is on the left, measure from RIGHT boundary wall to inner driveway edge
      measurements.distances.drivewayToRightBoundary_mm = 
        boundaryBounds.maxX - pathwayBounds.maxX;
      
      measurements.distances.drivewayToRightBoundary_ft = 
        mmToFeet(boundaryBounds.maxX - pathwayBounds.maxX);
      
      // Also measure from left boundary to driveway
      measurements.distances.drivewayToLeftBoundary_mm = 
        pathwayBounds.minX - boundaryBounds.minX;
      
      measurements.distances.drivewayToLeftBoundary_ft = 
        mmToFeet(pathwayBounds.minX - boundaryBounds.minX);
    } else if (drivewayPosition === 'right') {
      // Driveway is on the right, measure from LEFT boundary wall to inner driveway edge
      measurements.distances.drivewayToLeftBoundary_mm = 
        pathwayBounds.minX - boundaryBounds.minX;
      
      measurements.distances.drivewayToLeftBoundary_ft = 
        mmToFeet(pathwayBounds.minX - boundaryBounds.minX);
      
      // Also measure from right boundary to driveway
      measurements.distances.drivewayToRightBoundary_mm = 
        boundaryBounds.maxX - pathwayBounds.maxX;
      
      measurements.distances.drivewayToRightBoundary_ft = 
        mmToFeet(boundaryBounds.maxX - pathwayBounds.maxX);
    }
    
    // Driveway width
    measurements.distances.drivewayWidth_mm = pathwayBounds.width;
    measurements.distances.drivewayWidth_ft = mmToFeet(pathwayBounds.width);
  }
  
  // Calculate: Building to boundary distances (all sides)
  if (buildingBounds && boundaryBounds) {
    measurements.distances.buildingToTopBoundary_mm = 
      buildingBounds.minY - boundaryBounds.minY;
    
    measurements.distances.buildingToTopBoundary_ft = 
      mmToFeet(buildingBounds.minY - boundaryBounds.minY);
    
    measurements.distances.buildingToLeftBoundary_mm = 
      buildingBounds.minX - boundaryBounds.minX;
    
    measurements.distances.buildingToLeftBoundary_ft = 
      mmToFeet(buildingBounds.minX - boundaryBounds.minX);
    
    measurements.distances.buildingToRightBoundary_mm = 
      boundaryBounds.maxX - buildingBounds.maxX;
    
    measurements.distances.buildingToRightBoundary_ft = 
      mmToFeet(boundaryBounds.maxX - buildingBounds.maxX);
  }
  
  // Add count information
  measurements.shapeCounts = {
    buildings: shapes.filter(s => s.role === 'building').length,
    pathways: shapes.filter(s => s.role === 'pathway').length,
    boundaries: shapes.filter(s => s.role === 'boundary').length,
    total: shapes.length
  };
  
  return measurements;
};

/**
 * Convert mm to feet (using scale 1:100, where 1mm = 1cm on drawing = 100cm real = ~3.28ft)
 * Assuming 1mm on drawing = 10cm in reality (1:100 scale)
 */
const mmToFeet = (mm) => {
  // 1mm on drawing = 100mm (10cm) in reality at 1:100 scale
  // 1 foot = 304.8mm
  const realMm = mm * 100; // Scale up by 100
  const feet = realMm / 304.8;
  return Math.round(feet * 10) / 10; // Round to 1 decimal
};

/**
 * Format measurements for display
 */
export const formatMeasurements = (measurements) => {
  if (!measurements) return [];
  
  const formatted = [];
  
  if (measurements.distances.buildingToBottomBoundary_ft !== undefined) {
    formatted.push({
      label: 'Building to Bottom Boundary',
      value: `${measurements.distances.buildingToBottomBoundary_ft} ft`,
      valueMM: `${Math.round(measurements.distances.buildingToBottomBoundary_mm)} mm (drawing)`
    });
  }
  
  if (measurements.pathway?.position) {
    formatted.push({
      label: 'Driveway Position',
      value: measurements.pathway.position.charAt(0).toUpperCase() + measurements.pathway.position.slice(1),
      valueMM: ''
    });
  }
  
  if (measurements.pathway?.position === 'left' && measurements.distances.drivewayToRightBoundary_ft !== undefined) {
    formatted.push({
      label: 'Right Boundary to Driveway (Inner Edge)',
      value: `${measurements.distances.drivewayToRightBoundary_ft} ft`,
      valueMM: `${Math.round(measurements.distances.drivewayToRightBoundary_mm)} mm (drawing)`
    });
  }
  
  if (measurements.pathway?.position === 'right' && measurements.distances.drivewayToLeftBoundary_ft !== undefined) {
    formatted.push({
      label: 'Left Boundary to Driveway (Inner Edge)',
      value: `${measurements.distances.drivewayToLeftBoundary_ft} ft`,
      valueMM: `${Math.round(measurements.distances.drivewayToLeftBoundary_mm)} mm (drawing)`
    });
  }
  
  if (measurements.distances.drivewayWidth_ft !== undefined) {
    formatted.push({
      label: 'Driveway Width',
      value: `${measurements.distances.drivewayWidth_ft} ft`,
      valueMM: `${Math.round(measurements.distances.drivewayWidth_mm)} mm (drawing)`
    });
  }
  
  return formatted;
};

/**
 * Get summary text of key measurements
 */
export const getMeasurementsSummary = (measurements) => {
  if (!measurements) return 'No measurements available';
  
  const parts = [];
  
  if (measurements.distances.buildingToBottomBoundary_ft !== undefined) {
    parts.push(`Building to bottom boundary: ${measurements.distances.buildingToBottomBoundary_ft} ft`);
  }
  
  if (measurements.pathway?.position && measurements.distances.drivewayWidth_ft) {
    parts.push(`Driveway on ${measurements.pathway.position} side, width: ${measurements.distances.drivewayWidth_ft} ft`);
  }
  
  if (measurements.shapeCounts) {
    parts.push(`Total elements: ${measurements.shapeCounts.total}`);
  }
  
  return parts.join(' | ') || 'No measurements available';
};

export default {
  extractFloorplanMeasurements,
  formatMeasurements,
  getMeasurementsSummary
};
