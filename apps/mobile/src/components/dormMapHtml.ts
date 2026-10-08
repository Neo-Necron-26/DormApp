import { DormWithDistance, HOME_DORM_ID } from "@sfu/shared";

/**
 * Yandex Maps JS API v2.1 — no commercial API key needed for dev, genuinely pannable/
 * zoomable. Shared between the native WebView (`DormMapView.tsx`) and the web
 * iframe (`DormMapView.web.tsx`), since `react-native-webview` has no web
 * target of its own.
 */
export function buildMapHtml(dorms: DormWithDistance[], selectedDormId: number | null): string {
  const points = dorms.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    name: d.nameRu,
    home: d.id === HOME_DORM_ID,
  }));
  const centerLat = dorms.reduce((s, d) => s + d.lat, 0) / dorms.length;
  const centerLng = dorms.reduce((s, d) => s + d.lng, 0) / dorms.length;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=29294198-6cdc-4996-a870-01e89b830f3e" type="text/javascript"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #e5e3df; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var dorms = ${JSON.stringify(points)};
    var selectedId = ${JSON.stringify(selectedDormId)};

    ymaps.ready(init);
    var map;
    var markers = {};

    function init() {
      map = new ymaps.Map("map", {
        center: [${centerLat}, ${centerLng}],
        zoom: 14,
        controls: ['zoomControl']
      });

      dorms.forEach(function (d) {
        var isSelected = d.id === selectedId;
        var color = d.home ? '#121212' : (isSelected ? '#FF6B00' : '#DC2626');

        var placemark = new ymaps.Placemark([d.lat, d.lng], {
          iconContent: '№' + d.id
        }, {
          preset: 'islands#circleIcon',
          iconColor: color
        });

        placemark.events.add('click', function () {
          var payload = JSON.stringify({ type: 'select', dormId: d.id });
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
          else if (window.parent) window.parent.postMessage(payload, '*');
        });

        map.geoObjects.add(placemark);
        markers[d.id] = placemark;
      });
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);
    function handleMessage(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'flyTo' && markers[msg.dormId]) {
          map.panTo(markers[msg.dormId].geometry.getCoordinates(), { duration: 600 });
        } else if (msg.type === 'fitAll') {
          map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true });
        }
      } catch (err) {}
    }
  </script>
</body>
</html>`;
}
