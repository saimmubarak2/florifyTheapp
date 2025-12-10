/**
 * Utility functions to extract measurements from the floorplan
 * 
 * Key measurements:
 * 1. Distance from bottom-most building line to bottom boundary wall
 * 2. Distance from driveway to boundary walls (left or right based on driveway position)
 */

/**
 * Extract all relevant measurements from a blueprint model
 * @param {BlueprintModel} blueprintModel - The blueprint model containing shapes
 * @returns {Object} Object containing all extracted measurements
 */
export const extractFloorplanMeasurements = (blueprintModel) => {
  const shapes = blueprintModel.data.shapes || [];
  const pageWidth = blueprintModel.data.page.width_mm;
  const pageHeight = blueprintModel.data.page.height_mm;

  // Separate shapes by role
  const buildings = shapes.filter(s => s.role === 'building');
  const pathways = shapes.filter(s => s.role === 'pathway');
  const boundaries = shapes.filter(s => s.role === 'boundary');

  // Calculate measurements
  const measurements = {
    // Basic page info
    pageWidth: pageWidth,
    pageHeight: pageHeight,
    
    // Building measurements
    buildingBounds: getBuildingBounds(buildings),
    
    // Boundary measurements
    boundaryBounds: getBoundaryBounds(boundaries),
    
    // Distance calculations
    buildingToBottomBoundary: null,
    drivewayToBoundary: null,
    drivewayPosition: null,
    
    // Summary counts
    buildingCount: buildings.length,
    pathwayCount: pathways.length,
    boundaryCount: boundaries.length,
    
    // Raw measurements in feet (1mm = 0.00328084 feet, assuming scale 1:100 -> 1mm = 0.328084 feet)
    rawMeasurements: {}
  };

  // Calculate building to bottom boundary distance
  if (buildings.length > 0 && boundaries.length > 0) {
    const buildingBottomMostY = measurements.buildingBounds?.maxY || 0;
    const boundaryBottomY = measurements.boundaryBounds?.maxY || pageHeight;
    
    // Distance in mm (in the drawing)
    const distanceMm = boundaryBottomY - buildingBottomMostY;
    
    // Convert to feet (scale 1:100 means 1mm in drawing = 100mm real = 0.328 feet)
    const distanceFeet = mmToFeet(distanceMm);
    
    measurements.buildingToBottomBoundary = {
      mm: Math.round(distanceMm * 100) / 100,
      feet: Math.round(distanceFeet * 100) / 100,
      description: 'Distance from bottom-most building line to bottom boundary wall'
    };
  }

  // Calculate driveway to boundary distance
  if (pathways.length > 0 && boundaries.length > 0) {
    const drivewayInfo = analyzeDriveway(pathways, boundaries, pageWidth);
    measurements.drivewayToBoundary = drivewayInfo.distance;
    measurements.drivewayPosition = drivewayInfo.position;
  }

  // Calculate additional measurements
  measurements.rawMeasurements = {
    totalBuildingArea: calculateTotalArea(buildings),
    totalPathwayLength: calculateTotalLength(pathways),
    propertyPerimeter: calculatePerimeter(boundaries)
  };

  return measurements;
};

/**
 * Get the bounding box of all buildings
 */
const getBuildingBounds = (buildings) => {
  if (buildings.length === 0) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  buildings.forEach(building => {
    building.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return {
    minX: Math.round(minX * 100) / 100,
    minY: Math.round(minY * 100) / 100,
    maxX: Math.round(maxX * 100) / 100,
    maxY: Math.round(maxY * 100) / 100,
    width: Math.round((maxX - minX) * 100) / 100,
    height: Math.round((maxY - minY) * 100) / 100
  };
};

/**
 * Get the bounding box of all boundaries
 */
const getBoundaryBounds = (boundaries) => {
  if (boundaries.length === 0) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  boundaries.forEach(boundary => {
    boundary.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return {
    minX: Math.round(minX * 100) / 100,
    minY: Math.round(minY * 100) / 100,
    maxX: Math.round(maxX * 100) / 100,
    maxY: Math.round(maxY * 100) / 100,
    width: Math.round((maxX - minX) * 100) / 100,
    height: Math.round((maxY - minY) * 100) / 100
  };
};

/**
 * Analyze driveway position and calculate distance to boundary
 */
const analyzeDriveway = (pathways, boundaries, pageWidth) => {
  if (pathways.length === 0 || boundaries.length === 0) {
    return { distance: null, position: null };
  }

  // Find the main driveway (usually the largest pathway or one near the edge)
  // For simplicity, we'll use the first pathway as the main driveway
  // In a real implementation, you might want to detect this more intelligently
  
  // Get all pathway points
  let allPathwayPoints = [];
  pathways.forEach(pathway => {
    allPathwayPoints = allPathwayPoints.concat(pathway.points);
  });

  // Find the leftmost and rightmost points of pathways
  const pathwayMinX = Math.min(...allPathwayPoints.map(p => p.x));
  const pathwayMaxX = Math.max(...allPathwayPoints.map(p => p.x));
  const pathwayCenterX = (pathwayMinX + pathwayMaxX) / 2;

  // Get boundary bounds
  const boundaryBounds = getBoundaryBounds(boundaries);
  if (!boundaryBounds) {
    return { distance: null, position: null };
  }

  // Determine if driveway is on left or right side of the page
  const pageCenterX = pageWidth / 2;
  const isOnLeft = pathwayCenterX < pageCenterX;
  const position = isOnLeft ? 'left' : 'right';

  // Calculate distance to relevant boundary
  let distanceMm;
  let description;

  if (isOnLeft) {
    // Driveway is on left - measure from right boundary wall to inner line of driveway
    const drivewayInnerX = pathwayMaxX; // Inner edge of driveway (right side)
    distanceMm = boundaryBounds.maxX - drivewayInnerX;
    description = 'Distance from right boundary wall to inner edge of driveway (driveway on left)';
  } else {
    // Driveway is on right - measure from left boundary wall to inner line of driveway
    const drivewayInnerX = pathwayMinX; // Inner edge of driveway (left side)
    distanceMm = drivewayInnerX - boundaryBounds.minX;
    description = 'Distance from left boundary wall to inner edge of driveway (driveway on right)';
  }

  const distanceFeet = mmToFeet(distanceMm);

  return {
    distance: {
      mm: Math.round(distanceMm * 100) / 100,
      feet: Math.round(distanceFeet * 100) / 100,
      description
    },
    position
  };
};

/**
 * Calculate approximate total area of buildings (simplified)
 */
const calculateTotalArea = (buildings) => {
  let totalArea = 0;

  buildings.forEach(building => {
    // Simple polygon area calculation using shoelace formula
    const area = calculatePolygonArea(building.points);
    totalArea += area;
  });

  return {
    mm2: Math.round(totalArea * 100) / 100,
    sqft: Math.round(mm2ToSqFt(totalArea) * 100) / 100
  };
};

/**
 * Calculate polygon area using shoelace formula
 */
const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
};

/**
 * Calculate total length of pathways
 */
const calculateTotalLength = (pathways) => {
  let totalLength = 0;

  pathways.forEach(pathway => {
    for (let i = 0; i < pathway.points.length - 1; i++) {
      const p1 = pathway.points[i];
      const p2 = pathway.points[i + 1];
      const length = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      totalLength += length;
    }
  });

  return {
    mm: Math.round(totalLength * 100) / 100,
    feet: Math.round(mmToFeet(totalLength) * 100) / 100
  };
};

/**
 * Calculate perimeter of boundary
 */
const calculatePerimeter = (boundaries) => {
  let totalPerimeter = 0;

  boundaries.forEach(boundary => {
    for (let i = 0; i < boundary.points.length; i++) {
      const p1 = boundary.points[i];
      const p2 = boundary.points[(i + 1) % boundary.points.length];
      const length = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      totalPerimeter += length;
    }
  });

  return {
    mm: Math.round(totalPerimeter * 100) / 100,
    feet: Math.round(mmToFeet(totalPerimeter) * 100) / 100
  };
};

/**
 * Convert mm to feet (assuming scale 1:100)
 * 1mm in drawing = 100mm real = 0.328084 feet
 */
const mmToFeet = (mm) => {
  const SCALE = 100; // 1:100 scale
  const MM_PER_FOOT = 304.8;
  return (mm * SCALE) / MM_PER_FOOT;
};

/**
 * Convert mm² to square feet (assuming scale 1:100)
 */
const mm2ToSqFt = (mm2) => {
  const SCALE = 100; // 1:100 scale
  const MM_PER_FOOT = 304.8;
  const realMm2 = mm2 * SCALE * SCALE; // Apply scale to both dimensions
  return realMm2 / (MM_PER_FOOT * MM_PER_FOOT);
};

/**
 * Get a human-readable summary of measurements
 */
export const getMeasurementsSummary = (measurements) => {
  const summary = [];

  if (measurements.buildingToBottomBoundary) {
    summary.push({
      label: 'Building to Bottom Boundary',
      value: `${measurements.buildingToBottomBoundary.feet} ft`,
      detail: measurements.buildingToBottomBoundary.description
    });
  }

  if (measurements.drivewayToBoundary) {
    summary.push({
      label: 'Driveway to Boundary',
      value: `${measurements.drivewayToBoundary.feet} ft`,
      detail: measurements.drivewayToBoundary.description
    });
  }

  if (measurements.drivewayPosition) {
    summary.push({
      label: 'Driveway Position',
      value: measurements.drivewayPosition === 'left' ? 'Left side' : 'Right side',
      detail: `Driveway is located on the ${measurements.drivewayPosition} side of the property`
    });
  }

  if (measurements.rawMeasurements.totalBuildingArea) {
    summary.push({
      label: 'Total Building Area',
      value: `${measurements.rawMeasurements.totalBuildingArea.sqft} sq ft`,
      detail: 'Approximate total footprint of all buildings'
    });
  }

  if (measurements.rawMeasurements.propertyPerimeter) {
    summary.push({
      label: 'Property Perimeter',
      value: `${measurements.rawMeasurements.propertyPerimeter.feet} ft`,
      detail: 'Total length of boundary walls'
    });
  }

  return summary;
};

export default extractFloorplanMeasurements;
