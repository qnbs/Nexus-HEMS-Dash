import { useEffect, useRef, memo } from 'react';
import { select } from 'd3-selection';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useTranslation } from 'react-i18next';
import { EnergyData } from '../types';
import { cacheSankeyData } from '../lib/offline-cache';

interface CustomNode {
  name: string;
  color: string;
}

interface CustomLink {
  source: number;
  target: number;
  value: number;
}

export const SankeyDiagram = memo(function SankeyDiagram({ data }: { data: EnergyData }) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const isMobile = width < 640; // sm breakpoint

    // Clear previous
    select(svgRef.current).selectAll('*').remove();

    const svg = select(svgRef.current)
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

    const nodeWidth = isMobile ? 10 : 15;
    const nodePadding = isMobile ? 15 : 20;
    const fontSize = isMobile ? '10px' : '12px';
    const padding = isMobile ? 5 : 10;

    const sankeyGenerator = sankey<CustomNode, CustomLink>()
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [padding, padding],
        [width - padding, height - padding],
      ]);

    const graph = sankeyGenerator({
      nodes: nodes.map((d) => Object.assign({}, d)),
      links: activeLinks.map((d) => Object.assign({}, d)),
    });

    // Define gradient defs for links
    const defs = svg.append('defs');

    // Create gradients for each link
    activeLinks.forEach((link, i) => {
      const sourceColor = nodes[link.source].color;
      const targetColor = nodes[link.target].color;
      const gradient = defs
        .append('linearGradient')
        .attr('id', `link-gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse');
      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', sourceColor)
        .attr('stop-opacity', 0.6);
      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', targetColor)
        .attr('stop-opacity', 0.4);
    });

    // Draw links with gradient strokes
    svg
      .append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (_d, i) => `url(#link-gradient-${i})`)
      .attr('stroke-width', (d) => Math.max(1, d.width || 0))
      .attr('stroke-opacity', 0.5)
      .attr('class', 'energy-flow-path')
      .style('filter', (d) => {
        const color = (d.source as CustomNode).color;
        return `drop-shadow(0 0 4px ${color}50)`;
      })
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease-out')
      .on('mouseenter', function (_event, d) {
        select(this)
          .attr('stroke-opacity', 0.75)
          .attr('stroke-width', Math.max(2, (d.width || 0) + 2))
          .style('filter', () => {
            const color = (d.source as CustomNode).color;
            return `drop-shadow(0 0 8px ${color}70)`;
          });
      })
      .on('mouseleave', function (_event, d) {
        select(this)
          .attr('stroke-opacity', 0.5)
          .attr('stroke-width', Math.max(1, d.width || 0))
          .style('filter', () => {
            const color = (d.source as CustomNode).color;
            return `drop-shadow(0 0 4px ${color}50)`;
          });
      })
      .append('title')
      .text(
        (d) =>
          `${(d.source as CustomNode).name} → ${(d.target as CustomNode).name}\n${Math.round(d.value)} W`,
      );

    // Draw nodes with subtle styling
    const node = svg
      .append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer');

    node
      .append('rect')
      .attr('height', (d) => (d.y1 || 0) - (d.y0 || 0))
      .attr('width', (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.9)
      .attr('rx', 6)
      .attr('ry', 6)
      .style('filter', (d) => `drop-shadow(0 2px 4px ${d.color}30)`)
      .style('transition', 'all 0.2s ease-out')
      .on('mouseenter', function (_event, d) {
        select(this)
          .attr('fill-opacity', 1)
          .style('filter', `drop-shadow(0 4px 12px ${d.color}60)`);
      })
      .on('mouseleave', function (_event, d) {
        select(this)
          .attr('fill-opacity', 0.9)
          .style('filter', `drop-shadow(0 2px 4px ${d.color}30)`);
      })
      .append('title')
      .text((d) => `${d.name}\n${Math.round(d.value || 0)} W`);

    node
      .append('text')
      .attr('x', (d) => ((d.x0 || 0) < width / 2 ? nodeWidth + 5 : -5))
      .attr('y', (d) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => ((d.x0 || 0) < width / 2 ? 'start' : 'end'))
      .text((d) => (isMobile ? `${d.name}` : `${d.name} (${Math.round(d.value || 0)}W)`))
      .attr('fill', '#e2e8f0')
      .attr('font-size', fontSize)
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Cache Sankey data for offline mode
    void cacheSankeyData(
      graph.nodes.map((n) => ({ name: n.name, color: n.color, value: n.value })),
      graph.links.map((l) => ({
        source: (l.source as CustomNode).name,
        target: (l.target as CustomNode).name,
        value: l.value,
      })),
    );
  }, [data]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={t('sankey.ariaLabel')}
      aria-live="polite"
      aria-atomic="false"
    >
      <title>{t('sankey.title')}</title>
      <desc>
        {t('sankey.desc', {
          pvPower: Math.round(data.pvPower),
          batterySoC: data.batterySoC.toFixed(1),
          houseLoad: Math.round(data.houseLoad),
          gridDirection: data.gridPower > 0 ? t('sankey.importing') : t('sankey.exporting'),
          gridPower: Math.abs(Math.round(data.gridPower)),
        })}
      </desc>
    </svg>
  );
});
