/**
 * Rendering functions for floorplan elements
 */

import { worldToCanvas, pixelsPerFoot, mmToPixels, getBounds, distance, pointInPolygon } from './coordinate-math.js';
import { DEFAULT_EDITING_DPI, DRIVEWAY_WIDTHS, PATIO_WIDTHS } from '../schema.js';

// ============================================
// SHAPE RENDERER
// ============================================

export function drawShape(ctx, shape, viewTransform, isSelected, canvasSize, isHovered = false, dpi = DEFAULT_EDITING_DPI) {
  if (shape.vertices.length < 2) return;

  const canvasVertices = shape.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );

  ctx.save();

  // Draw fill if present
  if (shape.fill) {
    ctx.fillStyle = shape.fill;
    ctx.beginPath();
    ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
    for (let i = 1; i < canvasVertices.length; i++) {
      ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
    }
    if (shape.type !== 'line' && shape.type !== 'freehand') {
      ctx.closePath();
    }
    ctx.fill();
  }

  // Draw stroke
  const strokeWidth = mmToPixels(shape.strokeMm, dpi) * viewTransform.zoom;
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

  // Draw selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
    for (let i = 1; i < canvasVertices.length; i++) {
      ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
    }
    if (shape.type !== 'line' && shape.type !== 'freehand') {
      ctx.closePath();
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw hover highlight
  if (isHovered && !isSelected) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
    for (let i = 1; i < canvasVertices.length; i++) {
      ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
    }
    if (shape.type !== 'line' && shape.type !== 'freehand') {
      ctx.closePath();
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ============================================
// GRASS SKIN RENDERER
// ============================================

export function drawGrassSkin(ctx, shape, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (shape.vertices.length < 3) return;
  
  const canvasVertices = shape.vertices.map(v => 
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  
  // Light grass fill
  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

// ============================================
// ROOF RENDERER
// ============================================

export function drawRoof(ctx, shape, viewTransform, canvasSize, opacity = 0.9, dpi = DEFAULT_EDITING_DPI) {
  if (shape.layer !== 'house') return;
  if (shape.vertices.length < 3) return;

  const canvasVertices = shape.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );

  ctx.save();

  // Roof base color
  ctx.fillStyle = `rgba(120, 53, 15, ${opacity})`;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Add roof texture lines
  ctx.strokeStyle = `rgba(92, 45, 20, ${opacity * 0.5})`;
  ctx.lineWidth = 1;
  
  const bounds = getBounds(canvasVertices);
  const spacing = 6 * viewTransform.zoom;
  
  ctx.clip();
  for (let y = bounds.min.y; y < bounds.max.y; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(bounds.min.x, y);
    ctx.lineTo(bounds.max.x, y);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================
// WALL SKIN RENDERER
// ============================================

export function drawWallSkin(ctx, shape, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (shape.layer !== 'wall') return;
  if (shape.vertices.length < 2) return;

  const wallThickness = 0.5 * pixelsPerFoot(dpi) * viewTransform.zoom;

  for (let i = 0; i < shape.vertices.length; i++) {
    const j = (i + 1) % shape.vertices.length;
    const start = worldToCanvas(shape.vertices[i], viewTransform, dpi, canvasSize.width, canvasSize.height);
    const end = worldToCanvas(shape.vertices[j], viewTransform, dpi, canvasSize.width, canvasSize.height);

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

// ============================================
// DOOR RENDERER
// ============================================

export function drawDoorLine(ctx, door, wallShape, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  const v1 = wallShape.vertices[door.wallSegmentIndex];
  const v2 = wallShape.vertices[(door.wallSegmentIndex + 1) % wallShape.vertices.length];
  
  const doorPos = worldToCanvas(door.position, viewTransform, dpi, canvasSize.width, canvasSize.height);
  const doorWidth = door.width * pixelsPerFoot(dpi) * viewTransform.zoom;
  
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = mmToPixels(0.35, dpi) * viewTransform.zoom + 2;
  ctx.beginPath();
  ctx.moveTo(doorPos.x - ux * doorWidth / 2, doorPos.y - uy * doorWidth / 2);
  ctx.lineTo(doorPos.x + ux * doorWidth / 2, doorPos.y + uy * doorWidth / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawDoorSkin(ctx, door, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  const doorPos = worldToCanvas(door.position, viewTransform, dpi, canvasSize.width, canvasSize.height);
  const doorWidth = door.width * pixelsPerFoot(dpi) * viewTransform.zoom;
  
  ctx.save();
  ctx.translate(doorPos.x, doorPos.y);
  ctx.rotate((door.rotation || 0) * Math.PI / 180);
  
  // Door frame
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-doorWidth / 2, -3, doorWidth, 6);
  
  // Door panel
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(-doorWidth / 2 + 2, -2, doorWidth - 4, 4);
  
  ctx.restore();
}

export function drawDoorHandles(ctx, door, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  const doorPos = worldToCanvas(door.position, viewTransform, dpi, canvasSize.width, canvasSize.height);
  const doorWidth = door.width * pixelsPerFoot(dpi) * viewTransform.zoom;
  
  ctx.save();
  ctx.translate(doorPos.x, doorPos.y);
  ctx.rotate((door.rotation || 0) * Math.PI / 180);
  
  // Resize handles at door ends
  const handleSize = 6;
  ctx.fillStyle = '#3b82f6';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  
  // Start handle
  ctx.beginPath();
  ctx.arc(-doorWidth / 2, 0, handleSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // End handle
  ctx.beginPath();
  ctx.arc(doorWidth / 2, 0, handleSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

export function drawDoorLabel(ctx, door, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  const doorPos = worldToCanvas(door.position, viewTransform, dpi, canvasSize.width, canvasSize.height);
  
  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const label = `${door.width.toFixed(1)}ft`;
  const metrics = ctx.measureText(label);
  const padding = 3;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(doorPos.x - metrics.width / 2 - padding, doorPos.y + 8, metrics.width + padding * 2, 14);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, doorPos.x, doorPos.y + 10);
  
  ctx.restore();
}

// ============================================
// DRIVEWAY RENDERER
// ============================================

export function drawDrivewaySkin(ctx, driveway, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (driveway.vertices.length < 4) return;
  
  const canvasVertices = driveway.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  
  // Surface colors based on type
  const surfaceColors = {
    concrete: '#d1d5db',
    pebbles: '#a8a29e',
    brick: '#dc7633',
    stone: '#909497',
  };
  
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

export function drawDrivewayStructure(ctx, driveway, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (driveway.vertices.length < 4) return;
  
  const canvasVertices = driveway.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = mmToPixels(0.25, dpi) * viewTransform.zoom;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ============================================
// PATHWAY RENDERER
// ============================================

export function drawPathwaySkin(ctx, pathway, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (pathway.vertices.length < 2) return;
  
  const canvasVertices = pathway.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  const pathWidth = pathway.width * pixelsPerFoot(dpi) * viewTransform.zoom;
  
  ctx.save();
  
  const surfaceColors = {
    concrete: '#d1d5db',
    pebbles: '#a8a29e',
    brick: '#dc7633',
    stone: '#909497',
  };
  
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

export function drawPathwayStructure(ctx, pathway, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (pathway.vertices.length < 2) return;
  
  const canvasVertices = pathway.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = mmToPixels(0.25, dpi) * viewTransform.zoom;
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

export function drawPathwaySelection(ctx, pathway, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (pathway.vertices.length < 2) return;
  
  const canvasVertices = pathway.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  const pathWidth = pathway.width * pixelsPerFoot(dpi) * viewTransform.zoom;
  
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = pathWidth + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.restore();
}

export function smoothPathway(points, minDistance = 0.3) {
  if (points.length <= 2) return points;
  
  const smoothed = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const lastPoint = smoothed[smoothed.length - 1];
    if (distance(lastPoint, points[i]) >= minDistance) {
      smoothed.push(points[i]);
    }
  }
  
  if (smoothed.length === 1) {
    smoothed.push(points[points.length - 1]);
  }
  
  return smoothed;
}

// ============================================
// PATIO RENDERER
// ============================================

export function drawPatioSkin(ctx, patio, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (patio.vertices.length < 4) return;
  
  const canvasVertices = patio.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  
  const surfaceColors = {
    wooden: '#8b7355',
    marble: '#f0f0f0',
    concrete: '#c0c0c0',
  };
  
  ctx.fillStyle = surfaceColors[patio.surfaceType] || surfaceColors.wooden;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Add wooden plank texture for wooden patios
  if (patio.surfaceType === 'wooden') {
    ctx.clip();
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
    ctx.lineWidth = 1;
    
    const bounds = getBounds(canvasVertices);
    const spacing = 8 * viewTransform.zoom;
    
    for (let x = bounds.min.x; x < bounds.max.x; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.min.y);
      ctx.lineTo(x, bounds.max.y);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

export function drawPatioStructure(ctx, patio, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (patio.vertices.length < 4) return;
  
  const canvasVertices = patio.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = mmToPixels(0.7, dpi) * viewTransform.zoom;
  ctx.beginPath();
  ctx.moveTo(canvasVertices[0].x, canvasVertices[0].y);
  for (let i = 1; i < canvasVertices.length; i++) {
    ctx.lineTo(canvasVertices[i].x, canvasVertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPatioHandles(ctx, patio, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (patio.vertices.length < 4) return;
  
  const canvasVertices = patio.vertices.map(v =>
    worldToCanvas(v, viewTransform, dpi, canvasSize.width, canvasSize.height)
  );
  
  ctx.save();
  
  // Draw corner handles
  canvasVertices.forEach((v) => {
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(v.x - 4, v.y - 4, 8, 8);
    ctx.strokeRect(v.x - 4, v.y - 4, 8, 8);
  });
  
  // Draw edge midpoint handles
  for (let i = 0; i < canvasVertices.length; i++) {
    const next = (i + 1) % canvasVertices.length;
    const midX = (canvasVertices[i].x + canvasVertices[next].x) / 2;
    const midY = (canvasVertices[i].y + canvasVertices[next].y) / 2;
    
    ctx.beginPath();
    ctx.arc(midX, midY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

export function drawPatioLabels(ctx, patio, viewTransform, canvasSize, dpi = DEFAULT_EDITING_DPI) {
  if (patio.vertices.length < 4) return;
  
  const bounds = getBounds(patio.vertices);
  const width = Math.abs(bounds.max.x - bounds.min.x);
  const height = Math.abs(bounds.max.y - bounds.min.y);
  
  const center = worldToCanvas({
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2
  }, viewTransform, dpi, canvasSize.width, canvasSize.height);
  
  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const label = `${width.toFixed(1)} × ${height.toFixed(1)} ft`;
  const metrics = ctx.measureText(label);
  const padding = 4;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(center.x - metrics.width / 2 - padding, center.y - 8, metrics.width + padding * 2, 16);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, center.x, center.y);
  
  ctx.restore();
}

// ============================================
// HELPER FUNCTIONS FOR HIT TESTING
// ============================================

export function findShapeAtPoint(shapes, worldPoint) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (isPointInShape(worldPoint, shape)) {
      return shape;
    }
  }
  return null;
}

function isPointInShape(point, shape) {
  const tolerance = 0.5;
  const bounds = {
    min: {
      x: Math.min(...shape.vertices.map(v => v.x)) - tolerance,
      y: Math.min(...shape.vertices.map(v => v.y)) - tolerance,
    },
    max: {
      x: Math.max(...shape.vertices.map(v => v.x)) + tolerance,
      y: Math.max(...shape.vertices.map(v => v.y)) + tolerance,
    },
  };

  if (point.x < bounds.min.x || point.x > bounds.max.x ||
      point.y < bounds.min.y || point.y > bounds.max.y) {
    return false;
  }

  if (shape.type === 'polygon' || shape.type === 'rectangle') {
    return pointInPolygon(point, shape.vertices);
  }

  return true;
}

export function findDoorAtPoint(doors, worldPoint) {
  for (const door of doors) {
    const dx = worldPoint.x - door.position.x;
    const dy = worldPoint.y - door.position.y;
    if (Math.sqrt(dx * dx + dy * dy) < door.width / 2 + 0.5) {
      return door;
    }
  }
  return null;
}

export function findDrivewayAtPoint(driveways, worldPoint) {
  for (let i = driveways.length - 1; i >= 0; i--) {
    const driveway = driveways[i];
    if (driveway.vertices.length >= 4 && pointInPolygon(worldPoint, driveway.vertices)) {
      return driveway;
    }
  }
  return null;
}

export function findPathwayAtPoint(pathways, worldPoint) {
  for (let i = pathways.length - 1; i >= 0; i--) {
    const pathway = pathways[i];
    for (let j = 0; j < pathway.vertices.length - 1; j++) {
      const dist = distanceToSegment(worldPoint, pathway.vertices[j], pathway.vertices[j + 1]);
      if (dist < pathway.width / 2 + 0.5) {
        return pathway;
      }
    }
  }
  return null;
}

export function findPatioAtPoint(patios, worldPoint) {
  for (let i = patios.length - 1; i >= 0; i--) {
    const patio = patios[i];
    if (patio.vertices.length >= 4 && pointInPolygon(worldPoint, patio.vertices)) {
      return patio;
    }
  }
  return null;
}

function distanceToSegment(point, v, w) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.sqrt((point.x - v.x) ** 2 + (point.y - v.y) ** 2);
  
  let t = ((point.x - v.x) * (w.x - v.x) + (point.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projX = v.x + t * (w.x - v.x);
  const projY = v.y + t * (w.y - v.y);
  
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

export function findWallSegmentAtPoint(shapes, worldPoint, threshold = 1.0) {
  for (const shape of shapes) {
    if (shape.layer !== 'house') continue;
    
    for (let i = 0; i < shape.vertices.length; i++) {
      const j = (i + 1) % shape.vertices.length;
      const v1 = shape.vertices[i];
      const v2 = shape.vertices[j];
      
      const dist = distanceToSegment(worldPoint, v1, v2);
      if (dist < threshold) {
        // Calculate closest point on segment
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        const t = Math.max(0, Math.min(1, 
          ((worldPoint.x - v1.x) * dx + (worldPoint.y - v1.y) * dy) / (len * len)
        ));
        
        const closestPoint = {
          x: v1.x + t * dx,
          y: v1.y + t * dy,
        };
        
        const rotation = Math.atan2(dy, dx) * 180 / Math.PI;
        
        return {
          shape,
          segmentIndex: i,
          closestPoint,
          rotation,
        };
      }
    }
  }
  return null;
}
