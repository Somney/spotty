import React, { useEffect, useRef } from 'react';

interface Props {
  videoId: string;
  onEnded: () => void;
  onError: () => void;
}

/** YouTube's official embedded player (web). Ads and controls are YouTube's own. */
export function YouTubeView({ videoId, onEnded, onError }: Props) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const handlers = useRef({ onEnded, onError });
  handlers.current = { onEnded, onError };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);
        const state = msg.event === 'onStateChange' ? msg.info : msg.event === 'infoDelivery' ? msg.info?.playerState : undefined;
        if (state === 0) handlers.current.onEnded();
        if (msg.event === 'onError') handlers.current.onError();
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  return React.createElement('iframe', {
    key: videoId,
    ref: frame,
    src,
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowFullScreen: true,
    style: { border: 0, width: '100%', height: '100%', background: '#000' },
    // Asking the player to "listen" makes it post its state changes back to this page.
    onLoad: () => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), 'https://www.youtube.com'),
  });
}
