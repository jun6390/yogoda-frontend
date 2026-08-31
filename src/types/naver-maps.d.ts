export {};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: Record<string, unknown>,
        ) => NaverMap;
        LatLng: new (latitude: number, longitude: number) => NaverLatLng;
        Marker: new (options: Record<string, unknown>) => NaverMarker;
        Event: {
          addListener: (
            target: unknown,
            eventName: string,
            listener: () => void,
          ) => unknown;
          removeListener: (listener: unknown) => void;
        };
        Position: { TOP_RIGHT: unknown };
      };
    };
  }

  interface NaverLatLng {
    lat: () => number;
    lng: () => number;
  }

  interface NaverMap {
    getCenter: () => NaverLatLng;
    setCenter: (center: NaverLatLng) => void;
    setZoom: (zoom: number) => void;
    destroy: () => void;
  }

  interface NaverMarker {
    setMap: (map: NaverMap | null) => void;
  }
}
