import React, { useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * FloorplanImageGenerator - Generates PNG images of the floorplan
 * Creates two versions: with skin (styled/decorated) and without skin (raw lines)
 */
const FloorplanImageGenerator = forwardRef(({ blueprintModel, gardenName }, ref) => {
  const svgWithSkinRef = useRef(null);
  const svgWithoutSkinRef = useRef(null);

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;

  // Role colors for the "with skin" version
  const roleStyles = {
    building: {
      stroke: '#e74c3c',
      fill: 'rgba(231, 76, 60, 0.15)',
      strokeWidth: 2,
      label: 'Buildings'
    },
    pathway: {
      stroke: '#7f8c8d',
      fill: 'rgba(127, 140, 141, 0.15)',
      strokeWidth: 2,
      label: 'Pathways'
    },
    boundary: {
      stroke: '#8e44ad',
      fill: 'rgba(142, 68, 173, 0.1)',
      strokeWidth: 2,
      label: 'Boundary Walls'
    },
    drawn: {
      stroke: '#2c3e50',
      fill: 'none',
      strokeWidth: 1.5,
      label: 'Other'
    }
  };

  // Raw line colors for "without skin" version (just colored lines, no fills)
  const rawColors = {
    building: '#FF0000',    // Red
    pathway: '#808080',     // Gray
    boundary: '#800080',    // Purple
    drawn: '#000000'        // Black
  };

  // Render shape for SVG
  const renderShape = (shape, withSkin = true) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const role = shape.role || 'drawn';
    
    let style;
    if (withSkin) {
      const roleStyle = roleStyles[role] || roleStyles.drawn;
      style = {
        stroke: roleStyle.stroke,
        fill: roleStyle.fill,
        strokeWidth: mmToPixels(shape.style?.weight_mm || 0.8) * (roleStyle.strokeWidth / 2)
      };
    } else {
      // Without skin - just raw colored lines, no fill
      style = {
        stroke: rawColors[role] || rawColors.drawn,
        fill: 'none',
        strokeWidth: mmToPixels(shape.style?.weight_mm || 0.8)
      };
    }

    const commonProps = {
      key: shape.id,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      fill: style.fill,
      strokeLinejoin: 'round',
      strokeLinecap: 'round'
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

  // Generate the SVG content
  const generateSVGContent = (withSkin = true) => {
    const viewBox = blueprintModel.getViewBox();
    const shapes = blueprintModel.data.shapes || [];

    return (
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: 'white' }}
      >
        {/* Grid pattern (only for with skin version) */}
        {withSkin && (
          <>
            <defs>
              <pattern id="grid-export" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-export)" />
          </>
        )}

        {/* White background for without skin version */}
        {!withSkin && (
          <rect width="100%" height="100%" fill="white" />
        )}

        {/* Render all shapes */}
        {shapes.map(shape => renderShape(shape, withSkin))}
      </svg>
    );
  };

  // Convert SVG to PNG data URL
  const svgToPng = async (svgElement, width = 2480, height = 3508) => {
    return new Promise((resolve, reject) => {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Fill white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);

          // Draw the SVG
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
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

  // Generate both PNG images
  const generateImages = async () => {
    // Create temporary SVG elements
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    try {
      // Generate WITH SKIN version
      const svgWithSkin = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const viewBox = blueprintModel.getViewBox();
      svgWithSkin.setAttribute('viewBox', viewBox);
      svgWithSkin.setAttribute('width', '2480');
      svgWithSkin.setAttribute('height', '3508');
      svgWithSkin.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Add grid pattern
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', 'grid-with-skin');
      pattern.setAttribute('width', '20');
      pattern.setAttribute('height', '20');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      const patternPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      patternPath.setAttribute('d', 'M 20 0 L 0 0 0 20');
      patternPath.setAttribute('fill', 'none');
      patternPath.setAttribute('stroke', '#f0f0f0');
      patternPath.setAttribute('stroke-width', '0.5');
      pattern.appendChild(patternPath);
      defs.appendChild(pattern);
      svgWithSkin.appendChild(defs);

      // Add background with grid
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', 'url(#grid-with-skin)');
      svgWithSkin.appendChild(bgRect);

      // Add shapes with skin
      blueprintModel.data.shapes.forEach(shape => {
        const element = createShapeElement(shape, true);
        if (element) svgWithSkin.appendChild(element);
      });

      // Add legend
      addLegend(svgWithSkin, gardenName);

      tempContainer.appendChild(svgWithSkin);
      const withSkinDataUrl = await svgToPng(svgWithSkin);

      // Generate WITHOUT SKIN version
      const svgWithoutSkin = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgWithoutSkin.setAttribute('viewBox', viewBox);
      svgWithoutSkin.setAttribute('width', '2480');
      svgWithoutSkin.setAttribute('height', '3508');
      svgWithoutSkin.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // White background only
      const bgRectPlain = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRectPlain.setAttribute('width', '100%');
      bgRectPlain.setAttribute('height', '100%');
      bgRectPlain.setAttribute('fill', 'white');
      svgWithoutSkin.appendChild(bgRectPlain);

      // Add shapes without skin (raw lines)
      blueprintModel.data.shapes.forEach(shape => {
        const element = createShapeElement(shape, false);
        if (element) svgWithoutSkin.appendChild(element);
      });

      tempContainer.appendChild(svgWithoutSkin);
      const withoutSkinDataUrl = await svgToPng(svgWithoutSkin);

      return {
        withSkin: withSkinDataUrl,
        withoutSkin: withoutSkinDataUrl
      };
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // Create SVG shape element
  const createShapeElement = (shape, withSkin) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const role = shape.role || 'drawn';

    let stroke, fill, strokeWidth;
    if (withSkin) {
      const roleStyle = roleStyles[role] || roleStyles.drawn;
      stroke = roleStyle.stroke;
      fill = roleStyle.fill;
      strokeWidth = mmToPixels(shape.style?.weight_mm || 0.8) * (roleStyle.strokeWidth / 2);
    } else {
      stroke = rawColors[role] || rawColors.drawn;
      fill = 'none';
      strokeWidth = mmToPixels(shape.style?.weight_mm || 0.8);
    }

    const element = document.createElementNS('http://www.w3.org/2000/svg',
      shape.type === 'polyline' ? 'polyline' : 'polygon');
    element.setAttribute('points', points);
    element.setAttribute('stroke', stroke);
    element.setAttribute('stroke-width', strokeWidth);
    element.setAttribute('fill', fill);
    element.setAttribute('stroke-linejoin', 'round');
    element.setAttribute('stroke-linecap', 'round');

    return element;
  };

  // Add legend to SVG
  const addLegend = (svg, name) => {
    const [, , width, height] = blueprintModel.getViewBox().split(' ').map(Number);

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', width / 2);
    title.setAttribute('y', '30');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '24');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#2c3e50');
    title.textContent = name || 'Garden Blueprint';
    svg.appendChild(title);

    // Date
    const date = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    date.setAttribute('x', width / 2);
    date.setAttribute('y', '50');
    date.setAttribute('text-anchor', 'middle');
    date.setAttribute('font-size', '12');
    date.setAttribute('fill', '#7f8c8d');
    date.textContent = `Generated: ${new Date().toLocaleDateString()}`;
    svg.appendChild(date);

    // Legend at bottom
    const legendY = height - 60;
    const legendItems = [
      { color: '#e74c3c', label: 'Buildings' },
      { color: '#7f8c8d', label: 'Pathways' },
      { color: '#8e44ad', label: 'Boundary Walls' }
    ];

    legendItems.forEach((item, index) => {
      const x = 50 + (index * 120);

      // Color box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', legendY);
      rect.setAttribute('width', '15');
      rect.setAttribute('height', '15');
      rect.setAttribute('fill', item.color);
      svg.appendChild(rect);

      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + 20);
      label.setAttribute('y', legendY + 12);
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#2c3e50');
      label.textContent = item.label;
      svg.appendChild(label);
    });

    // Scale info
    const scale = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scale.setAttribute('x', width - 50);
    scale.setAttribute('y', legendY + 12);
    scale.setAttribute('text-anchor', 'end');
    scale.setAttribute('font-size', '10');
    scale.setAttribute('fill', '#7f8c8d');
    scale.textContent = 'Scale: 1:100';
    svg.appendChild(scale);
  };

  // Expose generateImages method to parent
  useImperativeHandle(ref, () => ({
    generateImages
  }));

  // Hidden component - no visual rendering needed
  return null;
});

FloorplanImageGenerator.displayName = 'FloorplanImageGenerator';

export default FloorplanImageGenerator;
