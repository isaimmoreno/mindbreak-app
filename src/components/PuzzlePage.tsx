import { useState, useEffect, useRef } from 'react';
import { Upload, Shuffle, RotateCcw, Home, Trophy, Grid3x3, Puzzle, ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PuzzlePiece {
  id: number;
  currentPosition: number;
  correctPosition: number;
  imageX: number;
  imageY: number;
}

interface PuzzlePageProps {
  onNavigateHome: () => void;
}

export function PuzzlePage({ onNavigateHome }: PuzzlePageProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<number>(3);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const scrollToAbout = () => {
    // Navigate to home page and scroll to footer
    onNavigateHome();
    setTimeout(() => {
      document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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

    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      pieces.push({
        id: i,
        currentPosition: i,
        correctPosition: i,
        imageX: col,
        imageY: row,
      });
    }

    setPuzzlePieces(pieces);
    setIsSolved(false);
    setMoves(0);
  };

  const shufflePuzzle = () => {
    const shuffled = [...puzzlePieces];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      shuffled[i].currentPosition = i;
      shuffled[j].currentPosition = j;
    }

    setPuzzlePieces(shuffled);
    setIsSolved(false);
    setMoves(0);
  };

  const handlePieceClick = (position: number) => {
    if (isSolved) return;

    if (selectedPiece === null) {
      setSelectedPiece(position);
    } else {
      if (selectedPiece === position) {
        setSelectedPiece(null);
        return;
      }

      // Swap pieces
      const newPieces = [...puzzlePieces];
      const piece1Index = newPieces.findIndex(p => p.currentPosition === selectedPiece);
      const piece2Index = newPieces.findIndex(p => p.currentPosition === position);

      if (piece1Index !== -1 && piece2Index !== -1) {
        newPieces[piece1Index].currentPosition = position;
        newPieces[piece2Index].currentPosition = selectedPiece;

        setPuzzlePieces(newPieces);
        setMoves(moves + 1);
        setSelectedPiece(null);

        // Check if solved
        const solved = newPieces.every(piece => piece.currentPosition === piece.correctPosition);
        if (solved) {
          setIsSolved(true);
        }
      }
    }
  };

  useEffect(() => {
    if (uploadedImage) {
      initializePuzzle();
    }
  }, [uploadedImage, gridSize]);

  const getPieceAtPosition = (position: number) => {
    return puzzlePieces.find(p => p.currentPosition === position);
  };

  const renderPuzzlePiece = (position: number) => {
    const piece = getPieceAtPosition(position);
    if (!piece || !uploadedImage) return null;

    const pieceSize = 400 / gridSize;
    const isSelected = selectedPiece === position;

    return (
      <div
        key={position}
        onClick={() => handlePieceClick(position)}
        className={`relative cursor-pointer transition-all ${
          isSelected ? 'ring-4 ring-primary scale-95' : 'hover:ring-2 hover:ring-primary/50'
        }`}
        style={{
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          overflow: 'hidden',
        }}
      >
        <img
          src={uploadedImage}
          alt={`Pieza ${position}`}
          className="absolute pointer-events-none"
          style={{
            width: `${400}px`,
            height: `${400}px`,
            left: `-${piece.imageX * pieceSize}px`,
            top: `-${piece.imageY * pieceSize}px`,
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
                onClick={onNavigateHome}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Eliminar Fondo
              </button>
              <button 
                className="text-primary transition-colors flex items-center gap-2"
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

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-start justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Grid3x3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl">Rompecabezas de Imagen</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Crea y resuelve tu propio rompecabezas
          </p>
        </div>

        {!uploadedImage ? (
          <Card className="p-12 border-2 border-dashed border-border hover:border-primary transition-colors">
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
                    Sube una imagen para crear tu rompecabezas
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

                <Button onClick={shufflePuzzle} variant="default">
                  <Shuffle className="w-5 h-5 mr-2" />
                  Mezclar
                </Button>

                <Button onClick={initializePuzzle} variant="outline">
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
                  <Button type="button" variant="secondary" asChild>
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
                  className="grid gap-1 bg-muted p-2 rounded-lg mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    width: 'fit-content',
                  }}
                >
                  {Array.from({ length: gridSize * gridSize }, (_, i) => (
                    <div key={i}>{renderPuzzlePiece(i)}</div>
                  ))}
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