"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { loadNaverMap } from "@/lib/naver-map";
import { cn } from "@/lib/utils";

export interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface NaverMapProps {
  locations: MapLocation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  center?: { latitude: number; longitude: number };
  className?: string;
  errorTitle: string;
  errorDescription: string;
}

export function NaverMap({
  locations,
  selectedId,
  onSelect,
  center,
  className,
  errorTitle,
  errorDescription,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const listenersRef = useRef<unknown[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadNaverMap()
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver?.maps) return;
        const maps = window.naver.maps;
        const first = locations[0];
        const initialCenter = new maps.LatLng(
          center?.latitude ?? first?.latitude ?? 37.5665,
          center?.longitude ?? first?.longitude ?? 126.978,
        );
        const map = new maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: 13,
          zoomControl: true,
          zoomControlOptions: { position: maps.Position.TOP_RIGHT },
        });
        mapRef.current = map;

        markersRef.current = locations.map((location) => {
          const active = location.id === selectedId;
          const marker = new maps.Marker({
            map,
            position: new maps.LatLng(location.latitude, location.longitude),
            title: location.name,
            icon: {
              content: `<button type="button" aria-label="${escapeHtml(location.name)}" style="width:${active ? 38 : 32}px;height:${active ? 38 : 32}px;border:3px solid white;border-radius:50%;background:#e01485;color:white;box-shadow:0 2px 8px rgba(0,0,0,.24);cursor:pointer;font:700 12px sans-serif">U+</button>`,
            },
          });
          const listener = maps.Event.addListener(marker, "click", () =>
            onSelect?.(location.id),
          );
          listenersRef.current.push(listener);
          return marker;
        });
        if (center) {
          markersRef.current.push(
            new maps.Marker({
              map,
              position: new maps.LatLng(center.latitude, center.longitude),
              title: "현재 위치",
              icon: {
                content:
                  '<span aria-label="현재 위치" style="display:block;width:18px;height:18px;border:4px solid white;border-radius:50%;background:#3478f6;box-shadow:0 2px 8px rgba(0,0,0,.3)"></span>',
              },
            }),
          );
        }
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
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [center, locations, onSelect, selectedId]);

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
