import React, { useMemo } from 'react';
import { WebView } from 'react-native-webview';

interface Props {
  videoId: string;
  onEnded: () => void;
  onError: () => void;
}

/** YouTube's official embedded player (native). Ads and controls are YouTube's own. */
export function YouTubeView({ videoId, onEnded, onError }: Props) {
  const html = useMemo(
    () => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body,#p{margin:0;height:100%;width:100%;background:#000}</style></head><body><div id="p"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
function send(m){ if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m); }
function onYouTubeIframeAPIReady(){
  new YT.Player('p', { width:'100%', height:'100%', videoId:${JSON.stringify(videoId)},
    playerVars:{ playsinline:1, autoplay:1, rel:0 },
    events:{ onStateChange:function(e){ if (e.data === 0) send('ended'); }, onError:function(){ send('error'); } } });
}
</script></body></html>`,
    [videoId]
  );
  return (
    <WebView
      // The player refuses to run without a real web origin behind it.
      source={{ html, baseUrl: 'https://somney.github.io/spotty/' }}
      style={{ flex: 1, backgroundColor: '#000' }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      onMessage={(e) => (e.nativeEvent.data === 'ended' ? onEnded() : e.nativeEvent.data === 'error' ? onError() : undefined)}
    />
  );
}
