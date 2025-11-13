import { useRef, useState } from 'react';
import { Upload, Download, Trash2, ImageIcon, Puzzle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { PuzzlePage } from './components/PuzzlePage';
import '@tensorflow/tfjs';
import * as bodyPics from '@tensorflow-models/body-pix'

type Page = 'home' | 'puzzle';


export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (currentPage === 'puzzle') {
    return <PuzzlePage onNavigateHome={() => setCurrentPage('home')} />;
  }

  const handleBtnClick = (e : React.MouseEvent<HTMLButtonElement>) =>{
    e.preventDefault();
    inputRef.current?.click();
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
      const blob = await removeBackground(imageUrl);
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

  const removeBackground = async (imageUrl: string): Promise<Blob> => {
    return new Promise<Blob>(async (resolve, reject) => {
      try {
        // Update progress: starting
        setProgress(20);

        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = (e) => rej(new Error('Error loading image'));
        });
        setProgress(30);

        // Load BodyPix model (mobile config for speed)
        const net = await bodyPics.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2,
        } as any);
        setProgress(50);

        // Run person segmentation
        const segmentation = await net.segmentPerson(img, {
          internalResolution: 'medium',
          segmentationThreshold: 0.7,
          maxDetections: 1,
        } as any);
        setProgress(70);

        // Draw image to canvas and apply alpha mask from segmentation
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas context');

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;

        // segmentation.data is a Uint8Array with 1 for person, 0 for background
        const mask = segmentation.data;
        // Safety: ensure mask length matches pixel count
        const pixelCount = canvas.width * canvas.height;
        if (mask.length !== pixelCount) {
          // If sizes mismatch, try to resize mask via canvas (fallback to drawMask)
          // Use bodyPix.toMask + drawMask as fallback
          const maskImage = bodyPics.toMask(segmentation);
          // drawMask will overlay the foreground; instead we'll use drawMask onto a separate canvas
          const outCanvas = document.createElement('canvas');
          outCanvas.width = canvas.width;
          outCanvas.height = canvas.height;
          const outCtx = outCanvas.getContext('2d');
          if (!outCtx) throw new Error('No canvas context');
          // draw original
          outCtx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);
          // draw mask and use it to clear background
          // Create an ImageData from maskImage and apply alpha
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = maskImage.width;
          maskCanvas.height = maskImage.height;
          const maskCtx = maskCanvas.getContext('2d');
          if (!maskCtx) throw new Error('No canvas context');
          maskCtx.putImageData(maskImage, 0, 0);
          // Draw scaled mask onto outCtx and use globalCompositeOperation to keep only person
          outCtx.globalCompositeOperation = 'destination-in';
          outCtx.drawImage(maskCanvas, 0, 0, outCanvas.width, outCanvas.height);
          outCtx.globalCompositeOperation = 'source-over';

          setProgress(90);
          outCanvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('toBlob failed'));
          }, 'image/png');
          return;
        }

        // Apply mask directly to pixel alpha channel
        for (let i = 0; i < pixelCount; i++) {
          const alphaIndex = i * 4 + 3;
          if (mask[i] === 0) {
            // background -> make transparent
            pixelData[alphaIndex] = 0;
          } else {
            // keep original alpha (opaque)
            pixelData[alphaIndex] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProgress(90);

        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('toBlob failed'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            breakmind
          </h2>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <ImageIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl">Eliminador de Fondo</h1>
          </div>
          <p className="text-muted-foreground">
            Sube una imagen y elimina su fondo al instante
          </p>
        </div>

        {/* Upload Area */}
        {!originalImage && (
          <Card className="p-12 border-2 border-dashed border-border hover:border-primary transition-colors">
            <label className="cursor-pointer block">
              <input
               ref={inputRef}
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
                <Button className='bechamel' onClick={handleBtnClick} type="button">
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
                className='bechamel'
                onClick={handleDownload}
                disabled={!processedImage}
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Resultado
              </Button>
              <Button
                className='bechamel'
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

        {/* Puzzle Feature CTA */}
        <Card className="mt-12 p-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <Puzzle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="mb-2">¡Prueba Nuestro Rompecabezas!</h2>
                <p className="text-muted-foreground max-w-xl">
                  Sube cualquier imagen y conviértela en un rompecabezas interactivo. Elige tu nivel de dificultad y pon a prueba tus habilidades resolviendo las piezas mezcladas. ¡Perfecto para desafíos divertidos o entrenar tu reconocimiento espacial!
                </p>
              </div>
            </div>
            <Button
              className='shrink-0 bechamel'
              onClick={() => setCurrentPage('puzzle')}
              size="lg"
             
            >
              <Puzzle className="w-5 h-5 mr-2" />
              Crear Rompecabezas
            </Button>
          </div>
        </Card>

        {/* About Section */}
        <div className="mt-12 pb-8 text-center max-w-3xl mx-auto">
          <h3 className="mb-4">Acerca de Esta Aplicación</h3>
          <p className="text-muted-foreground mb-4">
            Esta aplicación web ofrece dos poderosas herramientas para imágenes. El Eliminador de Fondo utiliza tecnología avanzada de IA para detectar y eliminar automáticamente los fondos de tus imágenes, perfecto para crear fotos profesionales de productos, imágenes de perfil o recursos de diseño. La función de Rompecabezas te permite transformar cualquier imagen en un juego de rompecabezas interactivo con niveles de dificultad personalizables.
          </p>
          <p className="text-muted-foreground">
            Todo el procesamiento ocurre directamente en tu navegador, asegurando que tus imágenes permanezcan privadas y seguras. Sin subidas a servidores externos, sin recopilación de datos - solo herramientas de imagen simples y efectivas al alcance de tu mano.
          </p>
        </div>
      </div>

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
