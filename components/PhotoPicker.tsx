
import React, { useRef } from 'react';
import { Photo } from '../types';

interface PhotoPickerProps {
  onPhotosSelected: (photos: Photo[]) => void;
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ onPhotosSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              height: img.height
            });
          };
          img.src = base64;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(photoPromises).then(onPhotosSelected);
    if (e.target) e.target.value = ''; // Reset input so same file can be selected again
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-[2.5rem] bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer shadow-sm" 
         onClick={() => fileInputRef.current?.click()}>
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
      />
      <div className="w-20 h-20 bg-blue-100/50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300 shadow-inner">
        <i className="fa-solid fa-images text-blue-600 text-4xl"></i>
      </div>
      <h3 className="text-2xl font-bold text-slate-800">Unggah Foto</h3>
      <p className="text-slate-500 text-center mt-3 leading-relaxed">
        Pilih beberapa foto dari perangkat Anda <br/> 
        untuk diatur menjadi kolase otomatis secara cerdas.
      </p>
      <div className="mt-8 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:shadow-[0_15px_25px_-5px_rgba(37,99,235,0.5)] transition-all active:scale-95">
        <i className="fa-solid fa-file-import"></i>
        <span>Pilih File Lokal</span>
      </div>
      <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Format: JPG, PNG, WEBP</p>
    </div>
  );
};

export default PhotoPicker;
