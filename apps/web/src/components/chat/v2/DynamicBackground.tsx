'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { theaterColors } from '../utils/theaterColors';
import { EMOTION_COLORS, type EmotionType } from '../utils/emotionColors';

interface DynamicBackgroundProps {
  emotion?: string;
  intensity?: 'subtle' | 'medium' | 'intense';
  enableParticles?: boolean;
  /** Optional background image URL (character background asset 1920×1080) */
  backgroundUrl?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

/**
 * DynamicBackground Component
 *
 * Provides an animated, emotion-responsive background for immersive chat mode.
 * Features:
 * - Optional character background asset support (1920×1080)
 * - Smooth gradient transitions based on emotion state
 * - Optional floating particle effects
 * - Performance-optimized with requestAnimationFrame
 * - Respects prefers-reduced-motion
 * - Vignette effect for depth
 */
export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  emotion = 'neutral',
  intensity = 'medium',
  enableParticles = false,
  backgroundUrl,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const prefersReducedMotion = useRef(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Get emotion colors with fallback to neutral
  const emotionColors = useMemo(() => {
    const normalizedEmotion = emotion.toLowerCase() as EmotionType;
    return EMOTION_COLORS[normalizedEmotion] || EMOTION_COLORS.neutral;
  }, [emotion]);

  // Generate gradient colors based on emotion and intensity
  const gradientColors = useMemo(() => {
    const baseColor = emotionColors.primary;
    const glowColor = emotionColors.glow;

    // Parse RGB from hex
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Intensity multipliers
    const intensityMap = {
      subtle: 0.15,
      medium: 0.25,
      intense: 0.4,
    };
    const alpha = intensityMap[intensity];

    return {
      color1: `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`,
      color2: `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`,
      color3: `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`,
      glow: glowColor,
    };
  }, [emotionColors, intensity]);

  // Initialize particles
  useEffect(() => {
    if (!enableParticles || prefersReducedMotion.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const particleCount = intensity === 'intense' ? 50 : intensity === 'medium' ? 30 : 15;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    particlesRef.current = particles;
  }, [enableParticles, intensity]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation function
    const animate = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw particles if enabled
      if (enableParticles && particlesRef.current.length > 0) {
        particlesRef.current.forEach((particle) => {
          // Update position
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          // Wrap around edges
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.fill();

          // Optional: Add subtle glow
          if (intensity === 'intense') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = gradientColors.glow;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enableParticles, intensity, gradientColors]);

  // CSS gradient background
  const backgroundStyle = useMemo(() => {
    const { color1, color2, color3 } = gradientColors;

    return {
      background: `
        radial-gradient(circle at 20% 50%, ${color1} 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, ${color2} 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, ${color3} 0%, transparent 50%),
        ${theaterColors.voidDark}
      `,
    };
  }, [gradientColors]);

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden transition-all duration-[2000ms] ease-in-out ${className}`}
      style={backgroundStyle}
    >
      {/* Background Image Layer (Character Background Asset) */}
      {backgroundUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.75,
            transition: 'opacity 1s ease-in-out',
          }}
        />
      )}

      {/* Gradient overlay on top of background image - lighter for better visibility */}
      {backgroundUrl && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(26, 20, 41, 0.35) 0%, rgba(26, 20, 41, 0.2) 50%, rgba(26, 20, 41, 0.45) 100%)
            `,
          }}
        />
      )}

      {/* Animated gradient overlay - only active if motion is allowed */}
      {!prefersReducedMotion.current && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                ${emotionColors.glow} 0%,
                transparent 40%)
            `,
            transition: 'opacity 2s ease-in-out',
            willChange: 'opacity',
          }}
        />
      )}

      {/* Particle canvas */}
      {enableParticles && !prefersReducedMotion.current && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            willChange: 'transform',
          }}
        />
      )}

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center,
              transparent 0%,
              transparent 40%,
              rgba(0, 0, 0, 0.3) 100%)
          `,
        }}
      />

      {/* Top/bottom gradient fade for better text readability */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${theaterColors.voidDark} 0%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${theaterColors.voidDark} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

export default DynamicBackground;
