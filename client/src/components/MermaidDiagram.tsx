import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'monospace',
});

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous
      containerRef.current.innerHTML = '';
      
      const renderDiagram = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Failed to render mermaid diagram:", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-red-500 text-xs font-mono p-2 bg-red-500/10 rounded">Failed to render Mermaid diagram</div>`;
          }
        }
      };
      
      renderDiagram();
    }
  }, [chart]);

  return <div ref={containerRef} className="my-4 flex justify-center bg-black/10 p-4 rounded-xl border border-black/5 overflow-x-auto" />;
}
