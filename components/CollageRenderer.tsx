
import React, { useEffect, useRef, useState } from 'react';
import { Photo } from '../types';

interface CollageRendererProps {
  photos: Photo[];
  frameSize: number;
  onUpdatePhoto: (photo: Photo) => void;
  onSwapPhotos: (id1: string, id2: string) => void;
  showFilenames?: boolean;
}

interface DragState {
  photoIndex: number;
  startX: number;
  startY: number;
  initialOffsetX: number;
  initialOffsetY: number;
  currentX: number;
  currentY: number;
}

type InteractionMode = 'pan' | 'swap';

const CollageRenderer: React.FC<CollageRendererProps> = ({ 
  photos, 
  frameSize, 
  onUpdatePhoto, 
  onSwapPhotos,
  showFilenames = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('pan');
  const dragState = useRef<DragState | null>(null);

  const CANVAS_SIZE = 1200;

  const layoutInfo = useRef<{
    cols: number;
    rows: number;
    cellW: number;
    cellH: number;
    margin: number;
    gap: number;
  }>({ cols: 0, rows: 0, cellW: 0, cellH: 0, margin: 0, gap: 0 });

  const calculateBestLayout = (count: number, avgPhotoAR: number, availableW: number, availableH: number) => {
    let bestCols = 1;
    let bestRows = count;
    let minDiff = Infinity;

    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      const cellW = availableW / cols;
      const cellH = availableH / rows;
      const cellAR = cellW / cellH;

      const diff = Math.abs(Math.log(cellAR / avgPhotoAR));
      if (diff < minDiff) {
        minDiff = diff;
        bestCols = cols;
        bestRows = rows;
      }
    }
    return { cols: bestCols, rows: bestRows };
  };

  const drawCollage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const margin = frameSize;
    const gap = frameSize;
    const availableWidth = CANVAS_SIZE - (margin * 2);
    const availableHeight = CANVAS_SIZE - (margin * 2);

    const imagePromises = photos.map(photo => {
      return new Promise<{img: HTMLImageElement, ar: number}>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const rotation = photo.rotation || 0;
          const isVertical = rotation % 180 !== 0;
          const ar = isVertical ? img.height / img.width : img.width / img.height;
          resolve({ img, ar });
        };
        img.src = photo.base64;
      });
    });

    const loadedData = await Promise.all(imagePromises);
    const avgAR = loadedData.reduce((sum, d) => sum + d.ar, 0) / (loadedData.length || 1);

    const { cols, rows } = calculateBestLayout(photos.length, avgAR, availableWidth, availableHeight);
    
    const cellW = (availableWidth - (cols - 1) * gap) / cols;
    const cellH = (availableHeight - (rows - 1) * gap) / rows;

    layoutInfo.current = { cols, rows, cellW, cellH, margin, gap };

    const drawImageInRect = (img: HTMLImageElement, x: number, y: number, w: number, h: number, photo: Photo, opacity = 1) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      const radius = frameSize > 0 ? 12 : 0;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.closePath();
      ctx.clip();

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      
      const rotation = photo.rotation || 0;
      ctx.rotate((rotation * Math.PI) / 180);

      const isVerticalRotation = rotation % 180 !== 0;
      const targetW = isVerticalRotation ? h : w;
      const targetH = isVerticalRotation ? w : h;

      const imgW = img.width || 1;
      const imgH = img.height || 1;
      const imgRatio = imgW / imgH;
      const targetRatio = targetW / targetH;
      
      let sw, sh, sx, sy;

      if (imgRatio > targetRatio) {
        sh = imgH;
        sw = sh * targetRatio;
        const maxSlackX = (imgW - sw);
        sx = (maxSlackX / 2) - (photo.offsetX || 0);
        sy = 0;
        if (sx < 0) sx = 0;
        if (sx > maxSlackX) sx = maxSlackX;
      } else {
        sw = imgW;
        sh = sw / targetRatio;
        const maxSlackY = (imgH - sh);
        sx = 0;
        sy = (maxSlackY / 2) - (photo.offsetY || 0);
        if (sy < 0) sy = 0;
        if (sy > maxSlackY) sy = maxSlackY;
      }

      ctx.drawImage(img, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();

      if (showFilenames) {
        const labelHeight = Math.max(24, Math.min(cellH * 0.15, 48));
        const fontSize = Math.max(12, Math.min(cellH * 0.08, 22));
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(x, y + h - labelHeight, w, labelHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let displayName = photo.name;
        const maxTextWidth = w * 0.9;
        if (ctx.measureText(displayName).width > maxTextWidth) {
          while (ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
            displayName = displayName.substring(0, displayName.length - 1);
          }
          displayName += '...';
        }
        ctx.fillText(displayName, x + w / 2, y + h - labelHeight / 2);
      }

      ctx.restore();
    };

    loadedData.forEach((data, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gap);
      const y = margin + row * (cellH + gap);
      
      const isSource = isDragging && mode === 'swap' && dragState.current?.photoIndex === i;
      drawImageInRect(data.img, x, y, cellW, cellH, photos[i], isSource ? 0.2 : 1);
    });

    if (isDragging && mode === 'swap' && dragState.current) {
      const ghostData = loadedData[dragState.current.photoIndex];
      const photo = photos[dragState.current.photoIndex];
      const gx = dragState.current.currentX - cellW / 2;
      const gy = dragState.current.currentY - cellH / 2;
      
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 40;
      drawImageInRect(ghostData.img, gx, gy, cellW, cellH, photo, 0.85);
      ctx.restore();
    }
  };

  useEffect(() => {
    drawCollage();
  }, [photos, frameSize, isDragging, mode, showFilenames]);

  const getCanvasMousePos = (e: React.MouseEvent | React.TouchEvent | React.DragEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (clientY - rect.top) * (CANVAS_SIZE / rect.height)
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasMousePos(e);
    const { margin, gap, cellW, cellH, cols } = layoutInfo.current;

    for (let i = 0; i < photos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gap);
      const y = margin + row * (cellH + gap);

      if (pos.x >= x && pos.x <= x + cellW && pos.y >= y && pos.y <= y + cellH) {
        setIsDragging(true);
        dragState.current = {
          photoIndex: i,
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
          initialOffsetX: photos[i].offsetX || 0,
          initialOffsetY: photos[i].offsetY || 0
        };
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragState.current) return;
    const pos = getCanvasMousePos(e);
    const photo = photos[dragState.current.photoIndex];
    
    dragState.current.currentX = pos.x;
    dragState.current.currentY = pos.y;

    if (mode === 'pan') {
      const dx = pos.x - dragState.current.startX;
      const dy = pos.y - dragState.current.startY;

      const rotation = photo.rotation || 0;
      const isVerticalRotation = rotation % 180 !== 0;
      const targetW = isVerticalRotation ? layoutInfo.current.cellH : layoutInfo.current.cellW;
      const targetH = isVerticalRotation ? layoutInfo.current.cellW : layoutInfo.current.cellH;

      const imgRatio = (photo.width || 1) / (photo.height || 1);
      const targetRatio = targetW / targetH;
      
      let multiplier = 1;
      if (imgRatio > targetRatio) {
        multiplier = (photo.height || 1) / targetH;
      } else {
        multiplier = (photo.width || 1) / targetW;
      }

      let adjustedDx = dx;
      let adjustedDy = dy;

      if (rotation === 90) { adjustedDx = dy; adjustedDy = -dx; }
      else if (rotation === 180) { adjustedDx = -dx; adjustedDy = -dy; }
      else if (rotation === 270) { adjustedDx = -dy; adjustedDy = dx; }

      onUpdatePhoto({
        ...photo,
        offsetX: dragState.current.initialOffsetX + (adjustedDx * multiplier),
        offsetY: dragState.current.initialOffsetY + (adjustedDy * multiplier)
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragState.current) return;
    
    if (mode === 'swap') {
      const pos = getCanvasMousePos(e);
      const { margin, gap, cellW, cellH, cols } = layoutInfo.current;

      let targetIdx = -1;
      for (let i = 0; i < photos.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * (cellH + gap);

        if (pos.x >= x && pos.x <= x + cellW && pos.y >= y && pos.y <= y + cellH) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx !== -1 && targetIdx !== dragState.current.photoIndex) {
        onSwapPhotos(photos[dragState.current.photoIndex].id, photos[targetIdx].id);
      }
    }

    setIsDragging(false);
    dragState.current = null;
  };

  // NATIVE DRAG HANDLERS (Untuk Tukar Antar Canvas)
  const handleDragStart = (e: React.DragEvent) => {
    if (mode !== 'swap') {
      e.preventDefault();
      return;
    }
    const pos = getCanvasMousePos(e);
    const { margin, gap, cellW, cellH, cols } = layoutInfo.current;

    let sourcePhotoId = '';
    for (let i = 0; i < photos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gap);
      const y = margin + row * (cellH + gap);

      if (pos.x >= x && pos.x <= x + cellW && pos.y >= y && pos.y <= y + cellH) {
        sourcePhotoId = photos[i].id;
        break;
      }
    }

    if (sourcePhotoId) {
      e.dataTransfer.setData('text/plain', sourcePhotoId);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (mode === 'swap') {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (mode !== 'swap') return;

    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId) return;

    const pos = getCanvasMousePos(e);
    const { margin, gap, cellW, cellH, cols } = layoutInfo.current;

    let targetPhotoId = '';
    for (let i = 0; i < photos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cellW + gap);
      const y = margin + row * (cellH + gap);

      if (pos.x >= x && pos.x <= x + cellW && pos.y >= y && pos.y <= y + cellH) {
        targetPhotoId = photos[i].id;
        break;
      }
    }

    // Jika drop di area kosong kanvas ini, ambil foto pertama di kanvas ini sebagai target default
    if (!targetPhotoId && photos.length > 0) {
      targetPhotoId = photos[0].id;
    }

    if (targetPhotoId && sourceId !== targetPhotoId) {
      onSwapPhotos(sourceId, targetPhotoId);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `collage-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex bg-slate-200 p-1 rounded-xl w-fit self-center shadow-inner">
        <button 
          onClick={() => setMode('pan')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'pan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-arrows-up-down-left-right"></i> Geser Isi
        </button>
        <button 
          onClick={() => setMode('swap')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'swap' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-arrow-right-arrow-left"></i> Tukar Foto
        </button>
      </div>

      <div className={`w-full bg-white p-2 rounded-2xl shadow-lg border transition-all duration-200 ${isDragOver ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-slate-100 ring-1 ring-slate-200/50'}`}>
        <div className="relative overflow-hidden rounded-xl bg-slate-50 shadow-inner">
          <canvas 
            ref={canvasRef} 
            draggable={mode === 'swap'}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className={`w-full h-auto block touch-none ${isDragging ? 'cursor-grabbing' : (mode === 'pan' ? 'cursor-grab' : 'cursor-crosshair')}`}
            style={{ aspectRatio: '1/1' }}
          />
        </div>
      </div>
      <button 
        onClick={download}
        className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-1"
      >
        <i className="fa-solid fa-download"></i> Unduh PNG Ini
      </button>
    </div>
  );
};

export default CollageRenderer;
