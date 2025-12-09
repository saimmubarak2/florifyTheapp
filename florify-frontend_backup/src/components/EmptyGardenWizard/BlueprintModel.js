/**
 * BlueprintModel - Core data model for garden blueprints
 * Manages the JSON structure and provides methods for blueprint manipulation
 */

export class BlueprintModel {
  constructor() {
    this.data = {
      page: { 
        width_mm: 210, 
        height_mm: 297, 
        units: "mm" 
      },
      templates: {
        selected: null,
        templatesList: [
          "rectangular-simple",
          "rectangular-with-porch", 
          "l-shaped",
          "u-shaped",
          "split-level",
          "colonial",
          "ranch",
          "modern-minimal",
          "cottage-style",
          "victorian"
        ]
      },
      shapes: []
    };
  }

  // Get the current blueprint data
  toJSON() {
    return JSON.parse(JSON.stringify(this.data));
  }

  // Load blueprint data
  fromJSON(jsonData) {
    this.data = JSON.parse(JSON.stringify(jsonData));
  }

  // Add a shape to the blueprint
  addShape(shape) {
    const newShape = {
      id: shape.id || this.generateId(),
      type: shape.type,
      role: shape.role,
      points: shape.points || [],
      openings: shape.openings || [],
      style: {
        stroke: shape.style?.stroke || "#2c3e50",
        weight_mm: shape.style?.weight_mm || 0.5,
        fill: shape.style?.fill || "none",
        ...shape.style
      }
    };
    
    this.data.shapes.push(newShape);
    return newShape;
  }

  // Update an existing shape
  updateShape(shapeId, updates) {
    const shapeIndex = this.data.shapes.findIndex(s => s.id === shapeId);
    if (shapeIndex !== -1) {
      this.data.shapes[shapeIndex] = {
        ...this.data.shapes[shapeIndex],
        ...updates
      };
      return this.data.shapes[shapeIndex];
    }
    return null;
  }

  // Remove a shape
  removeShape(shapeId) {
    this.data.shapes = this.data.shapes.filter(s => s.id !== shapeId);
  }

  // Get shapes by role
  getShapesByRole(role) {
    return this.data.shapes.filter(s => s.role === role);
  }

  // Get a specific shape
  getShape(shapeId) {
    return this.data.shapes.find(s => s.id === shapeId);
  }

  // Set selected house template
  setHouseTemplate(templateId) {
    this.data.templates.selected = templateId;
  }

  // Get house front template data
  getHouseTemplate(templateId) {
    const templates = {
      "rectangular-simple": {
        name: "Simple Rectangular",
        points: [[20, 20], [120, 20], [120, 80], [20, 80]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      },
      "rectangular-with-porch": {
        name: "Rectangular with Porch",
        points: [[20, 20], [120, 20], [120, 80], [20, 80]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      },
      "l-shaped": {
        name: "L-Shaped House",
        points: [[20, 20], [100, 20], [100, 60], [60, 60], [60, 80], [20, 80]],
        openings: [{ start: [40, 20], end: [60, 20] }]
      },
      "u-shaped": {
        name: "U-Shaped House",
        points: [[20, 20], [120, 20], [120, 40], [100, 40], [100, 60], [120, 60], [120, 80], [20, 80]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      },
      "split-level": {
        name: "Split Level",
        points: [[20, 20], [120, 20], [120, 50], [100, 50], [100, 80], [20, 80]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      },
      "colonial": {
        name: "Colonial Style",
        points: [[20, 20], [120, 20], [120, 80], [20, 80]],
        openings: [{ start: [45, 20], end: [75, 20] }]
      },
      "ranch": {
        name: "Ranch Style",
        points: [[20, 20], [140, 20], [140, 60], [20, 60]],
        openings: [{ start: [60, 20], end: [80, 20] }]
      },
      "modern-minimal": {
        name: "Modern Minimal",
        points: [[20, 20], [120, 20], [120, 70], [20, 70]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      },
      "cottage-style": {
        name: "Cottage Style",
        points: [[20, 20], [110, 20], [110, 75], [20, 75]],
        openings: [{ start: [45, 20], end: [65, 20] }]
      },
      "victorian": {
        name: "Victorian Style",
        points: [[20, 20], [120, 20], [120, 85], [20, 85]],
        openings: [{ start: [50, 20], end: [70, 20] }]
      }
    };
    
    return templates[templateId] || templates["rectangular-simple"];
  }

  // Get wall configuration templates
  getWallConfigurations() {
    return {
      "all-sides": {
        name: "All Sides with Gate",
        description: "Walls on all sides except for a gate entrance",
        points: [[10, 10], [190, 10], [190, 287], [10, 287]],
        openings: [{ start: [90, 10], end: [110, 10] }]
      },
      "two-sides": {
        name: "Two Sides Open",
        description: "Walls on two sides, front and back open",
        points: [[10, 10], [190, 10], [190, 50], [10, 50]],
        openings: []
      },
      "no-walls": {
        name: "No Boundary Walls",
        description: "Property boundary line only",
        points: [[10, 10], [190, 10], [190, 287], [10, 287]],
        openings: []
      }
    };
  }

  // Generate unique ID
  generateId() {
    return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert mm to SVG pixels (assuming 1mm = 3.78px for A4 at 96 DPI)
  mmToPixels(mm) {
    return mm * 3.78;
  }

  // Convert SVG pixels to mm
  pixelsToMm(pixels) {
    return pixels / 3.78;
  }

  // Get SVG viewBox dimensions
  getViewBox() {
    return `0 0 ${this.mmToPixels(this.data.page.width_mm)} ${this.mmToPixels(this.data.page.height_mm)}`;
  }

  // Validate blueprint data
  validate() {
    const errors = [];
    
    if (!this.data.page || !this.data.page.width_mm || !this.data.page.height_mm) {
      errors.push("Invalid page dimensions");
    }
    
    if (!Array.isArray(this.data.shapes)) {
      errors.push("Shapes must be an array");
    }
    
    this.data.shapes.forEach((shape, index) => {
      if (!shape.id || !shape.type || !shape.role) {
        errors.push(`Shape ${index} is missing required fields`);
      }
      
      if (!Array.isArray(shape.points) || shape.points.length < 2) {
        errors.push(`Shape ${index} has invalid points`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}