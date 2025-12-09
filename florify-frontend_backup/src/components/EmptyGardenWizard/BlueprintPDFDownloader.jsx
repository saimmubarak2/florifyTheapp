import React, { useRef, useState } from 'react';

const BlueprintPDFDownloader = ({ blueprintModel, gardenName }) => {
  const svgRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Get the SVG element
      const svgElement = svgRef.current;
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Set canvas size for A4 landscape (297x210mm at 300 DPI)
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
          ctx.drawImage(img, 50, 50, width - 100, height - 200);
          
          // Add title
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(gardenName || 'Garden Blueprint', width / 2, 30);
          
          // Add date
          ctx.font = '12px Arial';
          ctx.fillText(`Generated on: ${new Date().toLocaleDateString()}`, width / 2, 50);
          
          // Add legend
          const legendY = height - 120;
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'left';
          ctx.fillText('Legend:', 50, legendY);
          
          ctx.font = '12px Arial';
          const legendItems = [
            { color: '#e74c3c', label: 'Buildings' },
            { color: '#7f8c8d', label: 'Pathways' },
            { color: '#8e44ad', label: 'Boundary Walls' }
          ];
          
          legendItems.forEach((item, index) => {
            const y = legendY + 20 + (index * 20);
            ctx.fillStyle = item.color;
            ctx.fillRect(50, y - 10, 15, 10);
            ctx.fillStyle = '#2c3e50';
            ctx.fillText(item.label, 75, y);
          });
          
          // Add scale information
          ctx.fillText('Scale: 1:100 (1mm = 1cm)', 50, legendY + 80);
          
          // Convert to blob and download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gardenName || 'garden-blueprint'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);
            resolve();
          }, 'image/png');
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };
        
        img.src = svgUrl;
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Convert SVG pixels to mm
  const pixelsToMm = (pixels) => pixels / 3.78;

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
      default:
        return null;
    }
  };

  return (
    <div className="pdf-downloader">
      <div className="pdf-preview">
        <h3>Blueprint Preview</h3>
        <div className="preview-container">
          <svg
            ref={svgRef}
            viewBox={blueprintModel.getViewBox()}
            width="100%"
            height="400px"
            className="blueprint-svg-preview"
          >
            {/* Grid background */}
            <defs>
              <pattern id="pdf-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pdf-grid)" />
            
            {/* Render all shapes */}
            {blueprintModel.data.shapes.map(shape => (
              <g key={shape.id}>
                {renderShape(shape)}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="pdf-actions">
        <div className="pdf-info">
          <h4>Download Your Blueprint</h4>
          <p>Your garden blueprint is ready! Download it as a high-quality image to print or share.</p>
          
          <div className="blueprint-details">
            <div className="detail-item">
              <strong>Garden Name:</strong> {gardenName || 'Untitled Garden'}
            </div>
            <div className="detail-item">
              <strong>Elements:</strong> {blueprintModel.data.shapes.length} shapes drawn
            </div>
            <div className="detail-item">
              <strong>Scale:</strong> 1:100 (1mm = 1cm)
            </div>
            <div className="detail-item">
              <strong>Format:</strong> High-Quality PNG Image
            </div>
          </div>
        </div>

        <button 
          className="download-btn"
          onClick={generatePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating Image...
            </>
          ) : (
            <>
              🖼️ Download Image
            </>
          )}
        </button>

        <div className="pdf-features">
          <h5>Image Features:</h5>
          <ul>
            <li>✅ High-quality PNG format</li>
            <li>✅ Print-ready resolution</li>
            <li>✅ Color-coded legend</li>
            <li>✅ Scale information</li>
            <li>✅ Professional layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlueprintPDFDownloader;