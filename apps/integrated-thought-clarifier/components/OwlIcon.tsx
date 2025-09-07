export default function OwlIcon({ className = "w-6 h-6", fillColor = "currentColor", bgColor = "transparent" }: { className?: string; fillColor?: string; bgColor?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      role="img" 
      aria-label="Owl icon"
      className={className}
      fill="none"
    >
      {/* Badge circle (background) - only if bgColor is provided */}
      {bgColor !== "transparent" && (
        <circle cx="32" cy="32" r="32" fill={bgColor}/>
      )}
      
      {/* Owl head silhouette */}
      <path 
        fill={fillColor}
        d="M17 39.5c0 8.6 7.3 12.5 15 12.5s15-3.9 15-12.5c0-8.1-3.8-12.8-6.8-16 2.8-2.1 6.1-3.6 9.3-4.2-1.9-1.6-4.4-2.7-7.7-2.7-3.7 0-6.9 1.3-9.8 3.5-2.9-2.2-6.1-3.5-9.8-3.5-3.3 0-5.8 1.1-7.7 2.7 3.2.6 6.5 2.1 9.3 4.2-3 3.2-6.8 7.9-6.8 16z"
      />
      
      {/* Eyes */}
      <circle cx="24.5" cy="36" r="6.2" fill={bgColor !== "transparent" ? bgColor : "#1a1a1a"}/>
      <circle cx="39.5" cy="36" r="6.2" fill={bgColor !== "transparent" ? bgColor : "#1a1a1a"}/>
      
      {/* Eye highlights */}
      <circle cx="22.8" cy="33.8" r="1.4" fill={fillColor}/>
      <circle cx="37.8" cy="33.8" r="1.4" fill={fillColor}/>
      
      {/* Beak */}
      <path 
        fill={bgColor !== "transparent" ? bgColor : "#1a1a1a"}
        d="M32 40.5l-3.6-3.4c-.6-.6.1-1.6.9-1.3l2.7 1.1 2.7-1.1c.8-.3 1.5.7.9 1.3L32 40.5z"
      />
    </svg>
  )
}