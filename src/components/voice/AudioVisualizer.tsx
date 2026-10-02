import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  audioLevel?: number; // 0 - 100 fallback
  barCount?: number;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isRecording,
  audioLevel = 0,
  barCount = 32,
  height = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (!isRecording) {
        // Flat resting line with subtle glow
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
        return;
      }

      const barWidth = Math.max(2, (width / barCount) - 3);

      if (analyserNode) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * h * 0.9);

          const x = i * (barWidth + 3);
          const y = (h - barHeight) / 2;

          // Cyber gradient from cyan to electric gold on high peaks
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (percent > 0.7) {
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(1, '#00f0ff');
          } else {
            gradient.addColorStop(0, '#00f0ff');
            gradient.addColorStop(1, '#0088cc');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, 2) : ctx.rect(x, y, barWidth, barHeight);
          ctx.fill();
        }
      } else {
        // Fallback procedural animation based on audioLevel
        const levelNormalized = audioLevel / 100;
        const time = Date.now() * 0.008;

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time + i * 0.4) * 0.4 + 0.6;
          const barHeight = Math.max(4, wave * levelNormalized * h * 0.85);
          const x = i * (barWidth + 3);
          const y = (h - barHeight) / 2;

          ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserNode, isRecording, audioLevel, barCount, height]);

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'rgba(10, 14, 22, 0.75)',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {!isRecording && (
        <span
          style={{
            position: 'absolute',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-hud)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Audio Visualizer Inactive
        </span>
      )}
    </div>
  );
};
