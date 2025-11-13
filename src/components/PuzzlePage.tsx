import { useState, useEffect, useRef } from 'react';
import { Upload, Shuffle, RotateCcw, Home, Trophy, Grid3x3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import PuzzlePieceComponent from './PuzzlePiece';

interface PuzzlePiece {
  id: number;
  x: number; // posición actual en px
  y: number;
  targetX: number; // posición objetivo en px
  targetY: number;
  imageX: number;
  imageY: number;
  tabs: { top: number; right: number; bottom: number; left: number };
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const puzzleAreaRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

    const handleBtnClick = (e : React.MouseEvent<HTMLButtonElement>) =>{
    e.preventDefault();
    inputRef.current?.click();
  }
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setUploadedImage(imageDataUrl);
      setIsSolved(false);
      setMoves(0);
    };
    reader.readAsDataURL(file);
  };

  const initializePuzzle = () => {
    const totalPieces = gridSize * gridSize;
    const pieces: PuzzlePiece[] = [];
    const pieceSize = 400 / gridSize;

    // Generate complementary tabs for internal edges so adjacent pieces will fit.
    // horizontalTabs[r][c] is the tab between (r,c) and (r,c+1) (value: 1 or -1)
    const horizontalTabs: number[][] = Array.from({ length: gridSize }, () => Array.from({ length: Math.max(0, gridSize - 1) }, () => (Math.random() > 0.5 ? 1 : -1)));
    // verticalTabs[r][c] is the tab between (r,c) and (r+1,c)
    const verticalTabs: number[][] = Array.from({ length: Math.max(0, gridSize - 1) }, () => Array.from({ length: gridSize }, () => (Math.random() > 0.5 ? 1 : -1)));

    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const targetX = col * pieceSize;
      const targetY = row * pieceSize;

      const right = col === gridSize - 1 ? 0 : horizontalTabs[row][col];
      const left = col === 0 ? 0 : -horizontalTabs[row][col - 1];
      const bottom = row === gridSize - 1 ? 0 : verticalTabs[row][col];
      const top = row === 0 ? 0 : -verticalTabs[row - 1][col];

      pieces.push({
        id: i,
        x: targetX,
        y: targetY,
        targetX,
        targetY,
        imageX: col,
        imageY: row,
        tabs: { top, right, bottom, left },
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

    // Scatter pieces randomly inside the puzzle area
    for (let p of shuffled) {
      p.x = Math.random() * (areaSize - pieceSize - padding * 2) + padding;
      p.y = Math.random() * (areaSize - pieceSize - padding * 2) + padding;
    }

    setPuzzlePieces(shuffled);
    setIsSolved(false);
    setMoves(0);
  };

  // Keep old click selection minimal (not primary for free movement)
  const handlePieceClick = (positionIndex: number) => {
    if (isSolved) return;
    if (selectedPiece === positionIndex) setSelectedPiece(null);
    else setSelectedPiece(positionIndex);
  };

  // Drag handlers (called from child PuzzlePiece)
  const dragStateRef = useRef<{ id: number | null; offsetX: number; offsetY: number } | null>(null);

  const handleDragStart = (id: number, pointerX: number, pointerY: number, offsetX: number, offsetY: number) => {
    setDraggingId(id);
    setZIndexCounter(z => z + 1);
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

    // Snap if within tolerance
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

      // After drop, check solved
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <h2 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            breakmind
          </h2>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-xl">
              <Grid3x3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl">Rompecabezas de Imagen</h1>
              <p className="text-muted-foreground">
                Crea y resuelve tu propio rompecabezas
              </p>
            </div>
          </div>
          <Button onClick={onNavigateHome} variant="outline" size="lg" className='bechamel'>
            <Home className="w-5 h-5 mr-2" />
            Volver al Inicio
          </Button>
        </div>

        {!uploadedImage ? (
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
                    Sube una imagen para crear tu rompecabezas
                  </p>
                  <p className="text-muted-foreground">
                    PNG, JPG, WEBP hasta 10MB
                  </p>
                </div>
                <Button type="button" onClick={handleBtnClick} className='bechamel' >
                  Elegir Imagen
                  
                </Button>
              </div>
            </label>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <Card className="p-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Dificultad del Rompecabezas</Label>
                  <Select
                    value={gridSize.toString()}
                    onValueChange={(value) => setGridSize(Number(value))}
                  >
                    <SelectTrigger>
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

                <Button onClick={shufflePuzzle} variant="default" className='bechamel'>
                  <Shuffle className="w-5 h-5 mr-2" />
                  Mezclar
                </Button>

                <Button onClick={initializePuzzle} variant="outline" className='bechamel-r'>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reiniciar
                </Button>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="secondary" asChild className='bechamel-g'>
                    <span>
                      <Upload className="w-5 h-5 mr-2" />
                      Nueva Imagen
                    </span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Movimientos:</span>
                  <span>{moves}</span>
                </div>
                {isSolved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Trophy className="w-5 h-5" />
                    <span>¡Rompecabezas Resuelto!</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Puzzle Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Puzzle Area */}
              <Card className="p-6">
                <h3 className="mb-4">Rompecabezas</h3>
                <div
                  ref={puzzleAreaRef}
                  className="relative bg-muted p-2 rounded-lg mx-auto"
                  style={{ width: '400px', height: '400px' }}
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
                        zIndex={piece && draggingId === piece.id ? zIndexCounter : 1}
                        isDragging={piece && draggingId === piece.id}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-center mt-4">
                  Haz clic en dos piezas para intercambiarlas
                </p>
              </Card>

              {/* Reference Image */}
              <Card className="p-6">
                <h3 className="mb-4">Referencia</h3>
                <div className="bg-muted p-2 rounded-lg">
                  <img
                    src={uploadedImage}
                    alt="Referencia"
                    className="w-full max-w-[400px] mx-auto rounded"
                  />
                </div>
                <p className="text-muted-foreground text-center mt-4">
                  Imagen original como referencia
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
