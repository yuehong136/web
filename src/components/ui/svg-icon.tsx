import React from 'react';

interface SvgIconProps {
  name: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ 
  name, 
  width = '24px', 
  height = '24px', 
  className = '' 
}) => {
  const svgPath = `/src/assets/svg/${name}.svg`;
  
  return (
    <img
      src={svgPath}
      alt={name}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    />
  );
};

export default SvgIcon;