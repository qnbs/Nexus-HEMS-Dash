/**
 * sankey-worker.ts — Off-main-thread energy flow graph computation.
 *
 * Receives EnergyData, computes node/link distribution and runs the
 * d3-sankey layout algorithm, then posts back the positioned graph
 * ready for DOM rendering on the main thread.
 */

import { sankey as sankeyLayout } from 'd3-sankey';

// ─── Shared types (duplicated to avoid bundler issues in workers) ────

interface EnergyDataInput {
  pvPower: number;
  batteryPower: number;
  houseLoad: number;
  heatPumpPower: number;
  evPower: number;
  gridPower: number;
}

interface SankeyNode {
  name: string;
  color: string;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  value?: number;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  width?: number;
  y0?: number;
  y1?: number;
  sourceNode?: SankeyNode;
  targetNode?: SankeyNode;
}

export interface SankeyWorkerInput {
  data: EnergyDataInput;
  width: number;
  height: number;
}

export interface SankeyGraphResult {
  nodes: Array<{
    name: string;
    color: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    value: number;
  }>;
  links: Array<{
    sourceIndex: number;
    targetIndex: number;
    sourceName: string;
    targetName: string;
    sourceColor: string;
    targetColor: string;
    value: number;
    width: number;
    y0: number;
    y1: number;
    sourceX1: number;
    targetX0: number;
  }>;
}

export interface SankeyWorkerOutput {
  type: 'result';
  graph: SankeyGraphResult | null;
}

// ─── Core computation ────────────────────────────────────────────────

const NODES: Array<{ name: string; color: string }> = [
  { name: 'PV', color: '#facc15' },
  { name: 'Grid', color: '#ef4444' },
  { name: 'Battery', color: '#10b981' },
  { name: 'House', color: '#3b82f6' },
  { name: 'Heat Pump', color: '#f97316' },
  { name: 'EV', color: '#8b5cf6' },
];

function computeEnergyFlow(
  data: EnergyDataInput,
): Array<{ source: number; target: number; value: number }> {
  const links: Array<{ source: number; target: number; value: number }> = [];

  let pvRemaining = Math.max(0, data.pvPower);
  let batteryDischarge = Math.max(0, data.batteryPower);
  const batteryCharge = Math.max(0, -data.batteryPower);

  // PV → House
  const pvToHouse = Math.min(pvRemaining, data.houseLoad);
  if (pvToHouse > 0) {
    links.push({ source: 0, target: 3, value: pvToHouse });
    pvRemaining -= pvToHouse;
  }

  // PV → Heat Pump
  const pvToHp = Math.min(pvRemaining, data.heatPumpPower);
  if (pvToHp > 0) {
    links.push({ source: 0, target: 4, value: pvToHp });
    pvRemaining -= pvToHp;
  }

  // PV → EV
  const pvToEv = Math.min(pvRemaining, data.evPower);
  if (pvToEv > 0) {
    links.push({ source: 0, target: 5, value: pvToEv });
    pvRemaining -= pvToEv;
  }

  // PV → Battery
  const pvToBat = Math.min(pvRemaining, batteryCharge);
  if (pvToBat > 0) {
    links.push({ source: 0, target: 2, value: pvToBat });
    pvRemaining -= pvToBat;
  }

  // PV → Grid (Export)
  if (pvRemaining > 0) {
    links.push({ source: 0, target: 1, value: pvRemaining });
  }

  // Battery → House
  const batToHouse = Math.min(batteryDischarge, data.houseLoad - pvToHouse);
  if (batToHouse > 0) {
    links.push({ source: 2, target: 3, value: batToHouse });
    batteryDischarge -= batToHouse;
  }

  // Grid → House
  const gridToHouse = Math.max(0, data.houseLoad - pvToHouse - batToHouse);
  if (gridToHouse > 0) {
    links.push({ source: 1, target: 3, value: gridToHouse });
  }

  // Grid → Heat Pump
  const gridToHp = Math.max(0, data.heatPumpPower - pvToHp);
  if (gridToHp > 0) {
    links.push({ source: 1, target: 4, value: gridToHp });
  }

  // Grid → EV
  const gridToEv = Math.max(0, data.evPower - pvToEv);
  if (gridToEv > 0) {
    links.push({ source: 1, target: 5, value: gridToEv });
  }

  // Grid → Battery
  const gridToBat = Math.max(0, batteryCharge - pvToBat);
  if (gridToBat > 0) {
    links.push({ source: 1, target: 2, value: gridToBat });
  }

  return links.filter((l) => l.value > 10);
}

function computeSankeyGraph(input: SankeyWorkerInput): SankeyGraphResult | null {
  const activeLinks = computeEnergyFlow(input.data);
  if (activeLinks.length === 0) return null;

  const isMobile = input.width < 640;
  const nodeWidth = isMobile ? 10 : 15;
  const nodePadding = isMobile ? 15 : 20;
  const padding = isMobile ? 5 : 10;

  const generator = sankeyLayout<SankeyNode, SankeyLink>()
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .extent([
      [padding, padding],
      [input.width - padding, input.height - padding],
    ]);

  const graph = generator({
    nodes: NODES.map((d) => ({ ...d })),
    links: activeLinks.map((d) => ({ ...d })),
  });

  return {
    nodes: graph.nodes.map((n) => ({
      name: n.name,
      color: n.color,
      x0: n.x0 ?? 0,
      y0: n.y0 ?? 0,
      x1: n.x1 ?? 0,
      y1: n.y1 ?? 0,
      value: n.value ?? 0,
    })),
    links: graph.links.map((l) => {
      const src = l.source as SankeyNode;
      const tgt = l.target as SankeyNode;
      return {
        sourceIndex: NODES.findIndex((n) => n.name === src.name),
        targetIndex: NODES.findIndex((n) => n.name === tgt.name),
        sourceName: src.name,
        targetName: tgt.name,
        sourceColor: src.color,
        targetColor: tgt.color,
        value: l.value,
        width: l.width ?? 0,
        y0: l.y0 ?? 0,
        y1: l.y1 ?? 0,
        sourceX1: src.x1 ?? 0,
        targetX0: tgt.x0 ?? 0,
      };
    }),
  };
}

// ─── Worker message handler ──────────────────────────────────────────

self.onmessage = (e: MessageEvent<SankeyWorkerInput>) => {
  // Origin verification: only accept messages from same origin
  if (e.origin && e.origin !== '' && e.origin !== self.location?.origin) {
    return;
  }
  const result = computeSankeyGraph(e.data);
  const msg: SankeyWorkerOutput = { type: 'result', graph: result };
  self.postMessage(msg);
};
