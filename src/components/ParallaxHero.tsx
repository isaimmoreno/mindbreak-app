export function ParallaxHero() {
  return (
    <header className="parallax-header">
      {/* Background Layer (Fades out) */}
      <img 
        src="/assets/background.jpg" 
        className="parallax-bg" 
        alt="Background"
        // Fallback if you don't have the assets yet
        onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop'} 
      />

      {/* Foreground Layer */}
      <img 
        src="/assets/foreground.png" 
        className="parallax-fg" 
        alt="Foreground"
        // Fallback
        onError={(e) => e.currentTarget.style.display = 'none'} 
      />      
    </header>
  );
}
