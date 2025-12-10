import React, { useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * FloorplanExporter - Handles exporting floorplan as PNG with and without skin
 * 
 * "With Skin" = The visual representation with fills, colors, legend (presentation ready)
 * "Without Skin" = Just the colored lines representing the actual floorplan (raw data)
 */
const FloorplanExporter = forwardRef(({ blueprintModel, gardenName }, ref) => {
  const svgWithSkinRef = useRef(null);
  const svgWithoutSkinRef = useRef(null);

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;

  // Skin styles (with fills and visual enhancements)
  const getSkinStyle = (shape) => ({
    stroke: shape.style.stroke,
    strokeWidth: mmToPixels(shape.style.weight_mm || 0.8),
    fill: shape.style.fill || `${shape.style.stroke}20`,
    filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))'
  });

  // Raw style (just colored lines, no fills)
  const getRawStyle = (shape) => ({
    stroke: shape.style.stroke,
    strokeWidth: mmToPixels(shape.style.weight_mm || 0.8),
    fill: 'none'
  });

  // Render a shape as SVG element
  const renderShape = (shape, withSkin = true) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const style = withSkin ? getSkinStyle(shape) : getRawStyle(shape);

    const commonProps = {
      key: shape.id,
      ...style
    };

    switch (shape.type) {
      case 'polyline':
        return <polyline {...commonProps} points={points} />;
      case 'polygon':
        return <polygon {...commonProps} points={points} />;
      default:
        return null;
    }
  };

  // Generate PNG from SVG
  const generatePNG = async (svgElement, withSkin = true) => {
    if (!svgElement) return null;

    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Set canvas size for high quality output
          const dpi = 300;
          const mmToInch = 0.0393701;
          const width = 297 * mmToInch * dpi; // A4 landscape width
          const height = 210 * mmToInch * dpi; // A4 landscape height
          
          canvas.width = width;
          canvas.height = height;
          
          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          // Draw the SVG image
          const padding = withSkin ? 80 : 50;
          ctx.drawImage(img, padding, withSkin ? 100 : 50, width - (padding * 2), height - (withSkin ? 250 : 100));
          
          if (withSkin) {
            // Add title
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(gardenName || 'Garden Floorplan', width / 2, 50);
            
            // Add date
            ctx.font = '18px Arial';
            ctx.fillText(`Generated on: ${new Date().toLocaleDateString()}`, width / 2, 80);
            
            // Add legend
            const legendY = height - 130;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Legend:', 80, legendY);
            
            ctx.font = '18px Arial';
            const legendItems = [
              { color: '#e74c3c', label: 'Buildings' },
              { color: '#7f8c8d', label: 'Pathways / Driveway' },
              { color: '#8e44ad', label: 'Boundary Walls' }
            ];
            
            legendItems.forEach((item, index) => {
              const x = 80 + (index * 280);
              const y = legendY + 40;
              ctx.fillStyle = item.color;
              ctx.fillRect(x, y - 15, 25, 15);
              ctx.fillStyle = '#2c3e50';
              ctx.fillText(item.label, x + 35, y);
            });
            
            // Add scale information
            ctx.fillText('Scale: 1:100 (1mm = 1cm)', 80, legendY + 80);
            
            // Add border
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.strokeRect(30, 30, width - 60, height - 60);
          }
          
          // Convert to base64
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          URL.revokeObjectURL(svgUrl);
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };
        
        img.src = svgUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    exportBothPNGs: async () => {
      const withSkin = await generatePNG(svgWithSkinRef.current, true);
      const withoutSkin = await generatePNG(svgWithoutSkinRef.current, false);
      return { withSkin, withoutSkin };
    },
    exportWithSkin: async () => {
      return await generatePNG(svgWithSkinRef.current, true);
    },
    exportWithoutSkin: async () => {
      return await generatePNG(svgWithoutSkinRef.current, false);
    },
    downloadWithSkin: async () => {
      const dataUrl = await generatePNG(svgWithSkinRef.current, true);
      downloadImage(dataUrl, `${gardenName || 'garden'}-with-skin.png`);
    },
    downloadWithoutSkin: async () => {
      const dataUrl = await generatePNG(svgWithoutSkinRef.current, false);
      downloadImage(dataUrl, `${gardenName || 'garden'}-raw.png`);
    }
  }));

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewBox = blueprintModel.getViewBox();
  const shapes = blueprintModel.data.shapes;

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {/* SVG with Skin (visual presentation) */}
      <svg
        ref={svgWithSkinRef}
        viewBox={viewBox}
        width="800"
        height="600"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid background for skin version */}
        <defs>
          <pattern id="export-grid-skin" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e8e8" strokeWidth="0.5"/>
          </pattern>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#export-grid-skin)" />
        
        {/* Render shapes with skin */}
        {shapes.map(shape => (
          <g key={`skin-${shape.id}`}>
            {renderShape(shape, true)}
          </g>
        ))}
      </svg>

      {/* SVG without Skin (raw colored lines) */}
      <svg
        ref={svgWithoutSkinRef}
        viewBox={viewBox}
        width="800"
        height="600"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Light grid for raw version */}
        <defs>
          <pattern id="export-grid-raw" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f5f5f5" strokeWidth="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#export-grid-raw)" />
        
        {/* Render shapes without skin (raw lines only) */}
        {shapes.map(shape => (
          <g key={`raw-${shape.id}`}>
            {renderShape(shape, false)}
          </g>
        ))}
      </svg>
    </div>
  );
});

FloorplanExporter.displayName = 'FloorplanExporter';

export default FloorplanExporter;
