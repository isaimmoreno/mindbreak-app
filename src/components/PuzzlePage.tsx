import { useState, useEffect, useRef } from 'react';
import { Upload, Shuffle, RotateCcw, Home, Trophy, Grid3x3, Puzzle, Image as ImageIcon, ArrowUp, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import PuzzlePieceComponent from './PuzzlePiece';
import GradientText from './GradientText';
import { ImageGallery } from './ImageGallery';

interface PuzzlePiece {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  imageX: number;
  imageY: number;
  zIndex?: number;
}

interface PuzzlePageProps {
  onNavigateHome: () => void;
}

export function PuzzlePage({ onNavigateHome }: PuzzlePageProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<number>(3);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(1);
  const [isSolved, setIsSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const puzzleAreaRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reusable function to handle a single image file
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setUploadedImage(imageDataUrl);
      setIsSolved(false);
      setMoves(0);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleImgDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    handleFile(droppedFiles[0]);
  };

  const handleImgDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleImgDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleImgDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const initializePuzzle = () => {
    const totalPieces = gridSize * gridSize;
    const pieces: PuzzlePiece[] = [];
    const pieceSize = 400 / gridSize;

    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const targetX = col * pieceSize;
      const targetY = row * pieceSize;

      pieces.push({
        id: i,
        x: targetX,
        y: targetY,
        targetX,
        targetY,
        imageX: col,
        imageY: row,
        zIndex: 1,
      });
    }

    setPuzzlePieces(pieces);
    setIsSolved(false);
    setMoves(0);
  };

  const shufflePuzzle = () => {
    const areaSize = 400;
    const pieceSize = areaSize / gridSize;
    const padding = 8;

    const shuffled = puzzlePieces.map(p => ({ ...p }));

    for (let p of shuffled) {
      p.x = Math.random() * (areaSize - pieceSize - padding * 2) + padding;
      p.y = Math.random() * (areaSize - pieceSize - padding * 2) + padding;
    }

    setPuzzlePieces(shuffled);
    setIsSolved(false);
    setMoves(0);
  };

  const handlePieceClick = (positionIndex: number) => {
    if (isSolved) return;
    if (selectedPiece === positionIndex) {
      setSelectedPiece(null);
      return;
    }

    setZIndexCounter((z) => {
      const newZ = z + 1;
      setPuzzlePieces(prev => prev.map(p => p.id === positionIndex ? { ...p, zIndex: newZ } : p));
      return newZ;
    });
    setSelectedPiece(positionIndex);
  };

  const dragStateRef = useRef<{ id: number | null; offsetX: number; offsetY: number } | null>(null);

  const handleDragStart = (id: number, pointerX: number, pointerY: number, offsetX: number, offsetY: number) => {
    setDraggingId(id);
    setZIndexCounter((z) => {
      const newZ = z + 1;
      setPuzzlePieces(prev => prev.map(p => p.id === id ? { ...p, zIndex: newZ } : p));
      return newZ;
    });
    dragStateRef.current = { id, offsetX, offsetY };
  };

  const handleDragMove = (id: number, pointerX: number, pointerY: number) => {
    const state = dragStateRef.current;
    if (!state || state.id !== id) return;
    const area = puzzleAreaRef.current?.getBoundingClientRect();
    if (!area) return;
    const pieceSize = 400 / gridSize;
    const newX = pointerX - area.left - state.offsetX;
    const newY = pointerY - area.top - state.offsetY;

    setPuzzlePieces(prev => prev.map(p => p.id === id ? { ...p, x: Math.max(0, Math.min(newX, 400 - pieceSize)), y: Math.max(0, Math.min(newY, 400 - pieceSize)) } : p));
  };

  const handleDragEnd = (id: number, pointerX: number, pointerY: number) => {
    const state = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingId(null);

    const area = puzzleAreaRef.current?.getBoundingClientRect();
    if (!area) return;
    const pieceSize = 400 / gridSize;
    const releasedX = pointerX - area.left - (state?.offsetX ?? 0);
    const releasedY = pointerY - area.top - (state?.offsetY ?? 0);

    const tolerance = Math.max(12, pieceSize * 0.12);

    setPuzzlePieces(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const dx = p.targetX - releasedX;
        const dy = p.targetY - releasedY;
        const dist = Math.hypot(dx, dy);
        if (dist <= tolerance) {
          return { ...p, x: p.targetX, y: p.targetY };
        }
        return { ...p, x: Math.max(0, Math.min(releasedX, 400 - pieceSize)), y: Math.max(0, Math.min(releasedY, 400 - pieceSize)) };
      });

      const allSnapped = next.every(p => Math.hypot(p.x - p.targetX, p.y - p.targetY) <= Math.max(8, pieceSize * 0.08));
      if (allSnapped) setIsSolved(true);

      return next;
    });

    setMoves(m => m + 1);
  };

  useEffect(() => {
    if (uploadedImage) {
      initializePuzzle();
    }
  }, [uploadedImage, gridSize]);

  const getPieceAtPosition = (position: number) => {
    return puzzlePieces.find(p => p.id === position);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      
      {/* --- NAVBAR: Identical to App.tsx --- */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo - Goes Home */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={onNavigateHome}
          >
            <GradientText 
                          colors={["#1E88E5", "#4f79ff", "#8E24AA", "#4079ff", "#F024ff"]}
                          animationSpeed={8}
                          showBorder={false}
                          className="font-bold text-2xl tracking-tighter custom-class"
                        >
               BREAKMIND 
            </GradientText>
          </div>
          
          {/* Navigation Buttons */}
          <nav className="navitems flex items-center gap-2 sm:gap-4">
            
            {/* Eliminar Fondo (Inactive State) */}
            <button 
              onClick={onNavigateHome} 
              className="bechamel px-4 py-2 text-sm font-medium rounded-full transition-all float-left"
            >
              <ImageIcon className="w-4 h-4 " />
              Eliminar Fondo
            </button>
              
            {/* Rompecabezas (Active State - 'selected') */}
            <button 
              className="selected group px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2"
            >
              <Puzzle className={`w-4 h-4 transition-transform group-hover:rotate-12 `} />
              Rompecabezas
            </button>

            {/* Nosotros (Static for consistency) */}
            <button 
              className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors cursor-not-allowed opacity-50"
              title="Solo disponible en Inicio"
            >
              Nosotros
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-grow w-full max-w-6xl mx-auto px-6 py-12">
        
        {/* Page Title */}
        <div className="text-center mb-10 flex flex-col items-center">
            
            {/* --- HEADER FIX: Side-by-Side Icon and Title --- */}
            <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg shadow-pink-200 transform hover:scale-105 transition-transform duration-300">
                    <Grid3x3 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    Rompecabezas de Imagen
                </h1>
            </div>
            
             <p className="text-lg text-slate-500 max-w-2xl">
                Crea y resuelve tu propio rompecabezas personalizado
            </p>
        </div>
        <br />

        {/* Hidden Input */}
        <input
          id="puzzle-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {!uploadedImage ? (
           <div className='animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto space-y-8'>
            
            {/* UPLOAD CARD - No Green Aura, Just Clean Slate/Primary */}
            <Card 
                className={`p-12 border-2 border-dashed transition-all duration-300 
                    ${isDragOver 
                        ? "border-primary bg-primary/5 scale-[1.01] shadow-xl ring-2 ring-primary/20" 
                        : "border-slate-200 hover:border-primary/50 hover:shadow-md"
                    }`}
                onDragEnter={handleImgDragEnter} 
                onDragLeave={handleImgDragLeave} 
                onDrop={handleImgDrop} 
                onDragOver={handleImgDragOver}
            >
              <label htmlFor="puzzle-file-input" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className={`greybtn p-6 rounded-full transition-colors duration-300 ${isDragOver ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                    <Upload className="" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className={`text-xl font-semibold transition-colors ${isDragOver ? 'text-primary' : 'text-slate-700'}`}>
                      {isDragOver ? "¡Suéltala para procesar!" : "Sube una imagen para crear tu rompecabezas"}
                    </p>
                    <p className="text-sm text-slate-400">
                      PNG, JPG, WEBP hasta 10MB
                    </p>
                  </div>
                  <Button className='bechamel px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all' type="button" onClick={() => fileInputRef.current?.click()}>
                       Elegir Imagen   
                  </Button>
                </div>
              </label>
            </Card>

             {/* Image Gallery for Quick Start */}
             <ImageGallery 
                onSelect={(url) => {
                    setUploadedImage(url);
                    setIsSolved(false);
                    setMoves(0);
                }} 
            />
          </div>
        ) : (
          <div className="maincont space-y-6 animate-in zoom-in-95 duration-500">
            {/* Controls */}
            <Card className="p-6 border-0 shadow-lg">
              <div className="flex flex-wrap items-end gap-4 justify-between">
                <div className="flex-1 min-w-[200px]">
                  <Label>Dificultad</Label>
                  <Select
                    value={gridSize.toString()}
                    onValueChange={(value) => setGridSize(Number(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Fácil (2x2)</SelectItem>
                      <SelectItem value="3">Medio (3x3)</SelectItem>
                      <SelectItem value="4">Difícil (4x4)</SelectItem>
                      <SelectItem value="5">Experto (5x5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                    <Button onClick={shufflePuzzle} className='bechamel'>
                    <Shuffle className="w-5 h-5 mr-2" />
                    Mezclar
                    </Button>

                    <Button onClick={initializePuzzle} variant="outline" className='bechamel-r border-2 hover:bg-slate-50'>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reiniciar
                    </Button>

                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className='bechamel-g'>
                    <Upload className="w-5 h-5 mr-2 " />
                    Nueva Imagen
                    </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                  <span className="text-slate-500 text-sm font-medium">Movimientos:</span>
                  <span className="font-bold text-slate-900">{moves}</span>
                </div>
                {isSolved && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full animate-pulse">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">¡Rompecabezas Resuelto!</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Puzzle Grid - FIXED: Grid Layout for Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center items-start">
              {/* Puzzle Area */}
              <Card className="p-8 border-0 shadow-lg flex flex-col items-center w-full max-w-[500px]">
                <h3 className="mb-6 font-bold text-slate-700 flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-purple-500" /> 
                    Arma el Rompecabezas
                </h3>
                <div
                  ref={puzzleAreaRef}
                  className="relative bg-slate-100/50 p-1 rounded-xl shadow-inner border border-slate-200"
                  style={{ width: '402px', height: '402px' }}
                >
                  {Array.from({ length: gridSize * gridSize }, (_, i) => {
                    const piece = getPieceAtPosition(i);
                    return (
                      <PuzzlePieceComponent
                        key={i}
                        imageSrc={uploadedImage ?? ''}
                        piece={piece}
                        pieceSize={400 / gridSize}
                        gridSize={gridSize}
                        zIndex={piece ? (piece.zIndex ?? 1) : 1}
                        isDragging={piece && draggingId === piece.id}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                        onSelect={handlePieceClick}
                      />
                    );
                  })}
                </div>
                <p className="text-slate-400 text-sm text-center mt-6">
                  Arrastra las piezas a su lugar correcto
                </p>
              </Card>

              {/* Reference Image */}
              <Card className="p-8 border-0 shadow-lg flex flex-col items-center w-full max-w-[500px]">
                <h3 className="mb-6 font-bold text-slate-700 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    Referencia
                </h3>
                <div className="bg-slate-100 p-2 rounded-xl shadow-inner border border-slate-200">
                  <img
                    src={uploadedImage}
                    alt="Referencia"
                    className="refimg object-contain rounded-lg opacity-90"
                  />
                </div>
                <p className="text-slate-400 text-sm text-center mt-6">
                  Imagen original para guiarte
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
      {/* --- FOOTER --- */}
      <footer id="footer" className="footing text-white mt-auto" style={{ background: 'linear-gradient(90deg, #8E24AA 0%, #1E88E5 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold">Síguenos en Redes Sociales</h2>
                    <div className="flex gap-4">
                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white hover:text-purple-600 transition-all">
                                <Icon className="w-6 h-6" />
                            </a>
                        ))}
                    </div>
                </div>
                <div className="space-y-4 text-white/90">
                    <h3 className="text-2xl font-bold">Quiénes Somos</h3>
                    <p className="leading-relaxed">
                        Somos un equipo de desarrolladores, diseñadores y analistas comprometidos con crear herramientas web innovadoras que transformen la manera en que interactúas con tus imágenes y tu imaginación.
                    </p>
                </div>
            </div>
            <div className="border-t border-white/20 mt-12 pt-8 flex justify-between items-center text-sm text-white/60">
                <p>© 2025 Breakmind. Todos los derechos reservados.</p>
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>
        </div>
      </footer>
    </div>
  );
}
