export default function SleekOwlIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      className={className}
      role="img" 
      aria-label="Sleek owl icon"
    >
      <style>{`
        .owl-bg { fill: #fff; }
        .owl-fg { fill: #000; stroke: #000; }
      `}</style>

      {/* Badge */}
      <circle cx="32" cy="32" r="32" className="owl-bg"/>

      {/* Sleek "brow" arc */}
      <path d="M12 28 Q32 18 52 28" fill="none" className="owl-fg" strokeWidth="4.5" strokeLinecap="round"/>

      {/* Eyes */}
      <circle cx="24" cy="36" r="4.2" className="owl-fg"/>
      <circle cx="40" cy="36" r="4.2" className="owl-fg"/>

      {/* Beak (diamond) */}
      <path d="M32 40.5l-3.2-3.2L32 34l3.2 3.2z" className="owl-fg"/>
    </svg>
  )
}