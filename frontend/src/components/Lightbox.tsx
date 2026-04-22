import { useEffect } from 'react';
import '../styles/components/Lightbox.css';
import closeLineSvg from '../assets/close_line.svg';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>
        <img src={closeLineSvg} alt="Close" width={24} height={24} style={{ filter: 'invert(1)' }} />
      </button>
      
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button className="lightbox-nav prev" onClick={onPrev}>‹</button>
        )}
        
        <div className="lightbox-image-container">
          <img src={images[currentIndex]} alt="" className="lightbox-image" />
        </div>

        {images.length > 1 && (
          <button className="lightbox-nav next" onClick={onNext}>›</button>
        )}
      </div>

      <div className="lightbox-counter">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
