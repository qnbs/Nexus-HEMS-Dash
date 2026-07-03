/**
 * OCPP 2.1 WebSocket relay — API holds mTLS client credentials to the CSMS.
 */

import https from 'node:https';
import { type RawData, WebSocket } from 'ws';
import type { OcppProxySessionData } from './ocpp-session-store.js';

function relayBidirectional(upstream: WebSocket, client: WebSocket): void {
  const onUpstreamMessage = (data: RawData) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  };
  const onClientMessage = (data: RawData) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(data);
  };

  upstream.on('message', onUpstreamMessage);
  client.on('message', onClientMessage);

  const cleanup = () => {
    upstream.off('message', onUpstreamMessage);
    client.off('message', onClientMessage);
  };

  upstream.on('close', cleanup);
  client.on('close', () => {
    cleanup();
    if (upstream.readyState === WebSocket.OPEN) upstream.close();
  });
  upstream.on('error', () => {
    if (client.readyState === WebSocket.OPEN) client.close(1011, 'Upstream OCPP relay error');
  });
  client.on('error', () => {
    if (upstream.readyState === WebSocket.OPEN) upstream.close();
  });
}

/**
 * Open an mTLS WebSocket to the CSMS and relay frames to the browser client.
 */
export function attachOcppProxyRelay(
  session: OcppProxySessionData,
  clientWs: WebSocket,
): Promise<'ok' | 'failed'> {
  return new Promise((resolve) => {
    const tlsAgent = new https.Agent({
      cert: session.clientCert,
      key: session.clientKey,
      ...(session.caCert ? { ca: session.caCert } : {}),
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    });

    const path = `/ocpp/${encodeURIComponent(session.stationId)}`;
    const url = `wss://${session.host}:${session.port}${path}`;

    let upstream: WebSocket;
    try {
      upstream = new WebSocket(url, ['ocpp2.1'], {
        agent: tlsAgent,
      } as ConstructorParameters<typeof WebSocket>[2]);
    } catch {
      resolve('failed');
      return;
    }

    const fail = () => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1011, 'OCPP mTLS upstream connection failed');
      }
      resolve('failed');
    };

    upstream.on('open', () => {
      relayBidirectional(upstream, clientWs);
      resolve('ok');
    });
    upstream.on('error', fail);
    upstream.on('close', () => {
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    });
  });
}
