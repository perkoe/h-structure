import  { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { HierarchyNode, VisualizationConfig } from '../types/hierarchy';
import { useHierarchyStore } from '../store/hierarchyStore';

interface Props {
  data: HierarchyNode;
  config: VisualizationConfig;
  onNodeClick: (nodeId: string) => void;
  onNodeRightClick: (nodeId: string, x: number, y: number) => void;
}

export default function HierarchyVisualization({ data, config, onNodeClick, onNodeRightClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const { uiSettings } = useHierarchyStore();

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width - 40),
          height: Math.max(600, rect.height - 40)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Use UI settings for node dimensions
    const nodeWidth = config.nodeWidth;
    const nodeHeight = Math.max(config.nodeHeight, uiSettings.nodeHeight);
    const fontSize = uiSettings.fontSize;

    // Create hierarchy from data
    const root = d3.hierarchy(data, d => d.children);
    
    // Create tree layout with dynamic spacing based on UI settings
    const treeLayout = d3.tree<HierarchyNode>()
      .size([dimensions.height - 100, dimensions.width - 200])
      .separation((a, b) => {
        const aWidth = a.data.name.length * (fontSize * 0.6) + nodeWidth;
        const bWidth = b.data.name.length * (fontSize * 0.6) + nodeWidth;
        return (aWidth + bWidth) / (nodeWidth * 2);
      });

    const treeData = treeLayout(root);

    // Create main group with zoom behavior
    const g = svg.append('g')
      .attr('transform', 'translate(100, 50)');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Get colors based on color scheme
    const getNodeColor = (node: HierarchyNode) => {
      const { colorScheme } = uiSettings;
      
      if (colorScheme === 'dark') {
        switch (node.status) {
          case 'skip': return '#7f1d1d';
          case 'invert': return '#92400e';
          default: return node.children ? '#1e3a8a' : '#065f46';
        }
      } else if (colorScheme === 'colorful') {
        switch (node.status) {
          case 'skip': return '#dc2626';
          case 'invert': return '#d97706';
          default: return node.children ? '#3b82f6' : '#10b981';
        }
      } else if (colorScheme === 'minimal') {
        switch (node.status) {
          case 'skip': return '#ef4444';
          case 'invert': return '#f59e0b';
          default: return '#6b7280';
        }
      } else {
        // Default theme
        switch (node.status) {
          case 'skip': return '#ef4444';
          case 'invert': return '#f59e0b';
          default: return node.children ? '#3b82f6' : '#10b981';
        }
      }
    };

    const getTextColor = () => {
      return uiSettings.colorScheme === 'dark' ? '#f9fafb' : '#ffffff';
    };

    // Add links
    const links = g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyLink<HierarchyNode>, d3.HierarchyPointNode<HierarchyNode>>()
        .x(d => d.y)
        .y(d => d.x))
      .style('fill', 'none')
      .style('stroke', uiSettings.colorScheme === 'dark' ? '#6b7280' : '#9ca3af')
      .style('stroke-width', 2)
      .style('opacity', 0.7);

    // Filter nodes based on search and status filter
    const filteredNodes = treeData.descendants().filter(d => {
      const matchesSearch = !uiSettings.searchTerm || 
        d.data.name.toLowerCase().includes(uiSettings.searchTerm.toLowerCase());
      
      const matchesStatusFilter = uiSettings.statusFilter === 'all' || 
        d.data.status === uiSettings.statusFilter;
      
      return matchesSearch && matchesStatusFilter;
    });

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer');

    // Node rectangles
    nodes.append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('x', -nodeWidth / 2)
      .attr('y', -nodeHeight / 2)
      .attr('rx', uiSettings.colorScheme === 'minimal' ? 4 : 8)
      .style('fill', d => getNodeColor(d.data))
      .style('stroke', uiSettings.colorScheme === 'dark' ? '#374151' : '#ffffff')
      .style('stroke-width', uiSettings.colorScheme === 'minimal' ? 1 : 2)
      .style('filter', uiSettings.colorScheme === 'minimal' ? 'none' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1.05)')
          .style('filter', uiSettings.colorScheme === 'minimal' ? 'none' : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1)')
          .style('filter', uiSettings.colorScheme === 'minimal' ? 'none' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');
      });

    // Node labels (name)
    nodes.append('text')
      .attr('dy', '-0.3em')
      .attr('text-anchor', 'middle')
      .style('fill', getTextColor())
      .style('font-size', `${fontSize}px`)
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .text(d => d.data.name);

    // Node values (only if showValues is enabled)
    if (uiSettings.showValues) {
      nodes.append('text')
        .attr('dy', '1.2em')
        .attr('text-anchor', 'middle')
        .style('fill', getTextColor())
        .style('font-size', `${fontSize - 2}px`)
        .style('font-weight', '500')
        .style('pointer-events', 'none')
        .text(d => d.data.calculatedValue.toFixed(1));
    }

    // Child count indicators (only if showChildCount is enabled)
    if (uiSettings.showChildCount) {
      nodes.filter(d => d.data.children && d.data.children.length > 0)
        .append('circle')
        .attr('cx', nodeWidth / 2 - 15)
        .attr('cy', nodeHeight / 2 - 15)
        .attr('r', 10)
        .style('fill', uiSettings.colorScheme === 'dark' ? '#374151' : '#f3f4f6')
        .style('stroke', getTextColor())
        .style('stroke-width', 1);

      nodes.filter(d => d.data.children && d.data.children.length > 0)
        .append('text')
        .attr('x', nodeWidth / 2 - 15)
        .attr('y', nodeHeight / 2 - 15)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('fill', uiSettings.colorScheme === 'dark' ? '#f9fafb' : '#374151')
        .style('font-size', `${Math.max(10, fontSize - 4)}px`)
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => d.data.children!.length);
    }

    // Status indicators
    nodes.filter(d => d.data.status !== 'normal')
      .append('circle')
      .attr('cx', nodeWidth / 2 - 10)
      .attr('cy', -nodeHeight / 2 + 10)
      .attr('r', 6)
      .style('fill', d => d.data.status === 'skip' ? '#dc2626' : '#d97706')
      .style('stroke', 'white')
      .style('stroke-width', 2);

    // Add event listeners
    nodes
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data.id);
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        const [x, y] = d3.pointer(event, document.body);
        onNodeRightClick(d.data.id, x, y);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, ${dimensions.height - 150})`);

    const legendData = [
      { color: getNodeColor({ status: 'normal', children: [{}] } as any), label: 'Parent Node', status: 'normal' },
      { color: getNodeColor({ status: 'normal', children: undefined } as any), label: 'Leaf Node', status: 'normal' },
      { color: getNodeColor({ status: 'skip' } as any), label: 'Skipped', status: 'skip' },
      { color: getNodeColor({ status: 'invert' } as any), label: 'Inverted', status: 'invert' },
    ];

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('rx', 4)
      .style('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 14)
      .style('font-size', `${fontSize}px`)
      .style('fill', uiSettings.colorScheme === 'dark' ? '#f9fafb' : '#374151')
      .style('font-weight', '500')
      .text(d => d.label);

  }, [data, config, dimensions, onNodeClick, onNodeRightClick, uiSettings]);

  return (
    <div className={`w-full h-full rounded-lg overflow-hidden shadow-sm border border-gray-200 ${
      uiSettings.colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}