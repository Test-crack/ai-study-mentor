/**
 * ResonanceCanvas.tsx — Scrolling spectrogram with pitch overlay.
 * Improved colour palette: black → midnight blue → cyan → lime → amber → white
 */

import React, { useRef, useEffect, memo } from 'react';
import { HEATMAP_BANDS } from '../utils/resonanceUtils';

interface Props {
    heatmapHistory: Uint8Array[];
    pitchHistory:   number[];
    height?:        number;
}

// Classic spectrogram colour map (amplitude 0–255)
function ampToRGB(v: number): [number, number, number] {
    // 0      → near black
    // 60     → deep navy
    // 120    → electric blue
    // 170    → cyan/teal
    // 210    → lime green
    // 235    → amber
    // 255    → near white
    if (v < 30)  return [4,   4,   8  ];
    if (v < 70)  return [lerp(4,  10, (v-30)/40), lerp(4,  20, (v-30)/40), lerp(8, 100,(v-30)/40)];
    if (v < 120) return [lerp(10, 20, (v-70)/50), lerp(20, 80, (v-70)/50), lerp(100,200,(v-70)/50)];
    if (v < 160) return [lerp(20, 0,  (v-120)/40),lerp(80,200, (v-120)/40),lerp(200,200,(v-120)/40)];
    if (v < 200) return [lerp(0, 100, (v-160)/40),lerp(200,220,(v-160)/40),lerp(200,0,  (v-160)/40)];
    if (v < 230) return [lerp(100,255,(v-200)/30),lerp(220,180,(v-200)/30),0 ];
    return [255, lerp(180,255,(v-230)/25), lerp(0, 200, (v-230)/25)];
}

function lerp(a: number, b: number, t: number) {
    return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

// Map F0 Hz to Y fraction (0=top, 1=bottom) within 80–400Hz
function pitchToY(hz: number): number {
    if (hz <= 0) return -1;
    const logMin = Math.log2(80);
    const logMax = Math.log2(400);
    const logHz  = Math.log2(Math.min(400, Math.max(80, hz)));
    return 1 - (logHz - logMin) / (logMax - logMin);
}

const ResonanceCanvas: React.FC<Props> = memo(({ heatmapHistory, pitchHistory, height = 200 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W      = canvas.width;
        const H      = canvas.height;
        const frames = heatmapHistory.length;

        ctx.fillStyle = '#040406';
        ctx.fillRect(0, 0, W, H);
        if (frames === 0) return;

        const colW = Math.max(1, W / frames);
        const bandH = H / HEATMAP_BANDS;

        // Draw heatmap
        for (let f = 0; f < frames; f++) {
            const x   = f * colW;
            const row = heatmapHistory[f];
            for (let b = 0; b < HEATMAP_BANDS; b++) {
                const v = row[HEATMAP_BANDS - 1 - b]; // low freq at bottom
                const [r, g, bl] = ampToRGB(v);
                ctx.fillStyle = `rgb(${r},${g},${bl})`;
                ctx.fillRect(x, b * bandH, colW + 1, bandH + 1);
            }
        }

        // Pitch overlay — glowing white/purple line
        if (pitchHistory.length >= 2) {
            ctx.save();
            ctx.shadowColor = 'rgba(200,150,255,0.95)';
            ctx.shadowBlur  = 10;
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth   = 2;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';
            ctx.beginPath();
            let started = false;
            for (let f = 0; f < frames; f++) {
                const hz    = pitchHistory[f];
                const yFrac = pitchToY(hz);
                if (yFrac < 0) { started = false; continue; }
                const x = (f + 0.5) * colW;
                const y = yFrac * H;
                if (!started) { ctx.moveTo(x, y); started = true; }
                else           ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Freq axis labels
        const freqLabels = ['80', '200', '500', '1k', '2k', '4k', '8k'];
        const freqHz     = [80, 200, 500, 1000, 2000, 4000, 8000];
        ctx.font      = '9px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'right';
        const logMin = Math.log2(80), logMax = Math.log2(8000);
        freqHz.forEach((hz, i) => {
            const yFrac = 1 - (Math.log2(hz) - logMin) / (logMax - logMin);
            ctx.fillText(freqLabels[i], W - 4, yFrac * H + 3);
        });

    }, [heatmapHistory, pitchHistory]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={height}
            className="w-full rounded-xl"
            style={{ imageRendering: 'pixelated' }}
        />
    );
});

ResonanceCanvas.displayName = 'ResonanceCanvas';
export default ResonanceCanvas;
