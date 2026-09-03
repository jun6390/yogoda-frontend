"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { loadNaverMap } from "@/lib/naver-map";
import { cn } from "@/lib/utils";

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface NaverMapProps {
  locations: MapLocation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onCenterChange?: (center: { latitude: number; longitude: number }) => void;
  center?: { latitude: number; longitude: number };
  currentLocation?: { latitude: number; longitude: number };
  className?: string;
  errorTitle: string;
  errorDescription: string;
}

export function NaverMap({
  locations,
  selectedId,
  onSelect,
  onCenterChange,
  center,
  currentLocation,
  className,
  errorTitle,
  errorDescription,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const currentLocationMarkerRef = useRef<NaverMarker | null>(null);
  const listenersRef = useRef<unknown[]>([]);
  const markerListenersRef = useRef<unknown[]>([]);
  const onSelectRef = useRef(onSelect);
  const onCenterChangeRef = useRef(onCenterChange);
  const initialCenterRef = useRef(center);
  const initialLocationsRef = useRef(locations);
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  useEffect(() => {
    let cancelled = false;

    loadNaverMap()
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver?.maps) return;
        const maps = window.naver.maps;
        const first = initialLocationsRef.current[0];
        const initialCenter = initialCenterRef.current;
        const mapCenter = new maps.LatLng(
          initialCenter?.latitude ?? first?.latitude ?? 37.5665,
          initialCenter?.longitude ?? first?.longitude ?? 126.978,
        );
        const map = new maps.Map(containerRef.current, {
          center: mapCenter,
          zoom: 13,
          zoomControl: true,
          zoomControlOptions: { position: maps.Position.TOP_RIGHT },
        });
        mapRef.current = map;

        const listener = maps.Event.addListener(map, "idle", () => {
          const nextCenter = map.getCenter();
          onCenterChangeRef.current?.({
            latitude: nextCenter.lat(),
            longitude: nextCenter.lng(),
          });
        });
        listenersRef.current.push(listener);
        setMapReady(true);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      const maps = window.naver?.maps;
      if (maps) {
        listenersRef.current.forEach((listener) =>
          maps.Event.removeListener(listener),
        );
      }
      listenersRef.current = [];
      markerListenersRef.current.forEach((listener) =>
        maps?.Event.removeListener(listener),
      );
      markerListenersRef.current = [];
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      currentLocationMarkerRef.current?.setMap(null);
      currentLocationMarkerRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.naver?.maps;
    if (!mapReady || !map || !maps) return;

    markerListenersRef.current.forEach((listener) =>
      maps.Event.removeListener(listener),
    );
    markerListenersRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = locations.map((location) => {
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(location.latitude, location.longitude),
        title: location.name,
        icon: createMarkerIcon(location.name, false),
      });
      markerListenersRef.current.push(
        maps.Event.addListener(marker, "click", () =>
          onSelectRef.current?.(location.id),
        ),
      );
      return marker;
    });

    return () => {
      markerListenersRef.current.forEach((listener) =>
        maps.Event.removeListener(listener),
      );
      markerListenersRef.current = [];
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [locations, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    markersRef.current.forEach((marker, index) => {
      const location = locations[index];
      if (!location) return;
      marker.setIcon(
        createMarkerIcon(location.name, location.id === selectedId),
      );
    });
  }, [locations, mapReady, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.naver?.maps;
    if (!mapReady || !map || !maps || !center) return;

    const nextCenter = new maps.LatLng(center.latitude, center.longitude);
    map.setCenter(nextCenter);
  }, [center, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.naver?.maps;
    if (!mapReady || !map || !maps) return;

    currentLocationMarkerRef.current?.setMap(null);
    currentLocationMarkerRef.current = null;
    if (!currentLocation) return;

    currentLocationMarkerRef.current = new maps.Marker({
      map,
      position: new maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude,
      ),
      title: "현재 위치",
      icon: {
        content:
          '<span aria-label="현재 위치" style="display:block;width:18px;height:18px;border:4px solid white;border-radius:50%;background:#3478f6;box-shadow:0 2px 8px rgba(0,0,0,.3)"></span>',
      },
    });
  }, [currentLocation, mapReady]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] flex-col items-center justify-center bg-surface-subtle px-xl text-center",
          className,
        )}
      >
        <MapPin className="text-icon-secondary" size={32} />
        <strong className="mt-md font-sans text-label-14-bold text-text-primary">
          {errorTitle}
        </strong>
        <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
          {errorDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("min-h-[360px] w-full bg-surface-subtle", className)}
    />
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function createMarkerIcon(name: string, active: boolean) {
  const size = active ? 38 : 32;
  return {
    content: `<button type="button" aria-label="${escapeHtml(name)}" style="width:${size}px;height:${size}px;border:3px solid white;border-radius:50%;background:#e01485;color:white;box-shadow:0 2px 8px rgba(0,0,0,.24);cursor:pointer;font:700 12px sans-serif">U+</button>`,
  };
}
