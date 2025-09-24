export default function RobotIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 120"
      className={className}
    >
      <defs>
        <linearGradient id="robot-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#5b6ffa", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#6366f1", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#robot-bg-gradient)"/>
      <g transform="translate(60, 60)">
        {/* Robot body */}
        <rect x="-20" y="-8" width="40" height="28" rx="6" fill="white" opacity="0.95"/>
        {/* Robot head connector */}
        <rect x="-4" y="-14" width="8" height="8" fill="white" opacity="0.95"/>
        {/* Robot head */}
        <rect x="-16" y="-28" width="32" height="20" rx="4" fill="white" opacity="0.95"/>
        {/* Eyes */}
        <circle cx="-7" cy="-18" r="3" fill="#5b6ffa"/>
        <circle cx="7" cy="-18" r="3" fill="#5b6ffa"/>
        {/* Antenna */}
        <rect x="-1.5" y="-34" width="3" height="8" fill="white" opacity="0.95"/>
        <circle cx="0" cy="-36" r="3" fill="white" opacity="0.95"/>
      </g>
    </svg>
  )
}