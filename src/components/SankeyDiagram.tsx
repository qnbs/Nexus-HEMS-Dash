import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { EnergyData } from '../types';

interface CustomNode extends SankeyNode<Record<string, unknown>, Record<string, unknown>> {
  name: string;
  color: string;
}

interface CustomLink extends SankeyLink<CustomNode, Record<string, unknown>> {
  value: number;
}

export function SankeyDiagram({ data }: { data: EnergyData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Prepare data
    const nodes: CustomNode[] = [
      { name: 'PV', color: '#facc15' }, // 0
      { name: 'Grid', color: '#ef4444' }, // 1
      { name: 'Battery', color: '#10b981' }, // 2
      { name: 'House', color: '#3b82f6' }, // 3
      { name: 'Heat Pump', color: '#f97316' }, // 4
      { name: 'EV', color: '#8b5cf6' }, // 5
    ];

    const links: CustomLink[] = [];

    // Simple logic to distribute power (simplified for visualization)
    let pvRemaining = Math.max(0, data.pvPower);
    let batteryDischarge = Math.max(0, data.batteryPower); // Positive means discharging
    const batteryCharge = Math.max(0, -data.batteryPower); // Negative means charging

    // PV to House
    const pvToHouse = Math.min(pvRemaining, data.houseLoad);
    if (pvToHouse > 0) {
      links.push({ source: 0, target: 3, value: pvToHouse });
      pvRemaining -= pvToHouse;
    }

    // PV to Heat Pump
    const pvToHp = Math.min(pvRemaining, data.heatPumpPower);
    if (pvToHp > 0) {
      links.push({ source: 0, target: 4, value: pvToHp });
      pvRemaining -= pvToHp;
    }

    // PV to EV
    const pvToEv = Math.min(pvRemaining, data.evPower);
    if (pvToEv > 0) {
      links.push({ source: 0, target: 5, value: pvToEv });
      pvRemaining -= pvToEv;
    }

    // PV to Battery
    const pvToBat = Math.min(pvRemaining, batteryCharge);
    if (pvToBat > 0) {
      links.push({ source: 0, target: 2, value: pvToBat });
      pvRemaining -= pvToBat;
    }

    // PV to Grid (Export)
    if (pvRemaining > 0) {
      links.push({ source: 0, target: 1, value: pvRemaining });
    }

    // Battery to House
    const batToHouse = Math.min(batteryDischarge, data.houseLoad - pvToHouse);
    if (batToHouse > 0) {
      links.push({ source: 2, target: 3, value: batToHouse });
      batteryDischarge -= batToHouse;
    }

    // Grid to House
    const gridToHouse = Math.max(0, data.houseLoad - pvToHouse - batToHouse);
    if (gridToHouse > 0) {
      links.push({ source: 1, target: 3, value: gridToHouse });
    }

    // Grid to Heat Pump
    const gridToHp = Math.max(0, data.heatPumpPower - pvToHp);
    if (gridToHp > 0) {
      links.push({ source: 1, target: 4, value: gridToHp });
    }

    // Grid to EV
    const gridToEv = Math.max(0, data.evPower - pvToEv);
    if (gridToEv > 0) {
      links.push({ source: 1, target: 5, value: gridToEv });
    }

    // Grid to Battery
    const gridToBat = Math.max(0, batteryCharge - pvToBat);
    if (gridToBat > 0) {
      links.push({ source: 1, target: 2, value: gridToBat });
    }

    // Filter out zero-value links
    const activeLinks = links.filter((l) => l.value > 10); // threshold to avoid tiny lines

    if (activeLinks.length === 0) return;

    const sankeyGenerator = sankey<CustomNode, CustomLink>()
      .nodeWidth(15)
      .nodePadding(20)
      .extent([
        [10, 10],
        [width - 10, height - 10],
      ]);

    const graph = sankeyGenerator({
      nodes: nodes.map((d) => Object.assign({}, d)),
      links: activeLinks.map((d) => Object.assign({}, d)),
    });

    // Draw links
    svg
      .append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.source as CustomNode).color)
      .attr('stroke-width', (d) => Math.max(1, d.width || 0))
      .attr('stroke-opacity', 0.4)
      .style('mix-blend-mode', 'screen')
      .append('title')
      .text(
        (d) =>
          `${(d.source as CustomNode).name} → ${(d.target as CustomNode).name}\n${Math.round(d.value)} W`,
      );

    // Draw nodes
    const node = svg
      .append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    node
      .append('rect')
      .attr('height', (d) => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', (d) => d.color)
      .attr('rx', 4)
      .append('title')
      .text((d) => `${d.name}\n${Math.round(d.value || 0)} W`);

    node
      .append('text')
      .attr('x', (d) => ((d.x0 || 0) < width / 2 ? 20 : -5))
      .attr('y', (d) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => ((d.x0 || 0) < width / 2 ? 'start' : 'end'))
      .text((d) => `${d.name} (${Math.round(d.value || 0)}W)`)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');
  }, [data]);

  return <svg ref={svgRef} className="w-full h-full absolute inset-0" />;
}
