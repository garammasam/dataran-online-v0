'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/lib/products';

import { usePerformanceSettings } from '@/lib/performance';

interface VideoProductProps {
  product: Product;
  layoutId?: string;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  enableSlider?: boolean;
}

export function VideoProduct({ 
  product, 
  layoutId, 
  maxWidth, 
  maxHeight, 
  className = "",
  enableSlider = false 
}: VideoProductProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceSettings = usePerformanceSettings();
  
  // Extract video URLs from product tags or use fallback (memoized)
  const videoUrls = useMemo(() => 
    product.tags
      ?.filter(tag => tag.startsWith('video:'))
      .map(tag => tag.replace('video:', ''))
      .filter(Boolean) || [],
    [product.tags]
  );

  const hasMultipleVideos = videoUrls.length > 1;
  const currentVideoUrl = videoUrls[currentVideoIndex] || '';

  // Preload next video for smoother transitions (skip on low-perf devices)
  useEffect(() => {
    if (!performanceSettings.isLowPowerMode && hasMultipleVideos && videoUrls.length > 1) {
      const nextIndex = (currentVideoIndex + 1) % videoUrls.length;
      const nextVideoUrl = videoUrls[nextIndex];
      
      if (nextVideoUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = nextVideoUrl;
        document.head.appendChild(link);
        
        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [currentVideoIndex, hasMultipleVideos, videoUrls, performanceSettings.isLowPowerMode]);

  // Intersection Observer to detect when video is visible (skip in PDP mode)
  useEffect(() => {
    // In PDP mode (enableSlider=true), always consider video visible
    if (enableSlider) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [enableSlider]);

  // Auto-play when video becomes visible
  useEffect(() => {
    if (isVisible && videoRef.current && !isPlaying) {
      // Immediate play - no artificial delay
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        // Auto-play might fail due to browser policies, that's okay
      });
    }
  }, [isVisible, isPlaying]);

  // Immediate auto-play for PDP mode when video loads
  useEffect(() => {
    if (enableSlider && videoRef.current && currentVideoUrl) {
      // Small delay to ensure video metadata is loaded
      const timer = setTimeout(() => {
        if (videoRef.current && !isPlaying) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(error => {
            // Auto-play might fail, that's okay
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [enableSlider, currentVideoUrl, isPlaying]);

  // Pause when video is not visible or component unmounts (skip in PDP mode)
  useEffect(() => {
    if (!enableSlider && !isVisible && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [enableSlider, isVisible, isPlaying]);

  // Cleanup when component unmounts (snapshot ref)
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVideoClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only handle mute/unmute in PDP view (when enableSlider is true)
    if (enableSlider) {
      e.stopPropagation(); // Prevent event bubbling
      setIsMuted(!isMuted); // Toggle mute/unmute
      
      // Ensure video is playing
      if (!isPlaying && videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          // Auto-play might fail due to browser policies
        });
      }
    }
    // In grid view, let the click bubble up to open PDP
  }, [enableSlider, isMuted, isPlaying]);

  const handleVideoEnd = useCallback(() => {
    if (hasMultipleVideos) {
      setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
    }
  }, [hasMultipleVideos, videoUrls.length]);

  const nextVideo = useCallback(() => {
    if (hasMultipleVideos) {
      setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
    }
  }, [hasMultipleVideos, videoUrls.length]);

  const prevVideo = useCallback(() => {
    if (hasMultipleVideos) {
      setCurrentVideoIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length);
    }
  }, [hasMultipleVideos, videoUrls.length]);

  // If no video URLs, show placeholder
  if (!currentVideoUrl) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ 
          maxWidth: maxWidth || '100%',
          maxHeight: maxHeight || 'auto',
          aspectRatio: '4/5'
        }}
      >
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Video not available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      style={{ 
        maxWidth: maxWidth || '100%',
        maxHeight: maxHeight || 'auto'
      }}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={currentVideoUrl}
        className={`w-full ${enableSlider ? 'h-auto max-h-full object-cover cursor-pointer aspect-[4/5] sm:aspect-auto sm:object-contain' : 'object-cover aspect-[4/5]'}`}
        style={enableSlider ? { 
          maxWidth: '100%',
          maxHeight: 'calc(var(--safe-viewport-height) - var(--image-max-height-offset))'
        } : { 
          width: '100%',
          aspectRatio: '4 / 5',
          height: 'auto'
        }}
        muted={isMuted}
        loop={true}
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
        onTouchEnd={handleVideoClick}
        playsInline
        preload={performanceSettings.isLowPowerMode ? "metadata" : "auto"} // Lighter preload for low-perf
        autoPlay={false} // We handle auto-play manually
      />
    </div>
  );
}