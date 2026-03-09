"use client";

import dynamic from "next/dynamic";
import { Inter, Permanent_Marker } from "next/font/google";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation"; // 捕获动态路由参数

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"] });
const markerFont = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const TRANSPORT_CONFIG: Record<string, any> = {
  flight: { color: ['#ffffff30', '#00d2ff'], alt: 0.35, time: 2500, dash: 0.5, gap: 0.2, stroke: 0.25 },
  train: { color: ['#ffffff30', '#39ff14'], alt: 0.05, time: 4000, dash: 0.2, gap: 0.1, stroke: 0.15 },
  drive: { color: ['#ffffff30', '#ff8c00'], alt: 0.015, time: 5000, dash: 0.1, gap: 0.05, stroke: 0.1 },
  cruise: { color: ['#ffffff30', '#000080'], alt: 0.005, time: 8000, dash: 0.05, gap: 0.02, stroke: 0.1 },
  walk: { color: ['#ffffff30', '#a9a9a9'], alt: 0.002, time: 10000, dash: 0.02, gap: 0.01, stroke: 0.05 }
};

export default function PublicSharePage() {
  const params = useParams();
  const uid = params.uid as string;
  const globeRef = useRef<any>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [trajectories, setTrajectories] = useState<any[]>([]);
  const [selectedTrajectory, setSelectedTrajectory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const altitudeRef = useRef<number>(typeof window !== "undefined" && window.innerWidth < 768 ? 2.2 : 0.6);

  useEffect(() => {
    setIsMounted(true);
    // 从公开接口拉取该特定用户的行程
    supabase.from("trajectories").select("*").eq('user_id', uid).then(({ data, error }) => {
      if (data) setTrajectories(data);
      setIsLoading(false);
    });

    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => setCountriesData(data.features ?? []));
  }, [uid]);

  useEffect(() => {
    if (globeRef.current && trajectories && trajectories.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      trajectories.forEach((t: any) => {
        minLat = Math.min(minLat, t.start_lat, t.end_lat);
        maxLat = Math.max(maxLat, t.start_lat, t.end_lat);
        minLng = Math.min(minLng, t.start_lng, t.end_lng);
        maxLng = Math.max(maxLng, t.start_lng, t.end_lng);
      });

      const midLat = (maxLat + minLat) / 2;
      const midLng = (maxLng + minLng) / 2;
      const maxSpan = Math.max(maxLat - minLat, maxLng - minLng);
      const targetAltitude = Math.max(1.8, Math.min(2.6, 1.2 + maxSpan * 0.012));

      const t = setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.pointOfView({ lat: midLat, lng: midLng + 90, altitude: 5.0 }, 0);
          setTimeout(() => {
            if (globeRef.current) {
              altitudeRef.current = targetAltitude;
              globeRef.current.pointOfView({ lat: midLat, lng: midLng, altitude: targetAltitude }, 3000);
            }
          }, 50);
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [trajectories]);

  const handleGlobeZoom = (direction: "in" | "out") => {
    if (!globeRef.current) return;
    const factor = direction === "in" ? 0.7 : 1.3;
    const next = Math.max(0.25, Math.min(3.5, altitudeRef.current * factor));
    altitudeRef.current = next;
    globeRef.current.pointOfView({ altitude: next }, 400);
  };

  const uniquePlaces = useMemo(() => {
    const placesMap = new Map();
    trajectories.forEach(tr => {
      placesMap.set(tr.start_name, { name: tr.start_name, lat: tr.start_lat, lng: tr.start_lng });
      placesMap.set(tr.end_name, { name: tr.end_name, lat: tr.end_lat, lng: tr.end_lng });
    });
    return Array.from(placesMap.values());
  }, [trajectories]);

  if (!isMounted) return <div className="min-h-screen bg-[#020202]" />;

  return (
    <main className={`relative h-screen w-screen overflow-hidden bg-[#020202] text-white selection:bg-yellow-500/20 ${inter.className}`}>
      
      {/* 沉浸式公开分享地球 */}
      <div className="absolute inset-0 cursor-grab active:cursor-grabbing pb-0">
        {/* @ts-ignore */}
        <Globe
          ref={globeRef}
          animateIn={false}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          rendererConfig={{ preserveDrawingBuffer: true, antialias: true }}
          polygonsData={countriesData}
          polygonCapColor={() => "rgba(0,0,0,0)"}
          polygonSideColor={() => "rgba(0,0,0,0)"}
          polygonStrokeColor={() => "rgba(255,255,255,0.05)"}
          polygonLabel={({ properties: d }: any) => `
  <div style="background: rgba(0,0,0,0.8); border: 1px solid rgba(255,215,0,0.3); padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; font-weight: bold; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
    ${d?.ADMIN ?? ""}
  </div>
`}
          onGlobeClick={({ lat, lng }: any) => {
            if (globeRef.current) {
              const zoomAlt = window.innerWidth < 768 ? 1.0 : 0.8;
              altitudeRef.current = zoomAlt;
              globeRef.current.pointOfView({ lat, lng, altitude: zoomAlt }, 1500);
            }
            setSelectedTrajectory(null);
          }}
          
          htmlElementsData={uniquePlaces}
          htmlElement={(d: any) => {
            const el = document.createElement('div');
            el.style.position = 'relative'; el.style.width = '0px'; el.style.height = '0px'; el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer';
            el.innerHTML = `
              <div style="position: absolute; left: -12px; bottom: 0px; width: 24px; height: 24px;">
                <svg viewBox="0 0 24 24" fill="#FFD700" style="width: 100%; height: 100%; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.8));"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: sans-serif; background: rgba(0,0,0,0.6); color: white; font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 4px; text-shadow: 0 1px 2px black;">${d.name}</div>
            `;
            el.onpointerdown = (e) => e.stopPropagation();
            el.onclick = () => {
              if (globeRef.current) {
                const zoomAlt = window.innerWidth < 768 ? 0.8 : 0.6;
                altitudeRef.current = zoomAlt;
                globeRef.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: zoomAlt }, 1500);
              }
              const related = trajectories.find((t: any) => t.start_name === d.name || t.end_name === d.name);
              if(related) setSelectedTrajectory(related);
            };
            return el;
          }}
          
          arcsData={trajectories}
          arcStartLat={(d: any) => d.start_lat}
          arcStartLng={(d: any) => d.start_lng}
          arcEndLat={(d: any) => d.end_lat}
          arcEndLng={(d: any) => d.end_lng}
          arcColor={(d: any) => TRANSPORT_CONFIG[d.transport_mode || "flight"].color}
          // 【修复核心】：动态计算高度，防止短距离航线飞出大气层
          arcAltitude={() => 0.015}
          arcStroke={1.5}
          // 【动画升级】：将死板的实线变成流动的科幻射线
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashInitialGap={() => Math.random()}
          arcDashAnimateTime={2000}
          backgroundColor="rgba(0,0,0,0)"
          
          onArcClick={(tr: any) => setSelectedTrajectory(tr)}
        />
      </div>

      {/* 右侧缩放控制：与主页一致 */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        <button type="button" onClick={() => handleGlobeZoom("in")} className="w-10 h-10 bg-white/5 hover:bg-white/20 backdrop-blur-xl rounded-full text-white font-light text-xl border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all">
          ＋
        </button>
        <button type="button" onClick={() => handleGlobeZoom("out")} className="w-10 h-10 bg-white/5 hover:bg-white/20 backdrop-blur-xl rounded-full text-white font-light text-xl border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all">
          －
        </button>
      </div>

      {/* 顶部弱化的引流 Logo：让访客知道这是用什么工具做的 */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Created on</p>
        <h1 className={`text-3xl tracking-wide text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] leading-tight whitespace-pre-line pointer-events-auto ${markerFont.className}`}>{"MY TRAVEL\nGLOBE"}</h1>
      </div>

      {/* 右上角：行程列表，透明暗黑金边 */}
      {trajectories.length > 0 && (
        <div className="absolute top-6 right-6 z-20 w-[220px] max-h-[45vh] overflow-y-auto rounded-xl bg-black/40 backdrop-blur-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <p className="sticky top-0 py-2.5 px-3 text-[10px] font-bold tracking-widest text-yellow-500/90 uppercase border-b border-white/10 bg-black/50 backdrop-blur-sm rounded-t-xl">
            ROUTES
          </p>
          <ul className="py-2">
            {trajectories.map((tr: any) => (
              <li
                key={tr.id ?? `${tr.start_name}-${tr.end_name}`}
                onClick={() => {
                  const midLat = (tr.start_lat + tr.end_lat) / 2;
                  const midLng = (tr.start_lng + tr.end_lng) / 2;
                  altitudeRef.current = 1.2;
                  if (globeRef.current) {
                    globeRef.current.pointOfView({ lat: midLat, lng: midLng, altitude: 1.2 }, 1200);
                  }
                  setSelectedTrajectory(tr);
                }}
                className="py-2.5 px-3 mx-2 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-yellow-500/25 cursor-pointer transition-all group"
              >
                <p className="text-xs font-bold text-white/95 group-hover:text-yellow-400/95 truncate tracking-wide">
                  {tr.start_name} → {tr.end_name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 右下角的建立自己的地球引流按钮 (Call to Action) */}
      <a href="/" className="absolute bottom-10 right-6 z-20 bg-yellow-500/90 backdrop-blur-md hover:bg-yellow-400 text-black px-6 py-4 rounded-full font-black tracking-widest text-xs shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all">
        CREATE YOUR OWN
      </a>

      {/* 只读详情抽屉 / Bottom Sheet */}
      <motion.div className={`fixed bottom-0 md:top-0 md:bottom-auto right-0 h-[70vh] md:h-full w-full md:w-[450px] bg-[#050505]/95 backdrop-blur-3xl border-t md:border-l md:border-t-0 border-white/10 p-6 md:p-10 text-white z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-t-[2rem] md:rounded-none ${selectedTrajectory ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}>
        {selectedTrajectory && (
          <div className="h-full flex flex-col relative overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <button className="absolute -top-2 md:-top-2 -right-2 md:-right-2 text-gray-500 hover:text-white text-xl z-50 bg-[#050505] rounded-full p-2" onClick={() => setSelectedTrajectory(null)}>✕</button>
            <div className="flex items-center gap-3 mb-4 mt-2 md:mt-4">
              <span className="text-xl">{selectedTrajectory.transport_mode === 'flight' ? '✈️' : selectedTrajectory.transport_mode === 'train' ? '🚄' : selectedTrajectory.transport_mode === 'drive' ? '🚗' : selectedTrajectory.transport_mode === 'cruise' ? '🚢' : '🚶'}</span>
              <p className="text-xs font-mono text-yellow-500/70 tracking-widest">TRAVEL NOTES</p>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 tracking-wider text-white uppercase leading-tight">
              {selectedTrajectory.start_name} <br/><span className="text-gray-600 text-xl md:text-2xl">→</span> {selectedTrajectory.end_name}
            </h2>
            
            {selectedTrajectory.image_urls && selectedTrajectory.image_urls.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {selectedTrajectory.image_urls.map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Memory" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-6 flex-1">
              <div className="bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-500 font-mono tracking-widest mb-1">DATES</p>
                <p className="text-sm text-gray-200 mb-6 font-mono">{selectedTrajectory.start_date} to {selectedTrajectory.end_date}</p>
                <p className="text-xs text-gray-500 font-mono tracking-widest mb-2">MEMORIES & TIPS</p>
                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{selectedTrajectory.notes}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

    </main>
  );
}