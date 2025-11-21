import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, ImageIcon, Puzzle, Sparkles, Zap, ArrowUp, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { removeBackground } from '@imgly/background-removal';
import { PuzzlePage } from './components/PuzzlePage';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

type Page = 'home' | 'puzzle';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (currentPage === 'puzzle') {
    return <PuzzlePage onNavigateHome={() => setCurrentPage('home')} />;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor sube un archivo de imagen válido');
      return;
    }

    // Reset states
    setError(null);
    setProcessedImage(null);
    setProgress(0);

    // Read and display original image
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      setOriginalImage(imageDataUrl);
      
      // Process the image
      await processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Remove background with single-thread configuration
      const blob = await removeBackground(imageUrl, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        device: 'cpu',
      });
      clearInterval(progressInterval);
      setProgress(100);

      // Convert blob to data URL
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Error removing background:', err);
      setError('No se pudo eliminar el fondo. Por favor intenta con otra imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-3xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black" style={{ fontFamily: '"Orbitron", "Exo 2", "Space Grotesk", sans-serif' }}>
              BREAKMIND
            </h1>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Eliminar Fondo
              </button>
              <button 
                onClick={() => setCurrentPage('puzzle')}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Puzzle className="w-4 h-4" />
                Rompecabezas
              </button>
              <button 
                onClick={scrollToAbout}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Nosotros
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with feature badges */}
        <div className="text-center mb-12">
          <div className="flex items-start justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl">Eliminador de Fondo</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <Sparkles className="w-3 h-3" />
                  IA Avanzada
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <Zap className="w-3 h-3" />
                  100% Gratis
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Sube una imagen y elimina su fondo al instante con tecnología de IA
          </p>
        </div>

        {/* Example Section */}
        {!originalImage && (
          <Card className="mb-12 overflow-hidden border-2 shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-white text-center">✨ Mira lo que puedes lograr</h2>
            </div>
            <div className="p-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Antes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1 w-8 bg-gray-400 rounded"></div>
                    <span className="text-gray-600">ANTES</span>
                    <div className="h-1 w-8 bg-gray-400 rounded"></div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border-4 border-gray-200 shadow-lg transform hover:scale-105 transition-transform">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2NjgwMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Ejemplo original"
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
                
                {/* Después */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DESPUÉS</span>
                    <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border-4 border-purple-300 shadow-xl transform hover:scale-105 transition-transform bg-checkerboard">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2NjgwMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Ejemplo con fondo removido"
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Fondo Eliminado
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-6 p-4 bg-white/70 rounded-lg backdrop-blur-sm">
                <p className="text-muted-foreground">
                  🎯 Perfecto para fotos de productos, retratos profesionales, diseño gráfico y más
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Area */}
        {!originalImage && (
          <Card className="p-12 border-2 border-dashed border-border hover:border-primary transition-all hover:shadow-lg hover:scale-[1.02] duration-300">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-muted rounded-full">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="mb-2">
                    Haz clic para subir o arrastra y suelta
                  </p>
                  <p className="text-muted-foreground">
                    PNG, JPG, WEBP hasta 10MB
                  </p>
                </div>
                <Button type="button">
                  Elegir Imagen
                </Button>
              </div>
            </label>
          </Card>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <Card className="p-8">
            <div className="text-center mb-4">
              <p>Procesando tu imagen...</p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-muted-foreground mt-2">
              {progress}%
            </p>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-6 bg-destructive/10 border-destructive">
            <p className="text-destructive text-center">{error}</p>
          </Card>
        )}

        {/* Results */}
        {originalImage && !isProcessing && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              <Card className="overflow-hidden">
                <div className="p-4 bg-muted border-b">
                  <h3>Original</h3>
                </div>
                <div className="p-4 bg-checkerboard min-h-[400px] flex items-center justify-center">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
              </Card>

              {/* Processed Image */}
              <Card className="overflow-hidden">
                <div className="p-4 bg-muted border-b">
                  <h3>Fondo Eliminado</h3>
                </div>
                <div className="p-4 bg-checkerboard min-h-[400px] flex items-center justify-center">
                  {processedImage ? (
                    <img
                      src={processedImage}
                      alt="Procesada"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <div className="text-muted-foreground text-center">
                      <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>Procesando...</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleDownload}
                disabled={!processedImage}
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Resultado
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Subir Nueva Imagen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <footer className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white" id="nosotros">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Social Media - Left */}
            <div>
              <h3 className="text-2xl mb-6">Síguenos en Redes Sociales</h3>
              <div className="flex gap-6">
                <a 
                  href="https://www.facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform"
                >
                  <div className="bg-white/20 p-3 rounded-lg hover:bg-white/30 transition-colors">
                    <Facebook className="w-8 h-8" />
                  </div>
                </a>
                <a 
                  href="https://www.twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform"
                >
                  <div className="bg-white/20 p-3 rounded-lg hover:bg-white/30 transition-colors">
                    <Twitter className="w-8 h-8" />
                  </div>
                </a>
                <a 
                  href="https://www.instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform"
                >
                  <div className="bg-white/20 p-3 rounded-lg hover:bg-white/30 transition-colors">
                    <Instagram className="w-8 h-8" />
                  </div>
                </a>
                <a 
                  href="https://www.linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-110 transition-transform"
                >
                  <div className="bg-white/20 p-3 rounded-lg hover:bg-white/30 transition-colors">
                    <Linkedin className="w-8 h-8" />
                  </div>
                </a>
              </div>
            </div>

            {/* About Us - Right */}
            <div>
              <h3 className="text-2xl mb-6">Quiénes Somos</h3>
              <p className="text-white/90 leading-relaxed">
                Somos un equipo de desarrolladores, diseñadores y analistas comprometidos con crear herramientas web innovadoras que transformen la manera en que interactúas con tus imágenes y tu imaginación.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-white/20 text-center text-white/70">
            <p>© {new Date().getFullYear()} Breakmind. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}

      <style>{`
        .bg-checkerboard {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}