/**
 * Measurement extraction utilities for floorplan data
 * Extracts distances and dimensions from the floorplan shapes
 */

import type { FloorplanShape, Driveway } from "@shared/schema";

export interface FloorplanMeasurements {
  // Plot dimensions
  plotWidth: number;
  plotHeight: number;
  
  // Building dimensions
  buildingWidth: number;
  buildingHeight: number;
  
  // Distances from building to boundaries
  buildingToBottomBoundary: number;
  buildingToTopBoundary: number;
  buildingToLeftBoundary: number;
  buildingToRightBoundary: number;
  
  // Driveway measurements
  drivewayPosition: 'left' | 'right' | 'center' | 'none';
  drivewayDistanceFromOppositeWall: number;
  drivewayWidth: number;
  drivewayLength: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Get bounding box of a shape
 */
function getBounds(vertices: { x: number; y: number }[]): Bounds {
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/**
 * Round to 2 decimal places
 */
function roundFeet(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Extract all measurements from floorplan data
 */
export function extractMeasurements(data: {
  shapes: FloorplanShape[];
  driveways: Driveway[];
}): FloorplanMeasurements {
  const { shapes, driveways } = data;
  
  // Find plot and house shapes
  const plotShape = shapes.find(s => s.layer === 'plot');
  const houseShape = shapes.find(s => s.layer === 'house');
  
  // Default measurements
  const measurements: FloorplanMeasurements = {
    plotWidth: 0,
    plotHeight: 0,
    buildingWidth: 0,
    buildingHeight: 0,
    buildingToBottomBoundary: 0,
    buildingToTopBoundary: 0,
    buildingToLeftBoundary: 0,
    buildingToRightBoundary: 0,
    drivewayPosition: 'none',
    drivewayDistanceFromOppositeWall: 0,
    drivewayWidth: 0,
    drivewayLength: 0,
  };
  
  if (!plotShape) {
    return measurements;
  }
  
  // Calculate plot dimensions
  const plotBounds = getBounds(plotShape.vertices);
  measurements.plotWidth = roundFeet(plotBounds.maxX - plotBounds.minX);
  measurements.plotHeight = roundFeet(plotBounds.maxY - plotBounds.minY);
  
  // Calculate building dimensions and distances
  if (houseShape) {
    const houseBounds = getBounds(houseShape.vertices);
    measurements.buildingWidth = roundFeet(houseBounds.maxX - houseBounds.minX);
    measurements.buildingHeight = roundFeet(houseBounds.maxY - houseBounds.minY);
    
    // Distance from building to plot boundaries
    // Bottom boundary = plot bottom to house bottom
    measurements.buildingToBottomBoundary = roundFeet(houseBounds.minY - plotBounds.minY);
    // Top boundary = house top to plot top
    measurements.buildingToTopBoundary = roundFeet(plotBounds.maxY - houseBounds.maxY);
    // Left boundary = house left to plot left
    measurements.buildingToLeftBoundary = roundFeet(houseBounds.minX - plotBounds.minX);
    // Right boundary = plot right to house right
    measurements.buildingToRightBoundary = roundFeet(plotBounds.maxX - houseBounds.maxX);
  }
  
  // Calculate driveway measurements
  if (driveways.length > 0) {
    const driveway = driveways[0]; // Use first driveway
    const drivewayBounds = getBounds(driveway.vertices);
    
    measurements.drivewayWidth = roundFeet(drivewayBounds.maxX - drivewayBounds.minX);
    measurements.drivewayLength = roundFeet(drivewayBounds.maxY - drivewayBounds.minY);
    
    // Determine driveway position relative to plot center
    const plotCenterX = (plotBounds.minX + plotBounds.maxX) / 2;
    const drivewayCenterX = (drivewayBounds.minX + drivewayBounds.maxX) / 2;
    
    if (drivewayCenterX < plotCenterX - 5) {
      measurements.drivewayPosition = 'left';
      // Distance from right edge of driveway to right boundary of plot
      measurements.drivewayDistanceFromOppositeWall = roundFeet(plotBounds.maxX - drivewayBounds.maxX);
    } else if (drivewayCenterX > plotCenterX + 5) {
      measurements.drivewayPosition = 'right';
      // Distance from left edge of driveway to left boundary of plot
      measurements.drivewayDistanceFromOppositeWall = roundFeet(drivewayBounds.minX - plotBounds.minX);
    } else {
      measurements.drivewayPosition = 'center';
      // For centered driveway, use average distance to both sides
      const leftDist = drivewayBounds.minX - plotBounds.minX;
      const rightDist = plotBounds.maxX - drivewayBounds.maxX;
      measurements.drivewayDistanceFromOppositeWall = roundFeet(Math.min(leftDist, rightDist));
    }
  }
  
  return measurements;
}

/**
 * Get a human-readable summary of measurements
 */
export function getMeasurementSummary(measurements: FloorplanMeasurements): string {
  const lines: string[] = [];
  
  lines.push(`Plot: ${measurements.plotWidth} × ${measurements.plotHeight} ft`);
  
  if (measurements.buildingWidth > 0) {
    lines.push(`Building: ${measurements.buildingWidth} × ${measurements.buildingHeight} ft`);
    lines.push(`Building to bottom boundary: ${measurements.buildingToBottomBoundary} ft`);
    lines.push(`Building to top boundary: ${measurements.buildingToTopBoundary} ft`);
    lines.push(`Building to left boundary: ${measurements.buildingToLeftBoundary} ft`);
    lines.push(`Building to right boundary: ${measurements.buildingToRightBoundary} ft`);
  }
  
  if (measurements.drivewayPosition !== 'none') {
    lines.push(`Driveway position: ${measurements.drivewayPosition}`);
    lines.push(`Driveway: ${measurements.drivewayWidth} × ${measurements.drivewayLength} ft`);
    lines.push(`Driveway distance from opposite wall: ${measurements.drivewayDistanceFromOppositeWall} ft`);
  }
  
  return lines.join('\n');
}
