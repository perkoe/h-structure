import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HierarchyNode {
  name: string;
  calculatedValue: number;
  status?: 'skip' | 'invert' | 'normal';
  children?: HierarchyNode[];
}

interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
  isSkipped: boolean;
  isInverted: boolean;
}

interface Props {
  data: HierarchyNode;
}

export default function WaterfallChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Prepare waterfall data
    const waterfallData: WaterfallData[] = [];
    let cumulative = 0;

    // Add starting point
    waterfallData.push({
      name: 'Start',
      value: 0,
      cumulative: 0,
      type: 'total',
      isSkipped: false,
      isInverted: false
    });

    // Process data - flatten all values
    const processNode = (node: HierarchyNode) => {
      if (node.children) {
        node.children.forEach(child => processNode(child));
      } else {
        const value = node.calculatedValue;
        cumulative += value;

        waterfallData.push({
          name: node.name,
          value: value,
          cumulative: cumulative,
          type: value >= 0 ? 'positive' : 'negative',
          isSkipped: node.status === 'skip',
          isInverted: node.status === 'invert'
        });
      }
    };

    data.children?.forEach(quarter => {
      quarter.children?.forEach(month => processNode(month));
    });

    // Add total
    waterfallData.push({
      name: 'Total',
      value: cumulative,
      cumulative: cumulative,
      type: 'total',
      isSkipped: false,
      isInverted: false
    });

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const width = rect.width - margin.left - margin.right;
    const height = rect.height - margin.top - margin.bottom;

    // Scales
    const xScale = d3.scaleBand()
        .domain(waterfallData.map(d => d.name))
        .range([0, width])
        .padding(0.2);

    const maxValue = Math.max(...waterfallData.map(d => Math.max(d.cumulative, d.cumulative - d.value)));
    const minValue = Math.min(0, ...waterfallData.map(d => Math.min(d.cumulative, d.cumulative - d.value)));

    const yScale = d3.scaleLinear()
        .domain([minValue * 1.1, maxValue * 1.1])
        .range([height, 0]);

    ctx.save();
    ctx.translate(margin.left, margin.top);

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // Draw bars in batches for better performance
    const batchSize = 100;
    let currentBatch = 0;

    const drawBatch = () => {
      const startIdx = currentBatch * batchSize + 1;
      const endIdx = Math.min(startIdx + batchSize, waterfallData.length);

      for (let i = startIdx; i < endIdx; i++) {
        const d = waterfallData[i];

        const barHeight = Math.abs(yScale(d.cumulative) - yScale(d.cumulative - d.value));
        const barY = d.value >= 0 ? yScale(d.cumulative) : yScale(d.cumulative - d.value);
        const barX = xScale(d.name) || 0;
        const barWidth = xScale.bandwidth();

        if (d.type === 'total') ctx.fillStyle = '#1f2937';
        else if (d.isSkipped) ctx.fillStyle = '#ef4444';
        else if (d.isInverted) ctx.fillStyle = '#f59e0b';
        else if (d.value < 0) ctx.fillStyle = '#ef4444';
        else ctx.fillStyle = '#3b82f6';

        // Draw bar
        ctx.globalAlpha = d.isSkipped ? 0.6 : 0.9;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }

      currentBatch++;

      // Continue drawing if more batches remain
      if (endIdx < waterfallData.length) {
        requestAnimationFrame(drawBatch);
      } else {
        // Draw axis labels after all bars are drawn
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';

        // Sample x-axis labels (show every nth label for performance)
        const labelInterval = Math.ceil(waterfallData.length / 20);
        waterfallData.forEach((d, i) => {
          if (i % labelInterval === 0) {
            const x = (xScale(d.name) || 0) + xScale.bandwidth() / 2;
            ctx.save();
            ctx.translate(x, height + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(d.name, 0, 0);
            ctx.restore();
          }
        });

        // Y-axis labels
        const yTicks = yScale.ticks(10);
        yTicks.forEach(tick => {
          const y = yScale(tick);
          ctx.textAlign = 'right';
          ctx.fillText(tick.toString(), -10, y + 4);
        });
      }
    };

    requestAnimationFrame(drawBatch);
    ctx.restore();

  }, [data]);

  return (
      <div ref={containerRef} className="w-full bg-white rounded-lg border border-gray-200 p-4">
        <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '500px' }}
        />
      </div>
  );
}