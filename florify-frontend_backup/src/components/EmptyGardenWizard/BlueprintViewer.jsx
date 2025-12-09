import React from 'react';

const BlueprintViewer = ({ blueprintData, title = "Garden Blueprint" }) => {
  if (!blueprintData) {
    return (
      <div className="blueprint-viewer">
        <div className="no-blueprint">
          <h3>No Blueprint Available</h3>
          <p>This garden doesn't have a blueprint yet.</p>
        </div>
      </div>
    );
  }

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Get SVG viewBox dimensions
  const getViewBox = () => {
    return `0 0 ${mmToPixels(blueprintData.page.width_mm)} ${mmToPixels(blueprintData.page.height_mm)}`;
  };

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none'
    };

    switch (shape.type) {
      case 'polyline':
        return (
          <polyline
            {...commonProps}
            points={points}
          />
        );
      case 'polygon':
        return (
          <polygon
            {...commonProps}
            points={points}
          />
        );
      case 'rect': {
        const rect = shape.points[0];
        const width = Math.abs(shape.points[1].x - shape.points[0].x);
        const height = Math.abs(shape.points[1].y - shape.points[0].y);
        return (
          <rect
            {...commonProps}
            x={mmToPixels(rect.x)}
            y={mmToPixels(rect.y)}
            width={mmToPixels(width)}
            height={mmToPixels(height)}
          />
        );
      }
      default:
        return null;
    }
  };

  // Render openings (doors, gates)
  const renderOpenings = (shape) => {
    if (!shape.openings || shape.openings.length === 0) return null;
    
    return shape.openings.map((opening, index) => {
      const start = opening.start;
      const end = opening.end;
      
      return (
        <line
          key={`${shape.id}-opening-${index}`}
          x1={mmToPixels(start[0])}
          y1={mmToPixels(start[1])}
          x2={mmToPixels(end[0])}
          y2={mmToPixels(end[1])}
          stroke="#e74c3c"
          strokeWidth={mmToPixels(0.3)}
          strokeDasharray="2,2"
          className="opening"
        />
      );
    });
  };

  // Get legend items
  const getLegendItems = () => {
    const legendItems = [];
    const roles = [...new Set(blueprintData.shapes.map(s => s.role))];
    
    const roleInfo = {
      houseFront: { label: 'House Front', color: '#e74c3c', icon: '🏠' },
      boundary: { label: 'Boundary Walls', color: '#8e44ad', icon: '🧱' },
      pathway: { label: 'Pathways', color: '#7f8c8d', icon: '🛤️' },
      gardenBed: { label: 'Garden Beds', color: '#27ae60', icon: '🌱' }
    };
    
    roles.forEach(role => {
      if (roleInfo[role]) {
        legendItems.push({
          ...roleInfo[role],
          count: blueprintData.shapes.filter(s => s.role === role).length
        });
      }
    });
    
    return legendItems;
  };

  const legendItems = getLegendItems();

  return (
    <div className="blueprint-viewer">
      <div className="viewer-header">
        <h3 className="viewer-title">{title}</h3>
        <div className="blueprint-info">
          <span className="info-item">
            📏 {blueprintData.page.width_mm}mm × {blueprintData.page.height_mm}mm
          </span>
          <span className="info-item">
            🏗️ {blueprintData.shapes.length} elements
          </span>
        </div>
      </div>
      
      <div className="viewer-content">
        <div className="blueprint-container">
          <svg
            viewBox={getViewBox()}
            width="100%"
            height="100%"
            className="blueprint-svg"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Render all shapes */}
            {blueprintData.shapes.map(shape => (
              <g key={shape.id}>
                {renderShape(shape)}
                {renderOpenings(shape)}
              </g>
            ))}
          </svg>
        </div>
        
        <div className="blueprint-legend">
          <h4>Legend</h4>
          <div className="legend-items">
            {legendItems.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-icon">{item.icon}</span>
                <span className="legend-label">{item.label}</span>
                <span className="legend-count">({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="viewer-actions">
        <button 
          className="action-btn"
          onClick={() => {
            const svg = document.querySelector('.blueprint-svg');
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title.replace(/\s+/g, '_')}_blueprint.svg`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          📥 Download SVG
        </button>
        
        <button 
          className="action-btn"
          onClick={() => {
            const printWindow = window.open('', '_blank');
            const svg = document.querySelector('.blueprint-svg').outerHTML;
            printWindow.document.write(`
              <html>
                <head><title>${title}</title></head>
                <body style="margin:0; padding:20px;">
                  <h1>${title}</h1>
                  ${svg}
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
          }}
        >
          🖨️ Print Blueprint
        </button>
      </div>
    </div>
  );
};

export default BlueprintViewer;