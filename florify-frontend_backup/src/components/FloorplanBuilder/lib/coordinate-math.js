/**
 * Coordinate conversion and geometry helpers for the floorplan builder
 */

import {
  MM_TO_INCHES,
  A2_SHEET_HEIGHT_MM,
  A2_WIDTH_FT,
  A2_HEIGHT_FT,
} from '../schema.js';

// ============================================
// COORDINATE CONVERSION FUNCTIONS
// ============================================

export function pixelsPerFoot(dpi) {
  const paperHeightInches = A2_SHEET_HEIGHT_MM * MM_TO_INCHES;
  const paperHeightPixels = paperHeightInches * dpi;
  return paperHeightPixels / A2_WIDTH_FT;
}

export function mmToPixels(mm, dpi) {
  return (mm * MM_TO_INCHES) * dpi;
}

export function worldToCanvas(point, viewTransform, editingDPI, canvasWidth, canvasHeight) {
  const ppf = pixelsPerFoot(editingDPI);
  
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;
  
  const offsetX = point.x - (A2_WIDTH_FT / 2);
  const offsetY = point.y - (A2_HEIGHT_FT / 2);
  
  return {
    x: canvasCenterX + (offsetX * ppf * viewTransform.zoom) + viewTransform.panX,
    y: canvasCenterY + (offsetY * ppf * viewTransform.zoom) + viewTransform.panY,
  };
}

export function canvasToWorld(point, viewTransform, editingDPI, canvasWidth, canvasHeight) {
  const ppf = pixelsPerFoot(editingDPI);
  
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;
  
  const worldX = (point.x - canvasCenterX - viewTransform.panX) / (ppf * viewTransform.zoom);
  const worldY = (point.y - canvasCenterY - viewTransform.panY) / (ppf * viewTransform.zoom);
  
  return {
    x: worldX + (A2_WIDTH_FT / 2),
    y: worldY + (A2_HEIGHT_FT / 2),
  };
}

export function worldToExport(point, dpi, exportOrigin = { x: 0, y: 0 }) {
  const ppf = pixelsPerFoot(dpi);
  return {
    x: (point.x - exportOrigin.x) * ppf,
    y: (point.y - exportOrigin.y) * ppf,
  };
}

// ============================================
// GEOMETRY HELPERS
// ============================================

export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function polygonArea(vertices) {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

export function getBounds(vertices) {
  if (vertices.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }
  
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

export function getCenter(vertices) {
  const bounds = getBounds(vertices);
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
  };
}

// ============================================
// SNAPPING HELPERS
// ============================================

export function snapToGrid(point, gridSize) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function findSnapTarget(point, allVertices, threshold) {
  for (const vertex of allVertices) {
    if (distance(point, vertex) <= threshold) {
      return vertex;
    }
  }
  return null;
}

// ============================================
// POINT IN POLYGON TEST
// ============================================

export function pointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ============================================
// POLYLINE SIMPLIFICATION (Ramer-Douglas-Peucker)
// ============================================

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }
  
  const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  const den = Math.sqrt(dx * dx + dy * dy);
  
  return num / den;
}

export function simplifyPolyline(points, epsilon) {
  if (points.length <= 2) return points;
  
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }
  
  if (maxDistance > epsilon) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPolyline(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[points.length - 1]];
}

// ============================================
// RECTANGLE HELPERS
// ============================================

export function createRectangleVertices(points) {
  if (points.length !== 2) return points;

  const [start, end] = points;
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y },
  ];
}

export function constrainRectangleWidth(vertices, targetWidth) {
  if (vertices.length !== 4) return vertices;

  const width = Math.abs(vertices[1].x - vertices[0].x);
  const height = Math.abs(vertices[3].y - vertices[0].y);

  const isHorizontal = width > height;

  if (isHorizontal) {
    const centerY = (vertices[0].y + vertices[3].y) / 2;
    const halfWidth = targetWidth / 2;

    return [
      { x: vertices[0].x, y: centerY - halfWidth },
      { x: vertices[1].x, y: centerY - halfWidth },
      { x: vertices[2].x, y: centerY + halfWidth },
      { x: vertices[3].x, y: centerY + halfWidth },
    ];
  } else {
    const centerX = (vertices[0].x + vertices[1].x) / 2;
    const halfWidth = targetWidth / 2;

    return [
      { x: centerX - halfWidth, y: vertices[0].y },
      { x: centerX + halfWidth, y: vertices[1].y },
      { x: centerX + halfWidth, y: vertices[2].y },
      { x: centerX - halfWidth, y: vertices[3].y },
    ];
  }
}
