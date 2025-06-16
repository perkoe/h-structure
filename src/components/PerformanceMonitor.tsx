import  { useState, useEffect, useRef } from 'react';
import { Activity, Clock, Cpu } from 'lucide-react';

interface PerformanceStats {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  nodeCount: number;
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    nodeCount: 0
  });
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStart = useRef(0);
  
  useEffect(() => {
    let animationId: number;
    
    const updateStats = () => {
      const now = performance.now();
      frameCount.current++;
      
      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        
        // Get memory usage if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
        
        setStats(prev => ({
          ...prev,
          fps,
          memoryUsage
        }));
        
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationId = requestAnimationFrame(updateStats);
    };
    
    updateStats();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
  
  // Hook into render timing
  useEffect(() => {
    renderStart.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStart.current;
      setStats(prev => ({ ...prev, renderTime }));
    };
  });
  
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg text-sm font-mono">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-green-400" />
          <span>FPS: {stats.fps}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-blue-400" />
          <span>Render: {stats.renderTime.toFixed(1)}ms</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Cpu size={16} className="text-yellow-400" />
          <span>Memory: {stats.memoryUsage}MB</span>
        </div>
      </div>
    </div>
  );
}