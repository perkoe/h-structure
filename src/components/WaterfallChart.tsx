import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HierarchyNode } from '../types/hierarchy';

interface Props {
  data: HierarchyNode;
}

interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
  isSkipped: boolean;
  isInverted: boolean;
}

export default function WaterfallChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

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

    // Process each quarter and month
    data.children?.forEach(quarter => {
      quarter.children?.forEach(month => {
        const value = month.calculatedValue;
        cumulative += value;
        
        waterfallData.push({
          name: month.name,
          value: value,
          cumulative: cumulative,
          type: value >= 0 ? 'positive' : 'negative',
          isSkipped: month.status === 'skip',
          isInverted: month.status === 'invert'
        });
      });
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

    // Clear previous chart
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

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

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500');

    // Add zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3');

    // Add bars
    waterfallData.forEach((d, i) => {
      if (i === 0) return; // Skip start point

      const barHeight = Math.abs(yScale(d.cumulative) - yScale(d.cumulative - d.value));
      const barY = d.value >= 0 ? yScale(d.cumulative) : yScale(d.cumulative - d.value);

      let barColor = '#3b82f6'; // Default blue
      if (d.type === 'total') barColor = '#1f2937'; // Dark gray for totals
      else if (d.isSkipped) barColor = '#ef4444'; // Red for skipped
      else if (d.isInverted) barColor = '#f59e0b'; // Orange for inverted
      else if (d.value < 0) barColor = '#ef4444'; // Red for negative

      // Add connecting line from previous bar
      if (i > 1) {
        const prevData = waterfallData[i - 1];
        g.append('line')
          .attr('x1', xScale(prevData.name)! + xScale.bandwidth())
          .attr('x2', xScale(d.name)!)
          .attr('y1', yScale(prevData.cumulative))
          .attr('y2', yScale(d.cumulative - d.value))
          .style('stroke', '#999')
          .style('stroke-width', 1)
          .style('stroke-dasharray', '2,2')
          .style('opacity', 0.7);
      }

      // Add bar
      g.append('rect')
        .attr('x', xScale(d.name)!)
        .attr('y', barY)
        .attr('width', xScale.bandwidth())
        .attr('height', barHeight)
        .style('fill', barColor)
        .style('opacity', d.isSkipped ? 0.6 : 0.9)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

      // Add value labels
      g.append('text')
        .attr('x', xScale(d.name)! + xScale.bandwidth() / 2)
        .attr('y', barY - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .text(d.value.toFixed(1));
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', '#1f2937')
      .text('Revenue Waterfall Analysis');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, 60)`);

    const legendData = [
      { color: '#3b82f6', label: 'Normal' },
      { color: '#ef4444', label: 'Skipped/Negative' },
      { color: '#f59e0b', label: 'Inverted' },
      { color: '#1f2937', label: 'Total' }
    ];

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .style('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text(d => d.label);

  }, [data]);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <svg
        ref={svgRef}
        width={900}
        height={500}
        className="w-full h-auto"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}