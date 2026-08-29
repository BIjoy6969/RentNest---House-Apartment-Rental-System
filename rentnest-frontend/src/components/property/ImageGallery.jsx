// src/components/property/ImageGallery.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getImageUrl, DEFAULT_FALLBACK } from '../../utils/imageUrl';

export default function ImageGallery({ images = [], title = 'Property', initialImageUrl }) {
  // Normalize images array
  const rawList = images && images.length > 0
    ? images.map((img, idx) => (typeof img === 'string' ? { url: img, order: idx } : img))
    : initialImageUrl
      ? [{ url: initialImageUrl, order: 0 }]
      : [{ url: DEFAULT_FALLBACK, order: 0 }];

  // Ensure primary image is first or respected
  const sortedImages = [...rawList].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mobile swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const total = sortedImages.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying || isHovered || total <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, total, handleNext]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handleNext, handlePrev]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      handleNext(); // Swiped left -> next image
    } else if (distance < -minSwipeDistance) {
      handlePrev(); // Swiped right -> prev image
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const currentImage = sortedImages[currentIndex] || sortedImages[0];
  const currentUrl = getImageUrl(currentImage?.url);

  return (
    <div style={{ position: 'relative', marginBottom: '2rem' }}>
      {/* Main Showcase Hero */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          height: 'clamp(280px, 45vw, 480px)',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: 'var(--bg-subtle)',
          position: 'relative',
          userSelect: 'none',
          cursor: 'pointer'
        }}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={currentUrl}
          alt={`${title} view ${currentIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease, opacity 0.3s ease'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_FALLBACK;
          }}
        />

        {/* Counter Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            color: '#fff',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            zIndex: 2
          }}
        >
          <span>📷</span>
          <span>{currentIndex + 1} / {total}</span>
        </div>

        {/* Slideshow & Lightbox Controls */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 2
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{isPlaying ? '⏸️' : '▶️'}</span>
              <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>⛶</span>
            <span>Fullscreen</span>
          </button>
        </div>

        {/* Prev / Next Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '1rem',
                transform: 'translateY(-50%)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-main)',
                zIndex: 2,
                transition: 'transform 0.15s ease, background-color 0.15s ease'
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              style={{
                position: 'absolute',
                top: '50%',
                right: '1rem',
                transform: 'translateY(-50%)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-main)',
                zIndex: 2,
                transition: 'transform 0.15s ease, background-color 0.15s ease'
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {total > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            marginTop: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'thin'
          }}
        >
          {sortedImages.map((img, idx) => {
            const thumbUrl = getImageUrl(img.url);
            const isActive = idx === currentIndex;
            return (
              <button
                key={img._id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  flex: '0 0 84px',
                  height: '60px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: isActive ? '3px solid var(--primary)' : '2px solid transparent',
                  opacity: isActive ? 1 : 0.65,
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-subtle)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_FALLBACK;
                  }}
                />
                {img.isPrimary && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      fontSize: '0.65rem',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      borderRadius: '3px',
                      padding: '1px 3px'
                    }}
                  >
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 15, 30, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar with Title & Close */}
          <div
            style={{
              position: 'absolute',
              top: '1.5rem',
              left: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h3>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Photo {currentIndex + 1} of {total}
              </span>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Image */}
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentUrl}
              alt={`${title} fullscreen`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>

          {/* Lightbox Nav Arrows */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                style={{
                  position: 'absolute',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  border: 'none',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  fontSize: '1.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Previous (Arrow Left)"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  border: 'none',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  fontSize: '1.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Next (Arrow Right)"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
