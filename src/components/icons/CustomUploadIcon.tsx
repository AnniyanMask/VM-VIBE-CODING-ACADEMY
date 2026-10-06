import { LucideProps } from 'lucide-react';

export const CustomUploadIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2, 
  ...props 
}: LucideProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Box with gap at top */}
    <path d="M4 12V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V12M4 8V5C4 4.44772 4.44772 4 5 4H9M15 4H19C19.5523 4 20 4.44772 20 5V8" />
    {/* Arrow */}
    <path d="M12 15V3M12 3L8 7M12 3L16 7" />
  </svg>
);
