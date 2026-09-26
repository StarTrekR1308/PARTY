import React from 'react';

interface DvdLogoProps {
  color: string;
  width: number;
  height: number;
}

export const DvdLogo: React.FC<DvdLogoProps> = ({ color, width, height }) => {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="relative select-none pointer-events-none flex items-center justify-center"
    >
      <svg
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* ONLY the bold text "Party" - No DVD disc, no rings, no extras */}
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={color}
          fontSize="68"
          fontWeight="900"
          fontFamily="'Righteous', 'Arial Black', sans-serif"
          letterSpacing="1"
        >
          Party
        </text>
      </svg>
    </div>
  );
};
