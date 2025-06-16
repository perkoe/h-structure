import  { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

  // Memoize filtered data to avoid recalculating on every render
  const filteredData = useMemo(() => {
    if (!data) return null;

    const filterNode = (node: HierarchyNode): HierarchyNode | null => {
      const matchesSearch = !uiSettings.searchTerm ||
          node.name.toLowerCase().includes(uiSettings.searchTerm.toLowerCase());

      const matchesStatusFilter = uiSettings.statusFilter === 'all' ||
          node.status === uiSettings.statusFilter;

      if (!matchesSearch || !matchesStatusFilter) {
        return null;
      }

      const filteredChildren = node.children?.map(filterNode).filter(Boolean) as HierarchyNode[] | undefined;

      return {
        ...node,
        children: filteredChildren
      };
    };

    return filterNode(data);
  }, [data, uiSettings.searchTerm, uiSettings.statusFilter]);

  // Memoize color functions to avoid recalculation
  const colorFunctions = useMemo(() => {
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

    return { getNodeColor, getTextColor };
  }, [uiSettings.colorScheme]);

  const handleResize = useCallback(() => {
    if (svgRef.current?.parentElement) {
      const rect = svgRef.current.parentElement.getBoundingClientRect();
      setDimensions({
        width: Math.max(800, rect.width - 40),
        height: Math.max(600, rect.height - 40)
      });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!svgRef.current || !filteredData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();


    const nodeWidth = Math.min(config.nodeWidth, 100); // Limit max width for performance
    const nodeHeight = Math.max(config.nodeHeight, uiSettings.nodeHeight);
    const fontSize = Math.min(uiSettings.fontSize, 16); // Limit font size for performance


    const root = d3.hierarchy(filteredData, d => d.children);

    // Limit tree depth for performance (only show first 3 levels by default)
    const maxDepth = 3;
    root.each(d => {
      if (d.depth >= maxDepth && d.children) {
        (d as any)._children = d.children;
        d.children = undefined;
      }
    });


    // Create tree layout with optimized spacing
    const treeLayout = d3.tree<HierarchyNode>()
        .size([dimensions.height - 100, dimensions.width - 200])
        .separation((a, b) => {
          return a.parent === b.parent ? 1.2 : 1.5;
        });

    const treeData = treeLayout(root);

    const g = svg.append('g')
        .attr('transform', 'translate(100, 50)');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 2]) // Reduced zoom range for better performance
        .on('zoom', (event) => {
          g.style('transform', `translate3d(${event.transform.x}px, ${event.transform.y}px, 0) scale(${event.transform.k})`);
        });

    svg.call(zoom);

    const nodes = treeData.descendants();
    const links = treeData.links();

    g.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal<d3.HierarchyLink<HierarchyNode>, d3.HierarchyPointNode<HierarchyNode>>()
            .x(d => d.y)
            .y(d => d.x))
        .style('fill', 'none')
        .style('stroke', uiSettings.colorScheme === 'dark' ? '#6b7280' : '#9ca3af')
        .style('stroke-width', 1.5) // Reduced stroke width
        .style('opacity', 0.6);

    const nodeSelection = g.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y}, ${d.x})`)
        .style('cursor', 'pointer');


    nodeSelection.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('rx', 6) // Fixed border radius for consistency
        .style('fill', d => colorFunctions.getNodeColor(d.data))
        .style('stroke', uiSettings.colorScheme === 'dark' ? '#374151' : '#ffffff')
        .style('stroke-width', 1.5)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .on('mouseover', function(_event, _d) {
          d3.select(this).style('opacity', 0.8);
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .on('mouseout', function(_event, _d) {
          d3.select(this).style('opacity', 1);
        });

    // Node labels (name) with optimized text rendering
    nodeSelection.append('text')
        .attr('dy', uiSettings.showValues ? '-0.3em' : '0.35em')
        .attr('text-anchor', 'middle')
        .style('fill', colorFunctions.getTextColor())
        .style('font-size', `${fontSize}px`)
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text(d => {
          const maxLength = Math.floor(nodeWidth / (fontSize * 0.6));
          return d.data.name.length > maxLength
              ? d.data.name.substring(0, maxLength - 3) + '...'
              : d.data.name;
        });


    if (uiSettings.showValues) {
      nodeSelection.append('text')
          .attr('dy', '1.2em')
          .attr('text-anchor', 'middle')
          .style('fill', colorFunctions.getTextColor())
          .style('font-size', `${fontSize - 2}px`)
          .style('font-weight', '500')
          .style('pointer-events', 'none')
          .text(d => {
            // Simplified number formatting
            const value = d.data.calculatedValue;
            if (Math.abs(value) >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value.toFixed(1);
          });
    }

    if (uiSettings.showChildCount) {
      nodeSelection.filter(d => Array.isArray(d.data.children) && d.data.children.length > 0)
          .append('circle')
          .attr('cx', nodeWidth / 2 - 12)
          .attr('cy', nodeHeight / 2 - 12)
          .attr('r', 8)
          .style('fill', uiSettings.colorScheme === 'dark' ? '#374151' : '#f3f4f6')
          .style('stroke', colorFunctions.getTextColor())
          .style('stroke-width', 1);

      nodeSelection.filter(d => Array.isArray(d.data.children) && d.data.children.length > 0)
          .append('text')
          .attr('x', nodeWidth / 2 - 12)
          .attr('y', nodeHeight / 2 - 12)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('fill', uiSettings.colorScheme === 'dark' ? '#f9fafb' : '#374151')
          .style('font-size', `${Math.max(10, fontSize - 4)}px`)
          .style('font-weight', '600')
          .style('pointer-events', 'none')
          .text(d => Math.min(d.data.children!.length, 99)); // Cap at 99 for display
    }

    nodeSelection.filter(d => d.data.status !== 'normal')
        .append('circle')
        .attr('cx', nodeWidth / 2 - 8)
        .attr('cy', -nodeHeight / 2 + 8)
        .attr('r', 4)
        .style('fill', d => d.data.status === 'skip' ? '#dc2626' : '#d97706')
        .style('stroke', 'white')
        .style('stroke-width', 1);


    let clickTimeout: number;
    nodeSelection
        .on('click', (event, d) => {
          event.stopPropagation();
          // Debounce clicks to prevent rapid firing
          clearTimeout(clickTimeout);
          clickTimeout = setTimeout(() => {
            onNodeClick(d.data.id);
          }, 100);
        })
        .on('contextmenu', (event, d) => {
          event.preventDefault();
          const [x, y] = d3.pointer(event, document.body);
          onNodeRightClick(d.data.id, x, y);
        });

    // Simplified legend with fewer items
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(20, ${dimensions.height - 120})`);

    const legendData = [
      { color: colorFunctions.getNodeColor({ status: 'normal', children: [{}] } as any), label: 'Parent' },
      { color: colorFunctions.getNodeColor({ status: 'normal', children: undefined } as any), label: 'Leaf' },
      { color: colorFunctions.getNodeColor({ status: 'skip' } as any), label: 'Skip' },
      { color: colorFunctions.getNodeColor({ status: 'invert' } as any), label: 'Invert' },
    ];

    const legendItems = legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (_d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('rx', 3)
        .style('fill', d => d.color);

    legendItems.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .style('font-size', `${fontSize - 1}px`)
        .style('fill', uiSettings.colorScheme === 'dark' ? '#f9fafb' : '#374151')
        .style('font-weight', '500')
        .text(d => d.label);

    // Cleanup function
    return () => {
      clearTimeout(clickTimeout);
    };

  }, [filteredData, config, dimensions, onNodeClick, onNodeRightClick, uiSettings, colorFunctions]);

  return (
      <div className={`w-full h-full rounded-lg overflow-hidden shadow-sm border border-gray-200 ${
          uiSettings.colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
            style={{
              // Enable hardware acceleration
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              perspective: 1000
            }}
        />
      </div>
  );
}
