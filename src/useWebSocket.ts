import { useEffect, useRef } from 'react';

import { useAppStore } from './store';
import { CommandType } from './types';
import { persistSnapshot } from './lib/db';

const INITIAL_RETRY_DELAY = 1500;

export function useWebSocket() {
  const setEnergyData = useAppStore((state) => state.setEnergyData);
  const setConnected = useAppStore((state) => state.setConnected);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);

  useEffect(() => {
    let isUnmounted = false;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        retryDelayRef.current = INITIAL_RETRY_DELAY;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ENERGY_UPDATE') {
            setEnergyData(message.data);
            void persistSnapshot(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message', error);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (isUnmounted) {
          return;
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 1.6, 10_000);
          connect();
        }, retryDelayRef.current);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [setEnergyData, setConnected]);

  const sendCommand = (type: CommandType, value: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, value }));
    }
  };

  return { sendCommand };
}
