import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import http from 'http';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock data generation for the dashboard
  const mockData = {
    gridPower: 0,
    pvPower: 2500,
    batteryPower: -500,
    houseLoad: 2000,
    batterySoC: 65,
    heatPumpPower: 800,
    evPower: 0,
    gridVoltage: 230,
    batteryVoltage: 51.2,
    pvYieldToday: 12.5,
    priceCurrent: 0.15,
  };

  // Update mock data periodically
  setInterval(() => {
    // Add some random noise to the data
    mockData.pvPower = Math.max(0, mockData.pvPower + (Math.random() * 200 - 100));
    mockData.houseLoad = Math.max(300, mockData.houseLoad + (Math.random() * 100 - 50));

    // Simple energy balance: Grid = House + Battery + EV + HeatPump - PV
    mockData.gridPower =
      mockData.houseLoad +
      mockData.batteryPower +
      mockData.evPower +
      mockData.heatPumpPower -
      mockData.pvPower;

    // Broadcast to all connected clients
    const message = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  }, 2000);

  wss.on('connection', (ws) => {
    console.log('Client connected');
    // Send initial data
    ws.send(JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData }));

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'SET_EV_POWER') {
          mockData.evPower = parsed.value;
        } else if (parsed.type === 'SET_HEAT_PUMP_POWER') {
          mockData.heatPumpPower = parsed.value;
        } else if (parsed.type === 'SET_BATTERY_POWER') {
          mockData.batteryPower = parsed.value;
        }
        // Broadcast update immediately
        mockData.gridPower =
          mockData.houseLoad +
          mockData.batteryPower +
          mockData.evPower +
          mockData.heatPumpPower -
          mockData.pvPower;
        const updateMsg = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
        wss.clients.forEach((c) => {
          if (c.readyState === 1) c.send(updateMsg);
        });
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
