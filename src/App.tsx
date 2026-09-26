import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { DvdLogo } from './components/DvdLogo';
import { soundFx } from './services/soundFx';

type CornerId = 'tl' | 'tr' | 'bl' | 'br';

const SOLID_COLORS = [
  '#FFFFFF', // White
  '#00E5FF', // Cyan
  '#FF007F', // Magenta
  '#FFE500', // Yellow
  '#00FF66', // Lime Green
  '#FF5500', // Orange
  '#3D7BFF', // Blue
  '#BD00FF', // Purple
];

const SPEED = 4.4;
const CURVE_START_DIST = 160; // Distance at which 50% curve begins
const CURVE_TURN_RATE = 0.06; // Angular turning speed (radians per frame)

export default function App() {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [colorIndex, setColorIndex] = useState(0);

  // Dimensions
  const [dimensions, setDimensions] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
    logoW: 160,
    logoH: 64,
  });

  // Physics refs to avoid React lag during 60fps animation
  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({ vx: 3.0, vy: 2.2 });
  const colorIdxRef = useRef(0);
  const dimsRef = useRef(dimensions);
  dimsRef.current = dimensions;

  // Corner guidance state:
  // targetCorner: which corner it is heading for
  // willHit: true = 50% corner hit, false = 50% curve away
  // isCurving: whether curve turn is currently active
  // curveDir: 1 or -1 (clockwise or counter-clockwise)
  const guidanceRef = useRef<{
    targetCorner: CornerId;
    cornerCoord: { x: number; y: number };
    willHit: boolean;
    isCurving: boolean;
    curveDir: number;
    hasCurved: boolean;
  }>({
    targetCorner: 'br',
    cornerCoord: { x: 500, y: 400 },
    willHit: Math.random() < 0.5,
    isCurving: false,
    curveDir: 1,
    hasCurved: false,
  });

  // Trigger huge confetti blast from the hit corner directly into the CENTER of the screen
  const triggerConfetti = useCallback((cornerId: CornerId) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Angle in degrees pointing straight from the corner towards the center (w/2, h/2)
    const centerAngleDeg = Math.atan2(h, w) * (180 / Math.PI);

    let originX = 0;
    let originY = 0;
    let angle = 45;

    if (cornerId === 'tl') {
      originX = 0.01;
      originY = 0.01;
      // Downwards and rightwards directly towards screen center
      angle = 360 - centerAngleDeg;
    } else if (cornerId === 'tr') {
      originX = 0.99;
      originY = 0.01;
      // Downwards and leftwards directly towards screen center
      angle = 180 + centerAngleDeg;
    } else if (cornerId === 'bl') {
      originX = 0.01;
      originY = 0.99;
      // Upwards and rightwards directly towards screen center
      angle = centerAngleDeg;
    } else if (cornerId === 'br') {
      originX = 0.99;
      originY = 0.99;
      // Upwards and leftwards directly towards screen center
      angle = 180 - centerAngleDeg;
    }

    const partyColors = [
      '#FFFFFF',
      '#00E5FF',
      '#FF007F',
      '#FFE500',
      '#00FF66',
      '#FF5500',
      '#BD00FF',
    ];

    // Wave 1: Immediate massive burst directed straight towards center
    confetti({
      particleCount: 200,
      angle,
      spread: 60, // Focused spray into center, not wide at floor/ceiling
      origin: { x: originX, y: originY },
      startVelocity: 72,
      gravity: 0.85,
      colors: partyColors,
      zIndex: 99999,
    });

    // Wave 2: Deep center blast
    setTimeout(() => {
      confetti({
        particleCount: 160,
        angle,
        spread: 65,
        origin: { x: originX, y: originY },
        startVelocity: 60,
        gravity: 0.85,
        colors: partyColors,
        zIndex: 99999,
      });
    }, 90);

    // Wave 3: Sustained celebratory explosion
    setTimeout(() => {
      confetti({
        particleCount: 140,
        angle,
        spread: 55,
        origin: { x: originX, y: originY },
        startVelocity: 48,
        ticks: 300,
        gravity: 0.85,
        colors: partyColors,
        zIndex: 99999,
      });
    }, 200);

    // Wave 4: Glitter cloud in center
    setTimeout(() => {
      confetti({
        particleCount: 130,
        angle,
        spread: 50,
        origin: { x: originX, y: originY },
        startVelocity: 40,
        ticks: 380,
        gravity: 0.85,
        colors: partyColors,
        zIndex: 99999,
      });
    }, 320);
  }, []);

  // Update window dimensions
  const updateDims = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const logoW = Math.max(120, Math.min(200, Math.floor(w * 0.15)));
    const logoH = Math.floor(logoW * 0.4);

    setDimensions({ w, h, logoW, logoH });
    dimsRef.current = { w, h, logoW, logoH };

    const maxX = w - logoW;
    const maxY = h - logoH;
    posRef.current.x = Math.max(0, Math.min(posRef.current.x, maxX));
    posRef.current.y = Math.max(0, Math.min(posRef.current.y, maxY));
  }, []);

  useEffect(() => {
    soundFx.initUnlock();
  }, []);

  useEffect(() => {
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, [updateDims]);

  // Corner coordinates helper
  const getCornerCoords = useCallback((cornerId: CornerId) => {
    const maxX = dimsRef.current.w - dimsRef.current.logoW;
    const maxY = dimsRef.current.h - dimsRef.current.logoH;
    switch (cornerId) {
      case 'tl': return { x: 0, y: 0 };
      case 'tr': return { x: maxX, y: 0 };
      case 'bl': return { x: 0, y: maxY };
      case 'br': return { x: maxX, y: maxY };
    }
  }, []);

  // Select next target corner based on current velocity and position
  const selectNextCorner = useCallback((fromCorner?: CornerId) => {
    const { vx, vy } = velRef.current;
    const currentX = posRef.current.x;
    const currentY = posRef.current.y;

    // Potential corners in forward direction
    const candidates: CornerId[] = [];
    if (vx >= 0 && vy >= 0) candidates.push('br', 'tr', 'bl');
    else if (vx >= 0 && vy < 0) candidates.push('tr', 'br', 'tl');
    else if (vx < 0 && vy >= 0) candidates.push('bl', 'tl', 'br');
    else candidates.push('tl', 'bl', 'tr');

    // Filter out previous corner
    const filtered = candidates.filter((c) => c !== fromCorner);
    const chosen = filtered[0] || 'br';
    const targetCoord = getCornerCoords(chosen);

    // Strict 50% probability: 50% willHit = true, 50% willHit = false
    const willHit = Math.random() < 0.5;

    // Randomize curve direction (clockwise vs counter-clockwise)
    const curveDir = Math.random() < 0.5 ? 1 : -1;

    // Steer velocity straight towards chosen corner
    const dx = targetCoord.x - currentX;
    const dy = targetCoord.y - currentY;
    const dist = Math.hypot(dx, dy) || 1;

    velRef.current = {
      vx: (dx / dist) * SPEED,
      vy: (dy / dist) * SPEED,
    };

    guidanceRef.current = {
      targetCorner: chosen,
      cornerCoord: targetCoord,
      willHit,
      isCurving: false,
      curveDir,
      hasCurved: false,
    };
  }, [getCornerCoords]);

  // Main 60fps simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    // Initialize initial corner target
    selectNextCorner();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.min((now - lastTime) / 16.666, 2.0);
      lastTime = now;

      const maxX = dimsRef.current.w - dimsRef.current.logoW;
      const maxY = dimsRef.current.h - dimsRef.current.logoH;

      if (maxX <= 0 || maxY <= 0) return;

      let { x, y } = posRef.current;
      let { vx, vy } = velRef.current;

      const guidance = guidanceRef.current;
      const target = guidance.cornerCoord;

      const dxToCorner = target.x - x;
      const dyToCorner = target.y - y;
      const distToCorner = Math.hypot(dxToCorner, dyToCorner);

      // --- CORNER APPROACH LOGIC (50% CURVE vs 50% HIT) ---
      if (!guidance.willHit && !guidance.hasCurved) {
        // 50% OUTCOME: THE CURVE-AWAY!
        if (distToCorner < CURVE_START_DIST) {
          guidance.isCurving = true;

          // Smoothly rotate velocity vector away from the corner
          let currentAngle = Math.atan2(vy, vx);
          currentAngle += guidance.curveDir * CURVE_TURN_RATE * dt;

          vx = Math.cos(currentAngle) * SPEED;
          vy = Math.sin(currentAngle) * SPEED;

          // If logo has curved significantly away from the corner or hits wall
          if (distToCorner < 28) {
            guidance.hasCurved = true;
            guidance.isCurving = false;
          }
        }
      } else if (guidance.willHit) {
        // 50% OUTCOME: PRECISE HIT LOCK-IN
        // In the final 60px, adjust trajectory so x and y reach bounds at exact same instant
        if (distToCorner < 60 && distToCorner > 2) {
          vx = (dxToCorner / distToCorner) * SPEED;
          vy = (dyToCorner / distToCorner) * SPEED;
        }
      }

      // Step position
      x += vx * dt;
      y += vy * dt;

      // Boundary collision check
      let hitLeft = false;
      let hitRight = false;
      let hitTop = false;
      let hitBottom = false;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
        hitLeft = true;
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
        hitRight = true;
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
        hitTop = true;
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
        hitBottom = true;
      }

      // Exact Corner Hit! (Both an X and Y boundary touched at once)
      const isCornerHit =
        (hitLeft && hitTop) ||
        (hitRight && hitTop) ||
        (hitLeft && hitBottom) ||
        (hitRight && hitBottom);

      if (isCornerHit) {
        let cornerId: CornerId = 'tl';
        if (hitRight && hitTop) cornerId = 'tr';
        if (hitLeft && hitBottom) cornerId = 'bl';
        if (hitRight && hitBottom) cornerId = 'br';

        // 🔔 Celebratory chime sound & massive confetti towards center!
        soundFx.playCornerChime();
        triggerConfetti(cornerId);

        // Next color
        colorIdxRef.current = (colorIdxRef.current + 1) % SOLID_COLORS.length;
        setColorIndex(colorIdxRef.current);

        // Reflect velocities
        velRef.current = { vx, vy };
        posRef.current = { x, y };

        // Select next corner and roll new 50/50
        selectNextCorner(cornerId);
      } else if (hitLeft || hitRight || hitTop || hitBottom) {
        // Subtle springy 'boing' sound on wall bounce
        soundFx.playBoing();

        colorIdxRef.current = (colorIdxRef.current + 1) % SOLID_COLORS.length;
        setColorIndex(colorIdxRef.current);

        velRef.current = { vx, vy };
        posRef.current = { x, y };

        // If it curved away into this wall, now set course straight to next corner!
        if (guidance.isCurving || guidance.hasCurved) {
          guidance.isCurving = false;
          guidance.hasCurved = true;
          selectNextCorner();
        }
      } else {
        velRef.current = { vx, vy };
        posRef.current = { x, y };
      }

      setPos({ x, y });
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectNextCorner, triggerConfetti]);

  const currentColor = SOLID_COLORS[colorIndex];

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none">
      {/* ONLY the moving "Party" text on black background */}
      <div
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          willChange: 'transform',
        }}
        className="absolute top-0 left-0"
      >
        <DvdLogo
          color={currentColor}
          width={dimensions.logoW}
          height={dimensions.logoH}
        />
      </div>
    </div>
  );
}
