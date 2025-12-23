
import React, { useState, useCallback, useRef } from 'react';
import { Photo } from './types';
import PhotoPicker from './components/PhotoPicker';
import CollageRenderer from './components/CollageRenderer';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [frameSize, setFrameSize] = useState(20);
  const [photosPerCollage, setPhotosPerCollage] = useState(2);
  const [showFilenames, setShowFilenames] = useState(true);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotosSelected = useCallback((newPhotos: Photo[]) => {
    if (newPhotos.length === 0) return;
    const photosWithDefaults = newPhotos.map(p => ({ 
      ...p, 
      offsetX: 0, 
      offsetY: 0,
      rotation: 0 
    }));
    setPhotos(prev => [...prev, ...photosWithDefaults]);
  }, []);

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const removed = prev.find(p => p.id === id);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return filtered;
    });
  };

  const rotatePhoto = (id: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, rotation: ((p.rotation || 0) + 90) % 360 };
      }
      return p;
    }));
  };

  const updatePhoto = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  const handleSwap = (photoId1: string, photoId2: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      const idx1 = newPhotos.findIndex(p => p.id === photoId1);
      const idx2 = newPhotos.findIndex(p => p.id === photoId2);
      if (idx1 !== -1 && idx2 !== -1) {
        [newPhotos[idx1], newPhotos[idx2]] = [newPhotos[idx2], newPhotos[idx1]];
      }
      return newPhotos;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const photoPromises = files.map(file => {
      return new Promise<Photo>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              url: URL.createObjectURL(file),
              name: file.name,
              base64,
              width: img.width,
              height: img.height,
              offsetX: 0,
              offsetY: 0,
              rotation: 0
            });
          };
          img.src = base64;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(photoPromises).then(handlePhotosSelected);
    if (e.target) e.target.value = '';
  };

  const downloadIndividual = () => {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas, index) => {
      const link = document.createElement('a');
      link.download = `collage-${index + 1}.png`;
      link.href = (canvas as HTMLCanvasElement).toDataURL('image/png', 1.0);
      link.click();
    });
    setShowDownloadDropdown(false);
  };

  const downloadAsZip = async () => {
    setIsProcessingZip(true);
    setShowDownloadDropdown(false);
    try {
      const zip = new JSZip();
      const canvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      const blobPromises = canvases.map((canvas, index) => {
        return new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) zip.file(`kolase-${index + 1}.png`, blob);
            resolve();
          }, 'image/png', 1.0);
        });
      });
      await Promise.all(blobPromises);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `batch-collage-${Date.now()}.zip`;
      link.click();
    } catch (error) {
      alert("Gagal membuat file ZIP.");
    } finally {
      setIsProcessingZip(false);
    }
  };

  const photoBatches: Photo[][] = [];
  for (let i = 0; i < photos.length; i += photosPerCollage) {
    photoBatches.push(photos.slice(i, i + photosPerCollage));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Batch-Collage <span className="text-blue-600">Lite</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fast & Offline Local Tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {photos.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                  disabled={isProcessingZip}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessingZip ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-down"></i>}
                  Unduh ({photoBatches.length})
                  <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`}></i>
                </button>
                {showDownloadDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                        <button onClick={downloadAsZip} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 group transition-colors">
                          <i className="fa-solid fa-file-zipper text-indigo-600"></i>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Simpan ZIP</span>
                            <span className="text-[10px] text-slate-400">Semua kolase dalam satu file</span>
                          </div>
                        </button>
                        <button onClick={downloadIndividual} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 group transition-colors">
                          <i className="fa-solid fa-images text-blue-600"></i>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Tiap Gambar</span>
                            <span className="text-[10px] text-slate-400">Unduh terpisah</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {!photos.length ? (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Buat Kolase Batch Sekaligus</h2>
              <p className="text-slate-600 text-lg max-w-xl mx-auto">
                Unggah banyak foto dari perangkat Anda dan susun menjadi kolase otomatis secara instan.
              </p>
            </div>
            
            <div className="w-full max-w-2xl">
              <PhotoPicker onPhotosSelected={handlePhotosSelected} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Foto Per Kolase</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 4, 6, 9].map(num => (
                        <button key={num} onClick={() => setPhotosPerCollage(num)} className={`py-2 rounded-lg border text-sm font-bold transition-all ${photosPerCollage === num ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Tampilkan Nama File</span>
                    <button onClick={() => setShowFilenames(!showFilenames)} className={`w-10 h-5 rounded-full relative transition-colors ${showFilenames ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showFilenames ? 'left-6' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jarak Frame: {frameSize}px</p>
                    <input type="range" min="0" max="100" value={frameSize} onChange={(e) => setFrameSize(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Foto ({photos.length})</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:text-blue-700 font-bold text-xs transition-colors">+ Tambah</button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 scrollbar-hide">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={photo.base64} className="w-full h-full object-cover" style={{ transform: `rotate(${photo.rotation || 0}deg)` }} />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => rotatePhoto(photo.id)} className="text-white text-xs bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors"><i className="fa-solid fa-rotate"></i></button>
                        <button onClick={() => removePhoto(photo.id)} className="text-red-400 text-xs bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Renderer Area */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {photoBatches.map((batch, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center px-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kolase {idx + 1}</h4>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{batch.length} Foto</span>
                    </div>
                    <CollageRenderer 
                      photos={batch} 
                      frameSize={frameSize}
                      onUpdatePhoto={updatePhoto}
                      onSwapPhotos={handleSwap}
                      showFilenames={showFilenames}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 px-6 text-center text-slate-400 text-sm border-t border-slate-200 mt-auto">
        <p>© 2024 Batch-Collage Lite • 100% Offline & Private Processing</p>
      </footer>
    </div>
  );
};

export default App;
