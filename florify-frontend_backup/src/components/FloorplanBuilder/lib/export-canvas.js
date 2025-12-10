/**
 * Export utilities for generating PNG images from floorplan data
 */

import { pixelsPerFoot, getBounds } from './coordinate-math.js';
import { A2_WIDTH_FT, A2_HEIGHT_FT } from '../schema.js';

/**
 * Generate a PNG data URL from floorplan data
 * @param {Object} data - The floorplan data { shapes, doors, driveways, pathways, patios }
 * @param {boolean} includeSkins - Whether to include visual skins
 * @param {number} dpi - DPI for export (default 150)
 * @returns {Promise<string>} - Data URL of the PNG
 */
export async function generateFloorplanPNG(data, includeSkins = true, dpi = 150) {
  const { shapes = [], doors = [], driveways = [], pathways = [], patios = [] } = data;
  
  const ppf = pixelsPerFoot(dpi);
  
  // Calculate canvas size based on A2 dimensions
  const canvasWidth = A2_WIDTH_FT * ppf;
  const canvasHeight = A2_HEIGHT_FT * ppf;
  
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  const canvasSize = {
    width: canvasWidth,
    height: canvasHeight,
  };
  
  // Draw grid if requested (only for skinned version)
  if (includeSkins) {
    drawGrid(ctx, canvasWidth, canvasHeight, ppf);
  }
  
  // Draw skins first (grass, roofs) if requested
  if (includeSkins) {
    shapes.forEach(shape => {
      if (shape.layer === 'plot') {
        drawGrassSkinExport(ctx, shape, dpi, canvasSize);
      }
      if (shape.layer === 'house') {
        drawRoofExport(ctx, shape, dpi, canvasSize, 0.9);
      }
    });
  }
  
  // Draw driveways
  driveways.forEach(driveway => {
    if (includeSkins) {
      drawDrivewaySkinExport(ctx, driveway, dpi, canvasSize);
    }
    drawDrivewayStructureExport(ctx, driveway, dpi, canvasSize);
  });
  
  // Draw pathways
  pathways.forEach(pathway => {
    if (includeSkins) {
      drawPathwaySkinExport(ctx, pathway, dpi, canvasSize);
    }
    drawPathwayStructureExport(ctx, pathway, dpi, canvasSize);
  });
  
  // Draw patios
  patios.forEach(patio => {
    if (includeSkins) {
      drawPatioSkinExport(ctx, patio, dpi, canvasSize);
    }
    drawPatioStructureExport(ctx, patio, dpi, canvasSize);
  });
  
  // Draw shape outlines and wall skins
  shapes.forEach(shape => {
    drawShapeExport(ctx, shape, dpi, canvasSize);
    
    if (shape.layer === 'wall' && includeSkins) {
      drawWallSkinExport(ctx, shape, dpi, canvasSize);
    }
  });
  
  // Draw door lines
  doors.forEach(door => {
    const wallShape = shapes.find(s => s.id === door.wallShapeId);
    if (wallShape) {
      drawDoorLineExport(ctx, door, wallShape, dpi, canvasSize);
    }
  });
  
  // Draw door skins if requested
  if (includeSkins) {
    doors.forEach(door => {
      drawDoorSkinExport(ctx, door, dpi, canvasSize);
    });
  }
  
  // Convert to data URL
  return canvas.toDataURL('image/png');
}

// ============================================
// EXPORT-SPECIFIC RENDER FUNCTIONS
// ============================================

function worldToCanvasExport(point, dpi, canvasSize) {
  const ppf = pixelsPerFoot(dpi);
  // Direct mapping for export - center the A2 sheet
  const canvasCenterX = canvasSize.width / 2;
  const canvasCenterY = canvasSize.height / 2;
  
  const offsetX = point.x - (A2_WIDTH_FT / 2);
  const offsetY = point.y - (A2_HEIGHT_FT / 2);
  
  return {
    x: canvasCenterX + (offsetX * ppf),
    y: canvasCenterY + (offsetY * ppf),
  };
}

function drawGrid(ctx, width, height, ppf) {
  ctx.save();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  const gridSpacing = 5 * ppf;
  
  for (let x = 0; x <= width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawGrassSkinExport(ctx, shape, dpi, canvasSize) {
  if (shape.vertices.length < 3) return;
  
  const canvasVertices = shape.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  ctx.save();
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Add grass texture
  ctx.clip();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1;
  
  const bounds = getBounds(canvasVertices);
  const spacing = 5;
  
  for (let x = bounds.min.x; x < bounds.max.x; x += spacing) {
    for (let y = bounds.min.y; y < bounds.max.y; y += spacing) {
      const angle = Math.random() * Math.PI;
      const length = 3;
      const x1 = x + Math.random() * spacing;
      const y1 = y + Math.random() * spacing;
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

function drawRoofExport(ctx, shape, dpi, canvasSize, opacity) {
  if (shape.layer !== 'house' || shape.vertices.length < 3) return;
  
  const canvasVertices = shape.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  ctx.save();
  ctx.fillStyle = `rgba(120, 53, 15, ${opacity})`;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Roof texture
  ctx.strokeStyle = `rgba(92, 45, 20, ${opacity * 0.5})`;
  ctx.lineWidth = 1;
  ctx.clip();
  
  const bounds = getBounds(canvasVertices);
  const spacing = 6;
  
  for (let y = bounds.min.y; y < bounds.max.y; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(bounds.min.x, y);
    ctx.lineTo(bounds.max.x, y);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawShapeExport(ctx, shape, dpi, canvasSize) {
  if (shape.vertices.length < 2) return;
  
  const canvasVertices = shape.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  const strokeWidth = (shape.strokeMm / 25.4) * dpi;
  
  ctx.save();
  ctx.strokeStyle = shape.strokeColor;
  ctx.lineWidth = Math.max(1, strokeWidth);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  if (shape.type !== 'line' && shape.type !== 'freehand') {
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

function drawWallSkinExport(ctx, shape, dpi, canvasSize) {
  if (shape.layer !== 'wall' || shape.vertices.length < 2) return;
  
  const ppf = pixelsPerFoot(dpi);
  const wallThickness = 0.5 * ppf;
  
  for (let i = 0; i < shape.vertices.length; i++) {
    const j = (i + 1) % shape.vertices.length;
    const start = worldToCanvasExport(shape.vertices[i], dpi, canvasSize);
    const end = worldToCanvasExport(shape.vertices[j], dpi, canvasSize);
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    
    const nx = -dy / len;
    const ny = dx / len;
    
    ctx.save();
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(start.x + nx * wallThickness / 2, start.y + ny * wallThickness / 2);
    ctx.lineTo(end.x + nx * wallThickness / 2, end.y + ny * wallThickness / 2);
    ctx.lineTo(end.x - nx * wallThickness / 2, end.y - ny * wallThickness / 2);
    ctx.lineTo(start.x - nx * wallThickness / 2, start.y - ny * wallThickness / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawDoorLineExport(ctx, door, wallShape, dpi, canvasSize) {
  const ppf = pixelsPerFoot(dpi);
  const v1 = wallShape.vertices[door.wallSegmentIndex];
  const v2 = wallShape.vertices[(door.wallSegmentIndex + 1) % wallShape.vertices.length];
  
  const doorPos = worldToCanvasExport(door.position, dpi, canvasSize);
  const doorWidth = door.width * ppf;
  
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = (0.35 / 25.4) * dpi + 2;
  ctx.beginPath();
  ctx.moveTo(doorPos.x - ux * doorWidth / 2, doorPos.y - uy * doorWidth / 2);
  ctx.lineTo(doorPos.x + ux * doorWidth / 2, doorPos.y + uy * doorWidth / 2);
  ctx.stroke();
  ctx.restore();
}

function drawDoorSkinExport(ctx, door, dpi, canvasSize) {
  const ppf = pixelsPerFoot(dpi);
  const doorPos = worldToCanvasExport(door.position, dpi, canvasSize);
  const doorWidth = door.width * ppf;
  
  ctx.save();
  ctx.translate(doorPos.x, doorPos.y);
  ctx.rotate((door.rotation || 0) * Math.PI / 180);
  
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-doorWidth / 2, -3, doorWidth, 6);
  
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(-doorWidth / 2 + 2, -2, doorWidth - 4, 4);
  
  ctx.restore();
}

function drawDrivewaySkinExport(ctx, driveway, dpi, canvasSize) {
  if (driveway.vertices.length < 4) return;
  
  const canvasVertices = driveway.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  const surfaceColors = {
    concrete: '#d1d5db',
    pebbles: '#a8a29e',
    brick: '#dc7633',
    stone: '#909497',
  };
  
  ctx.save();
  ctx.fillStyle = surfaceColors[driveway.surfaceType] || surfaceColors.concrete;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDrivewayStructureExport(ctx, driveway, dpi, canvasSize) {
  if (driveway.vertices.length < 4) return;
  
  const canvasVertices = driveway.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  ctx.save();
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = (0.25 / 25.4) * dpi;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawPathwaySkinExport(ctx, pathway, dpi, canvasSize) {
  if (pathway.vertices.length < 2) return;
  
  const ppf = pixelsPerFoot(dpi);
  const canvasVertices = pathway.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  const pathWidth = pathway.width * ppf;
  
  const surfaceColors = {
    concrete: '#d1d5db',
    pebbles: '#a8a29e',
    brick: '#dc7633',
    stone: '#909497',
  };
  
  ctx.save();
  ctx.strokeStyle = surfaceColors[pathway.surfaceType] || surfaceColors.concrete;
  ctx.lineWidth = pathWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPathwayStructureExport(ctx, pathway, dpi, canvasSize) {
  if (pathway.vertices.length < 2) return;
  
  const canvasVertices = pathway.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  ctx.save();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = (0.25 / 25.4) * dpi;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPatioSkinExport(ctx, patio, dpi, canvasSize) {
  if (patio.vertices.length < 4) return;
  
  const canvasVertices = patio.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  const surfaceColors = {
    wooden: '#8b7355',
    marble: '#f0f0f0',
    concrete: '#c0c0c0',
  };
  
  ctx.save();
  ctx.fillStyle = surfaceColors[patio.surfaceType] || surfaceColors.wooden;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  if (patio.surfaceType === 'wooden') {
    ctx.clip();
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
    ctx.lineWidth = 1;
    
    const bounds = getBounds(canvasVertices);
    const spacing = 8;
    
    for (let x = bounds.min.x; x < bounds.max.x; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.min.y);
      ctx.lineTo(x, bounds.max.y);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

function drawPatioStructureExport(ctx, patio, dpi, canvasSize) {
  if (patio.vertices.length < 4) return;
  
  const canvasVertices = patio.vertices.map(v => worldToCanvasExport(v, dpi, canvasSize));
  
  ctx.save();
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = (0.7 / 25.4) * dpi;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
