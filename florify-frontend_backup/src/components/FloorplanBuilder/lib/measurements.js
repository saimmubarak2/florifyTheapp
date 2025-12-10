/**
 * Measurement extraction utilities for floorplan data
 * 
 * Extracts key measurements from the floorplan:
 * - Distance from bottom-most line of building to bottom boundary wall
 * - If driveway is on left: distance from right boundary wall to inner line of driveway
 * - If driveway is on right: distance from left boundary wall to inner line of driveway
 */

import { getBounds } from './coordinate-math.js';

/**
 * Extract all measurements from floorplan data
 * @param {Object} data - Floorplan data { shapes, driveways }
 * @returns {Object} - Extracted measurements
 */
export function extractMeasurements(data) {
  const { shapes = [], driveways = [] } = data;
  
  const measurements = {
    // Building to boundary measurements
    buildingToBottomBoundary: null,
    buildingToTopBoundary: null,
    buildingToLeftBoundary: null,
    buildingToRightBoundary: null,
    
    // Driveway measurements
    drivewayPosition: null, // 'left' or 'right'
    drivewayDistanceFromOppositeWall: null,
    drivewayWidth: null,
    drivewayLength: null,
    
    // Plot dimensions
    plotWidth: null,
    plotHeight: null,
    
    // Building dimensions
    buildingWidth: null,
    buildingHeight: null,
    
    // Raw bounds for advanced calculations
    plotBounds: null,
    buildingBounds: null,
    drivewayBounds: null,
  };
  
  // Find plot (boundary) and building (house) shapes
  const plotShapes = shapes.filter(s => s.layer === 'plot');
  const buildingShapes = shapes.filter(s => s.layer === 'house');
  
  // Calculate plot bounds (boundary walls)
  if (plotShapes.length > 0) {
    const allPlotVertices = plotShapes.flatMap(s => s.vertices);
    const plotBounds = getBounds(allPlotVertices);
    measurements.plotBounds = plotBounds;
    measurements.plotWidth = Math.abs(plotBounds.max.x - plotBounds.min.x);
    measurements.plotHeight = Math.abs(plotBounds.max.y - plotBounds.min.y);
  }
  
  // Calculate building bounds
  if (buildingShapes.length > 0) {
    const allBuildingVertices = buildingShapes.flatMap(s => s.vertices);
    const buildingBounds = getBounds(allBuildingVertices);
    measurements.buildingBounds = buildingBounds;
    measurements.buildingWidth = Math.abs(buildingBounds.max.x - buildingBounds.min.x);
    measurements.buildingHeight = Math.abs(buildingBounds.max.y - buildingBounds.min.y);
    
    // Calculate building to boundary distances
    if (measurements.plotBounds) {
      const plot = measurements.plotBounds;
      const building = buildingBounds;
      
      // Bottom boundary distance (Y increases downward in canvas coordinates)
      // In world coordinates, higher Y = further down
      measurements.buildingToBottomBoundary = roundFeet(plot.max.y - building.max.y);
      
      // Top boundary distance
      measurements.buildingToTopBoundary = roundFeet(building.min.y - plot.min.y);
      
      // Left boundary distance
      measurements.buildingToLeftBoundary = roundFeet(building.min.x - plot.min.x);
      
      // Right boundary distance
      measurements.buildingToRightBoundary = roundFeet(plot.max.x - building.max.x);
    }
  }
  
  // Calculate driveway measurements
  if (driveways.length > 0 && measurements.plotBounds) {
    const allDrivewayVertices = driveways.flatMap(d => d.vertices);
    const drivewayBounds = getBounds(allDrivewayVertices);
    measurements.drivewayBounds = drivewayBounds;
    
    // Calculate driveway dimensions
    const drivewayWidth = Math.abs(drivewayBounds.max.x - drivewayBounds.min.x);
    const drivewayHeight = Math.abs(drivewayBounds.max.y - drivewayBounds.min.y);
    
    // Determine if driveway is horizontal or vertical
    const isHorizontal = drivewayWidth > drivewayHeight;
    
    if (isHorizontal) {
      measurements.drivewayWidth = roundFeet(drivewayHeight);
      measurements.drivewayLength = roundFeet(drivewayWidth);
    } else {
      measurements.drivewayWidth = roundFeet(drivewayWidth);
      measurements.drivewayLength = roundFeet(drivewayHeight);
    }
    
    // Determine driveway position (left or right of plot center)
    const plotCenterX = (measurements.plotBounds.min.x + measurements.plotBounds.max.x) / 2;
    const drivewayCenterX = (drivewayBounds.min.x + drivewayBounds.max.x) / 2;
    
    if (drivewayCenterX < plotCenterX) {
      // Driveway is on the left side
      measurements.drivewayPosition = 'left';
      
      // Inner edge of driveway is the right edge
      const drivewayInnerEdge = drivewayBounds.max.x;
      
      // Distance from right boundary wall to inner line of driveway
      measurements.drivewayDistanceFromOppositeWall = roundFeet(
        measurements.plotBounds.max.x - drivewayInnerEdge
      );
    } else {
      // Driveway is on the right side
      measurements.drivewayPosition = 'right';
      
      // Inner edge of driveway is the left edge
      const drivewayInnerEdge = drivewayBounds.min.x;
      
      // Distance from left boundary wall to inner line of driveway
      measurements.drivewayDistanceFromOppositeWall = roundFeet(
        drivewayInnerEdge - measurements.plotBounds.min.x
      );
    }
  }
  
  return measurements;
}

/**
 * Round feet measurement to 1 decimal place
 */
function roundFeet(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Format measurement for display
 * @param {number} value - Value in feet
 * @returns {string} - Formatted string
 */
export function formatMeasurement(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)} ft`;
}

/**
 * Get a human-readable summary of the measurements
 * @param {Object} measurements - Measurements object from extractMeasurements
 * @returns {Object} - Human-readable summary
 */
export function getMeasurementSummary(measurements) {
  const summary = {
    plot: null,
    building: null,
    buildingPosition: null,
    driveway: null,
  };
  
  // Plot summary
  if (measurements.plotWidth && measurements.plotHeight) {
    summary.plot = `Plot: ${formatMeasurement(measurements.plotWidth)} × ${formatMeasurement(measurements.plotHeight)}`;
  }
  
  // Building summary
  if (measurements.buildingWidth && measurements.buildingHeight) {
    summary.building = `Building: ${formatMeasurement(measurements.buildingWidth)} × ${formatMeasurement(measurements.buildingHeight)}`;
  }
  
  // Building position summary
  if (measurements.buildingToBottomBoundary !== null) {
    const positions = [];
    if (measurements.buildingToTopBoundary > 0) {
      positions.push(`${formatMeasurement(measurements.buildingToTopBoundary)} from top`);
    }
    if (measurements.buildingToBottomBoundary > 0) {
      positions.push(`${formatMeasurement(measurements.buildingToBottomBoundary)} from bottom`);
    }
    if (measurements.buildingToLeftBoundary > 0) {
      positions.push(`${formatMeasurement(measurements.buildingToLeftBoundary)} from left`);
    }
    if (measurements.buildingToRightBoundary > 0) {
      positions.push(`${formatMeasurement(measurements.buildingToRightBoundary)} from right`);
    }
    summary.buildingPosition = `Building setbacks: ${positions.join(', ')}`;
  }
  
  // Driveway summary
  if (measurements.drivewayPosition) {
    summary.driveway = `Driveway on ${measurements.drivewayPosition}: ${formatMeasurement(measurements.drivewayWidth)} wide × ${formatMeasurement(measurements.drivewayLength)} long. ` +
      `Distance from ${measurements.drivewayPosition === 'left' ? 'right' : 'left'} boundary to inner edge: ${formatMeasurement(measurements.drivewayDistanceFromOppositeWall)}`;
  }
  
  return summary;
}
