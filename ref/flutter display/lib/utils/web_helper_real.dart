// Real implementation for Web platform.
// Migrated from dart:html (deprecated) to package:web + dart:ui_web.
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;

void registerWebVideoViewFactory(String viewId, String videoUrl) {
  ui_web.platformViewRegistry.registerViewFactory(viewId, (int id) {
    final video = web.document.createElement('video') as web.HTMLVideoElement;
    video.src = videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.style.border = 'none';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    return video;
  });
}

void registerWebIframeViewFactory(String viewId, String iframeUrl) {
  ui_web.platformViewRegistry.registerViewFactory(viewId, (int id) {
    final iframe = web.document.createElement('iframe') as web.HTMLIFrameElement;
    iframe.src = iframeUrl;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    return iframe;
  });
}
