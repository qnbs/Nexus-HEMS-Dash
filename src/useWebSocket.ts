import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { CommandType } from './types';

export function useWebSocket() {
  const setEnergyData = useAppStore((state) => state.setEnergyData);
  const setConnected = useAppStore((state) => state.setConnected);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ENERGY_UPDATE') {
          setEnergyData(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [setEnergyData, setConnected]);

  const sendCommand = (type: CommandType, value: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, value }));
    }
  };

  return { sendCommand };
}
