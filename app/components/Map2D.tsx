"use client";
import MapGL from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
// @ts-ignore
import DeckGL from "@deck.gl/react";

export default function Map2D({
  lang, // <--- 加上这个
  viewState,
  onViewStateChange,
  layers,
  deckRef,
  mapRef,
  onMapLoad,
  webglDefer,
  setSelectedTrajectory,
}: any) {
  if (!webglDefer) return null;

  return (
    <DeckGL
      ref={deckRef}
      viewState={viewState}
      controller={true}
      layers={layers}
      onClick={(info: any) => {
        if (!info.object) {
          setSelectedTrajectory(null);
        }
      }}
      onViewStateChange={onViewStateChange}
      getCursor={({ isDragging }: any) => (isDragging ? "grabbing" : "grab")}
      {...({ glOptions: { preserveDrawingBuffer: true } } as any)}
      getTooltip={({ object, layer }: any) => {
        if (!object) return null;

        if (layer?.id === "countries-layer" && object.properties) {
          let countryName = object.properties.ADMIN;

          if (lang === "zh" && object.properties.ISO_A2 && object.properties.ISO_A2 !== "-99") {
            try {
              const zhName = new Intl.DisplayNames(["zh"], { type: "region" }).of(object.properties.ISO_A2);
              if (zhName) countryName = zhName;
            } catch (e) {
              // 翻译失败降级为原名
            }
          }
          return {
            html: `<div style="background: rgba(0,0,0,0.8); border: 1px solid rgba(255,215,0,0.3); padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; font-weight: bold; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">${countryName}</div>`,
            style: { backgroundColor: "transparent", boxShadow: "none", padding: "0px" },
          };
        }

        if (layer?.id === "stars-layer" && object.name) {
          return {
            html: `<div style="background: rgba(0,0,0,0.85); border: 1px solid rgba(255,215,0,0.5); padding: 6px 12px; border-radius: 6px; color: #FFD700; font-size: 12px; font-weight: 900; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(0,0,0,0.8);">${object.name}</div>`,
            style: { backgroundColor: "transparent", boxShadow: "none", padding: "0px" },
          };
        }
        return null;
      }}
    >
      <MapGL
        ref={mapRef}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        {...({ preserveDrawingBuffer: true } as any)}
        onLoad={() => {
          setTimeout(() => {
            if (onMapLoad) onMapLoad();
          }, 1500);
        }}
      />
    </DeckGL>
  );
}
