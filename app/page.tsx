"use client";

import { Inter, Permanent_Marker } from "next/font/google";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

import Map2D from "./components/Map2D";
// 【终极修复】：引入纯正的 WebGL 图层，彻底抛弃会穿模的 HTML 标签
// @ts-ignore
import { ArcLayer, GeoJsonLayer, IconLayer } from "@deck.gl/layers";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"] });
const markerFont = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TRANSPORT_CONFIG: Record<string, any> = {
  flight: { color: [0, 210, 255], alt: 0.5 },
  // 【优化】：告别廉价荧光绿，换成了高级感十足的翠绿色
  train: { color: [16, 185, 129], alt: 0.1 }, 
  drive: { color: [255, 140, 0], alt: 0.05 },
  cruise: { color: [0, 0, 128], alt: 0.02 },
  walk: { color: [169, 169, 169], alt: 0.01 }
};

const DEFAULT_TRAJECTORIES = [
  { id: "demo-1", start_name: "TOKYO", start_lat: 35.6762, start_lng: 139.6503, end_name: "KYOTO", end_lat: 35.0116, end_lng: 135.7681, start_date: "2026-03-20", end_date: "2026-03-25", transport_mode: "train", notes: "新干线直达！在京都宇治打卡了最浓郁的抹茶排队神店，清水寺的黄昏光影简直绝了，原片直出零修图。", image_urls: ["https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop"] },
  { id: "demo-2", start_name: "NEW YORK", start_lat: 40.7128, start_lng: -74.0060, end_name: "LOS ANGELES", end_lat: 34.0522, end_lng: -118.2437, start_date: "2026-04-10", end_date: "2026-04-18", transport_mode: "flight", notes: "跨越东西海岸的追光之旅。从曼哈顿的钢筋水泥飞到加州的落日橘子海，圣莫尼卡海滩的晚风治愈一切。", image_urls: ["https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800&auto=format&fit=crop"] }
];

const DICT: any = {
  zh: {
    loading: "正在同步地球数据...", brand: "MY TRAVEL\nGLOBE",
    btn_login: "登录账号", btn_logout: "退出登录", btn_add: "记录旅程", btn_share: "生成分享链接",
    drawer_notes: "旅行日记", drawer_date: "行程日期", drawer_memos: "回忆与提示", drawer_edit: "编辑记录", 
    btn_export: "导出地图", modal_upload_count: "已选照片: ", modal_export_loading: "正在截取高清地图...",
    modal_title: "绘制新轨迹",
    modal_start: "出发地", modal_start_ph: "输入地点以联想搜索...", modal_end: "目的地", modal_end_ph: "输入地点以联想搜索...",
    modal_date_start: "出发日期", modal_date_end: "到达日期",
    modal_trans: "交通方式", trans_flight: "✈️ 飞机", trans_train: "🚄 火车/地铁", trans_drive: "🚗 自驾", trans_cruise: "🚢 游轮", trans_walk: "🚶 步行/骑行",
    modal_photos: "相册", modal_upload: "📷 点击上传原片 (JPG/PNG)",
    modal_notes: "攻略与避雷", modal_notes_ph: "写点什么... 比如：避雷指南或者扫街路线...",
    modal_cancel: "取消", modal_save: "生成云端轨迹", modal_locating: "正在保存...",
    alert_not_found: "请从下拉列表中准确选择地点！",
    auth_title_login: "账号登录", auth_title_signup: "注册账号", auth_title_reset: "重置密码",
    auth_email: "邮箱", auth_pwd: "密码 (至少6位)", auth_agree: "我已阅读并同意", 
    auth_action_login: "立即登录", auth_action_signup: "同意协议并注册", auth_action_reset: "发送重置邮件",
    auth_switch_signup: "没有账号？点击注册", auth_switch_login: "已有账号？直接登录", auth_switch_reset: "忘记密码？",
    auth_err_email: "请输入有效的邮箱地址！", auth_err_email_fmt: "邮箱格式不正确！", auth_err_pwd: "请输入密码！", auth_err_pwd_len: "安全要求：密码至少需要 6 位字符！", auth_err_agree: "请先勾选同意底部的协议与政策！",
    auth_supa_invalid: "❌ 账号或密码错误，请检查后重试！", auth_supa_exists: "❌ 该邮箱已被注册，请直接登录！", auth_supa_too_many: "❌ 请求太频繁，请稍后再试！", auth_supa_unconfirmed: "❌ 邮箱未验证，请前往邮箱点击验证链接！",
    auth_verify_msg: "✅ 注册成功！请前往邮箱点击验证链接以激活账号。", auth_reset_msg: "✉️ 重置密码链接已发送到您的邮箱，请查收！",
    btn_delete: "删除记录", modal_update: "更新轨迹",
    modal_export_title: "选择要在地图上展示并导出的轨迹", btn_confirm_export: "生成并下载图片",
    share_success: "🔗 专属地图链接已复制到剪贴板"
  },
  en: {
    loading: "SYNCING GLOBE DATA...", brand: "MY TRAVEL\nGLOBE",
    btn_login: "LOGIN", btn_logout: "LOGOUT", btn_add: "NEW JOURNEY", btn_share: "SHARE LINK",
    drawer_notes: "TRAVEL NOTES", drawer_date: "DATES", drawer_memos: "MEMORIES & TIPS", drawer_edit: "EDIT RECORD", 
    btn_export: "EXPORT MAP", modal_upload_count: "Selected: ", modal_export_loading: "Capturing Image...",
    modal_title: "NEW TRAJECTORY",
    modal_start: "FROM", modal_start_ph: "Type to search...", modal_end: "TO", modal_end_ph: "Type to search...",
    modal_date_start: "DEPARTURE", modal_date_end: "ARRIVAL",
    modal_trans: "TRANSPORT", trans_flight: "✈️ Flight", trans_train: "🚄 Train", trans_drive: "🚗 Drive", trans_cruise: "🚢 Cruise", trans_walk: "🚶 Walk/Bike",
    modal_photos: "PHOTOS", modal_upload: "📷 Upload Raw Images (JPG/PNG)",
    modal_notes: "NOTES & TIPS", modal_notes_ph: "Write something... e.g. food to avoid...",
    modal_cancel: "CANCEL", modal_save: "GENERATE ARC", modal_locating: "SAVING...",
    alert_not_found: "Please select accurate locations from dropdown!",
    auth_title_login: "LOGIN", auth_title_signup: "SIGN UP", auth_title_reset: "RESET PASSWORD",
    auth_email: "EMAIL", auth_pwd: "PASSWORD (Min 6 chars)", auth_agree: "I agree to the ", 
    auth_action_login: "LOGIN NOW", auth_action_signup: "SIGN UP", auth_action_reset: "SEND RESET LINK",
    auth_switch_signup: "Don't have an account? Sign up", auth_switch_login: "Already have an account? Log in", auth_switch_reset: "Forgot password?",
    auth_err_email: "Please enter your email!", auth_err_email_fmt: "Invalid email format!", auth_err_pwd: "Please enter your password!", auth_err_pwd_len: "Password must be at least 6 characters!", auth_err_agree: "You must agree to the Terms!",
    auth_supa_invalid: "❌ Invalid login credentials!", auth_supa_exists: "❌ User already registered, please log in!", auth_supa_too_many: "❌ Too many requests, please try again later!", auth_supa_unconfirmed: "❌ Email not confirmed. Please check your inbox!",
    auth_verify_msg: "✅ Success! Please check your email to verify your account.", auth_reset_msg: "✉️ Reset password link sent to your email!",
    btn_delete: "DELETE RECORD", modal_update: "UPDATE ARC",
    modal_export_title: "Select Trajectories to Export", btn_confirm_export: "GENERATE & DOWNLOAD",
    share_success: "🔗 Your exclusive map link copied to clipboard"
  }
};

function LoadingCurtain({ text }: { text: string }) {
  return (
    <motion.div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center" initial={{ y: 0 }} exit={{ y: "-100%", transition: { type: "spring", stiffness: 120, damping: 28, mass: 0.8 } }}>
      <motion.p className={`text-sm text-white/70 font-medium tracking-[0.35em] uppercase ${inter.className}`} animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>{text}</motion.p>
    </motion.div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = DICT[lang];
  const deckRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const MIN_ZOOM = typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 2.5;
  const MAX_PITCH = 60;

  const [viewState, setViewState] = useState({
    longitude: 114.2, latitude: 22.4, zoom: 3, pitch: 45, bearing: 0, transitionDuration: 0,
    minZoom: MIN_ZOOM, maxZoom: 20, maxPitch: MAX_PITCH
  });

  const [isMounted, setIsMounted] = useState(false);
  const [webglDefer, setWebglDefer] = useState(false);
  const [showMainUI, setShowMainUI] = useState(false);
  const [selectedTrajectory, setSelectedTrajectory] = useState<any>(null);
  
  const [user, setUser] = useState<any>(null); 
  const [authModalOpen, setAuthModalOpen] = useState(false); 
  const [modalOpen, setModalOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(""); 
  const [mapError, setMapError] = useState("");
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authAgreed, setAuthAgreed] = useState(false); 
  
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [shareToast, setShareToast] = useState("");

  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);
  const [selectedStartCoords, setSelectedStartCoords] = useState<any>(null);
  const [selectedEndCoords, setSelectedEndCoords] = useState<any>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transportMode, setTransportMode] = useState("flight");
  const [newNotes, setNewNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);

  const [myTrajectories, setMyTrajectories] = useState<any[]>(DEFAULT_TRAJECTORIES);
  const [countriesData, setCountriesData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountriesData(data.features));

    const fallbackTimer = setTimeout(() => setShowMainUI(true), 3000);

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setWebglDefer(true);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      setMyTrajectories([]); 
      supabase.from("trajectories").select("*").then(({ data, error }) => {
        if (error) setMyTrajectories([]);
        else if (data) setMyTrajectories(data.length > 0 ? data : []);
      });
    } else {
      setMyTrajectories(DEFAULT_TRAJECTORIES);
    }
  }, [user]);

  const visibleTrajectories = isGeneratingScreenshot ? myTrajectories.filter(t => selectedExportIds.includes(t.id)) : myTrajectories;

  const uniquePlaces = useMemo(() => {
    const placesMap = new Map();
    visibleTrajectories.forEach(tr => {
      if (!tr) return; 
      placesMap.set(tr.start_name, { name: tr.start_name, lat: tr.start_lat, lng: tr.start_lng });
      placesMap.set(tr.end_name, { name: tr.end_name, lat: tr.end_lat, lng: tr.end_lng });
    });
    return Array.from(placesMap.values());
  }, [visibleTrajectories]);

  const layers = [
    // @ts-ignore
    new GeoJsonLayer({
      id: 'countries-layer',
      data: countriesData,
      stroked: false,
      filled: true,
      getFillColor: [0, 0, 0, 0], 
      pickable: true
    }),
    // @ts-ignore
    new ArcLayer({
      id: 'arcs-layer',
      data: visibleTrajectories,
      getSourcePosition: (d: any) => [d.start_lng, d.start_lat],
      getTargetPosition: (d: any) => [d.end_lng, d.end_lat],
      getSourceColor: (d: any) => TRANSPORT_CONFIG[d.transport_mode || 'flight'].color,
      getTargetColor: (d: any) => TRANSPORT_CONFIG[d.transport_mode || 'flight'].color,
      getWidth: 2.5, 
      getHeight: (d: any) => TRANSPORT_CONFIG[d.transport_mode || 'flight'].alt,
      pickable: true,
      autoHighlight: true, 
      highlightColor: [255, 255, 255, 150],
      onClick: ({object}: any) => {
        if (object) {
          const midLat = (object.start_lat + object.end_lat) / 2;
          const midLng = (object.start_lng + object.end_lng) / 2;
          const latDiff = Math.abs(object.start_lat - object.end_lat);
          const lngDiff = Math.abs(object.start_lng - object.end_lng);
          const maxDiff = Math.max(latDiff, lngDiff);
          let targetZoom = maxDiff > 20 ? 3 : maxDiff > 10 ? 4 : maxDiff > 5 ? 5 : maxDiff > 2 ? 6 : 8;
          setViewState((prev: any) => ({
            ...prev, longitude: midLng, latitude: midLat, zoom: targetZoom, pitch: 0, bearing: 0, transitionDuration: 1500
          }));
          setSelectedTrajectory(object);
        }
      }
    }),
    // 【终极修复】：原生 WebGL IconLayer。这次补齐了 SVG 必备的 width="24" height="24"，保证星星 100% 出现！
    // @ts-ignore
    new IconLayer({
      id: 'stars-layer',
      data: uniquePlaces,
      getPosition: (d: any) => [d.lng, d.lat],
      getIcon: () => ({
        url: 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23FFD700%22%20stroke%3D%22%23111111%22%20stroke-width%3D%222%22%20d%3D%22M12%202l3.09%206.26L22%209.27l-5%204.87%201.18%206.88L12%2017.77l-6.18%203.25L7%2014.14%202%209.27l6.91-1.01L12%202z%22%2F%3E%3C%2Fsvg%3E',
        width: 24,
        height: 24,
        anchorY: 12
      }),
      getSize: 28, // 精致饱满的尺寸
      pickable: true,
      parameters: { depthTest: false }, // 物理级置顶，绝不被绿线遮挡穿模！
      onClick: ({object}: any) => {
        if(object) {
          const related = myTrajectories.find((t: any) => t.start_name === object.name || t.end_name === object.name);
          if (related) {
            setSelectedTrajectory(related);
            const midLat = (related.start_lat + related.end_lat) / 2;
            const midLng = (related.start_lng + related.end_lng) / 2;
            const latDiff = Math.abs(related.start_lat - related.end_lat);
            const lngDiff = Math.abs(related.start_lng - related.end_lng);
            const maxDiff = Math.max(latDiff, lngDiff);
            let targetZoom = maxDiff > 20 ? 3 : maxDiff > 10 ? 4 : maxDiff > 5 ? 5 : maxDiff > 2 ? 6 : 8;
            setViewState((prev: any) => ({ ...prev, longitude: midLng, latitude: midLat, zoom: targetZoom, pitch: 0, bearing: 0, transitionDuration: 1500 }));
          } else {
            setViewState((prev: any) => ({ ...prev, longitude: object.lng, latitude: object.lat, zoom: 11, pitch: 0, bearing: 0, transitionDuration: 1500 }));
          }
        }
      }
    })
  ];

  const handleZoom = (direction: 'in' | 'out') => {
    setViewState(prev => ({
      ...prev,
      zoom: direction === 'in' ? prev.zoom + 0.8 : Math.max(0.5, prev.zoom - 0.8),
      transitionDuration: 500
    }));
  };

  const handleOpenMapModal = () => { 
    if (!user) { setAuthMode('login'); setAuthModalOpen(true); return; }
    setEditingId(null);
    setStartQuery(""); setEndQuery("");
    setSelectedStartCoords(null); setSelectedEndCoords(null);
    setStartDate(""); setEndDate(""); setNewNotes(""); setSelectedFiles([]);
    setModalOpen(true); 
  };

  const handleShare = () => {
    if (!user) { setAuthMode('login'); setAuthModalOpen(true); return; }
    const url = `${window.location.origin}/share/${user.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setShareToast(t.share_success); setTimeout(() => setShareToast(""), 3000);
      });
    } else {
      const textArea = document.createElement("textarea"); textArea.value = url;
      textArea.style.position = "fixed"; textArea.style.left = "-999999px";
      document.body.appendChild(textArea); textArea.focus(); textArea.select();
      try { document.execCommand('copy'); setShareToast(t.share_success); setTimeout(() => setShareToast(""), 3000); } 
      catch (error) { console.error("复制失败", error); }
      textArea.remove();
    }
  };

  const translateSupaError = (errMsg: string) => {
    if (errMsg.includes("Invalid login credentials")) return t.auth_supa_invalid;
    if (errMsg.includes("User already registered")) return t.auth_supa_exists;
    if (errMsg.includes("rate limit") || errMsg.includes("Too many")) return t.auth_supa_too_many;
    if (errMsg.includes("Email not confirmed")) return t.auth_supa_unconfirmed;
    return lang === 'zh' ? `❌ 发生错误: ${errMsg}` : `❌ Error: ${errMsg}`;
  };

  const handleAuthSubmit = async () => {
    setAuthError(""); setAuthSuccess("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return setAuthError(t.auth_err_email);
    if (!emailRegex.test(email)) return setAuthError(t.auth_err_email_fmt);
    setIsSubmitting(true);
    
    if (authMode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
      if (error) setAuthError(translateSupaError(error.message)); else setAuthSuccess(t.auth_reset_msg);
      setIsSubmitting(false); return;
    }

    if (!password) return setAuthError(t.auth_err_pwd);
    if (password.length < 6) return setAuthError(t.auth_err_pwd_len);
    if (!authAgreed) return setAuthError(t.auth_err_agree);
    
    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(translateSupaError(error.message)); } else {
        setUser(data.user); setMyTrajectories([]); 
        const { data: trData } = await supabase.from("trajectories").select("*");
        if (trData) setMyTrajectories(trData.length > 0 ? trData : []);
        setAuthModalOpen(false);
      }
    } else if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(translateSupaError(error.message));
      else {
        if (data.session === null) { setAuthSuccess(t.auth_verify_msg); setEmail(""); setPassword(""); setAuthAgreed(false); }
        else setAuthModalOpen(false);
      }
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedTrajectory(null);
    setViewState(prev => ({
      ...prev,
      longitude: 114.2,
      latitude: 22.4,
      zoom: 3,
      pitch: 45,
      bearing: 0,
      transitionDuration: 1500
    }));
  };

  const fetchSuggestions = async (query: string, type: 'start' | 'end') => {
    if (query.length < 2) {
      if (type === 'start') setStartSuggestions([]); else setEndSuggestions([]); return;
    }
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (type === 'start') setStartSuggestions(data?.features || []); else setEndSuggestions(data?.features || []);
    } catch (e) {
      if (type === 'start') setStartSuggestions([]); else setEndSuggestions([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  const handleSaveTrajectory = async () => {
    setMapError(""); 
    if (!user) { setModalOpen(false); setAuthMode('login'); setAuthModalOpen(true); return; }
    if (!selectedStartCoords || !selectedEndCoords) return setMapError(t.alert_not_found);
    setIsSubmitting(true);

    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`; 
          const { error: uploadError } = await supabase.storage.from('journey-images').upload(filePath, file);
          if (uploadError) continue;
          const { data: publicUrlData } = supabase.storage.from('journey-images').getPublicUrl(filePath);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      const trajectoryData: any = {
        user_id: user?.id, 
        start_name: startQuery.toUpperCase(), start_lat: selectedStartCoords.lat, start_lng: selectedStartCoords.lng,
        end_name: endQuery.toUpperCase(), end_lat: selectedEndCoords.lat, end_lng: selectedEndCoords.lng,
        start_date: startDate || new Date().toISOString().slice(0, 10), end_date: endDate || new Date().toISOString().slice(0, 10),
        transport_mode: transportMode, notes: newNotes.trim()
      };
      if (uploadedUrls.length > 0) { trajectoryData.image_urls = uploadedUrls; }

      let error;
      if (editingId) {
        const res = await supabase.from("trajectories").update(trajectoryData).eq("id", editingId).select(); error = res.error;
        if (!error) {
          if (res.data && res.data.length > 0) { setMyTrajectories((prev) => prev.map(t => t.id === editingId ? res.data[0] : t)); } 
          else { setMyTrajectories((prev) => prev.map(t => t.id === editingId ? { ...t, ...trajectoryData } : t)); }
        }
      } else {
        const res = await supabase.from("trajectories").insert(trajectoryData).select(); error = res.error;
        if (!error) {
          if (res.data && res.data.length > 0) { setMyTrajectories((prev) => [...prev, res.data[0]]); } 
          else { setMyTrajectories((prev) => [...prev, { id: Date.now().toString(), ...trajectoryData }]); }
        }
      }
      
      if (!error) {
        const midLat = (trajectoryData.start_lat + trajectoryData.end_lat) / 2;
        const midLng = (trajectoryData.start_lng + trajectoryData.end_lng) / 2;
        const zoomAlt = window.innerWidth < 768 ? 2 : 3;
        setViewState(prev => ({ ...prev, longitude: midLng, latitude: midLat, zoom: zoomAlt, transitionDuration: 2000 }));
        
        setModalOpen(false); setStartQuery(""); setEndQuery(""); setSelectedStartCoords(null); setSelectedEndCoords(null);
        setStartDate(""); setEndDate(""); setNewNotes(""); setSelectedFiles([]); setEditingId(null);
      } else { setMapError("Database error: " + error.message); }
    } catch (err) { setMapError("Network error, please try again."); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTrajectory = async () => {
    if (!selectedTrajectory || !selectedTrajectory.id) return;
    const confirmMsg = lang === 'zh' ? "确定要彻底删除这条轨迹吗？操作不可逆。" : "Are you sure you want to delete this trajectory?";
    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("trajectories").delete().eq("id", selectedTrajectory.id);
    if (!error) { setMyTrajectories(prev => prev.filter(t => t.id !== selectedTrajectory.id)); setSelectedTrajectory(null); } 
    else { alert("删除失败: " + error.message); }
    setIsSubmitting(false);
  };

  const executeExport = () => {
    setExportModalOpen(false);
    setIsGeneratingScreenshot(true);
    setSelectedTrajectory(null);

    const targetZ = typeof window !== "undefined" && window.innerWidth < 768 ? 0.5 : 1.2;
    setViewState((prev: any) => ({
      ...prev,
      longitude: 10,
      latitude: 20,
      zoom: targetZ,
      minZoom: 0,
      pitch: 0,
      bearing: 0,
      transitionDuration: 1000,
    }));

    setTimeout(() => {
      const map = mapRef.current?.getMap();
      // 增加原生 DOM 抓取作为双保险，防止 ref 透传失败
      const deckCanvas = (deckRef.current?.deck?.getCanvas() || document.getElementById("deckgl-overlay")) as HTMLCanvasElement;
      const mapCanvasRaw = document.querySelector(".maplibregl-canvas") as HTMLCanvasElement;

      if (!deckCanvas || (!map && !mapCanvasRaw)) {
        alert("地图尚未就绪，请稍等几秒后再试");
        setIsGeneratingScreenshot(false);
        setViewState((prev: any) => ({ ...prev, minZoom: MIN_ZOOM }));
        return;
      }

      let captured = false;

      const performCapture = () => {
        if (captured) return;
        captured = true;
        try {
          const mapCanvas = map ? map.getCanvas() : mapCanvasRaw;
          const mergeCanvas = document.createElement("canvas");
          mergeCanvas.width = mapCanvas.width;
          mergeCanvas.height = mapCanvas.height;
          const ctx = mergeCanvas.getContext("2d");

          if (ctx) {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, mergeCanvas.width, mergeCanvas.height);
            ctx.drawImage(mapCanvas, 0, 0);
            ctx.drawImage(deckCanvas, 0, 0);

            const dataUrl = mergeCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `MyTravelGlobe_Poster_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
          }
        } catch (err) {
          console.error("Capture failed:", err);
          alert("导出失败，请刷新页面后重试！");
        } finally {
          setIsGeneratingScreenshot(false);
          setViewState((prev: any) => ({ ...prev, minZoom: MIN_ZOOM }));
        }
      };

      if (map && map.isStyleLoaded && map.isStyleLoaded()) {
        map.once("render", performCapture);
        map.triggerRepaint();
      } else {
        performCapture();
      }
    }, 1200);
  };

  if (!isMounted) return <div className="min-h-screen bg-[#020202]" />;

  return (
    <main className={`relative h-screen w-screen overflow-hidden bg-[#020202] text-white selection:bg-yellow-500/20 ${inter.className}`}>
      
      <AnimatePresence mode="wait">
        {!showMainUI && <LoadingCurtain key="init" text={t.loading} />}
        {isGeneratingScreenshot && <LoadingCurtain key="exporting" text={t.modal_export_loading} />}
      </AnimatePresence>

      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }} className="fixed top-10 left-1/2 z-[200] bg-green-500 text-black font-bold px-6 py-3 rounded-full text-xs tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] whitespace-nowrap">
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col md:flex-row">
        
        <header className="md:hidden absolute top-0 w-full z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
           <h1 className={`text-3xl tracking-wide text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] leading-tight whitespace-pre-line pointer-events-auto ${markerFont.className}`}>{t.brand}</h1>
           <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="pointer-events-auto text-[10px] font-bold tracking-widest border border-white/30 rounded-md px-2 py-1 hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-md">{lang === 'zh' ? 'EN' : '中'}</button>
        </header>

        <aside className="hidden md:flex w-[320px] shrink-0 flex-col bg-white/[0.02] backdrop-blur-2xl border-r border-white/5 z-20">
          <div className="pt-10 px-6 pb-6 flex justify-between items-start">
            <h1 className={`text-3xl tracking-wide text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] leading-tight whitespace-pre-line ${markerFont.className}`}>{t.brand}</h1>
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-[10px] font-bold tracking-widest border border-white/20 rounded-md px-2 py-1 hover:bg-white/10 transition-colors">{lang === 'zh' ? 'EN' : '中'}</button>
          </div>

          {/* 我的行程列表：过滤掉 demo 数据 */}
          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            <p className="text-[10px] font-bold tracking-widest text-yellow-500/80 uppercase mb-3 px-1">{lang === "zh" ? "我的行程" : "MY TRIPS"}</p>
            <ul className="space-y-2">
              {myTrajectories.map((tr: any) => (
                  <li
                    key={tr.id}
                    onClick={() => {
                      setSelectedTrajectory(tr);
                      const midLat = (tr.start_lat + tr.end_lat) / 2;
                      const midLng = (tr.start_lng + tr.end_lng) / 2;
                      const latDiff = Math.abs(tr.start_lat - tr.end_lat);
                      const lngDiff = Math.abs(tr.start_lng - tr.end_lng);
                      const maxDiff = Math.max(latDiff, lngDiff);
                      let targetZoom = maxDiff > 20 ? 3 : maxDiff > 10 ? 4 : maxDiff > 5 ? 5 : maxDiff > 2 ? 6 : 8;
                      setViewState((prev: any) => ({
                        ...prev,
                        longitude: midLng,
                        latitude: midLat,
                        zoom: targetZoom,
                        pitch: 0,
                        bearing: 0,
                        transitionDuration: 1500,
                      }));
                    }}
                    className="py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-yellow-500/30 cursor-pointer transition-all group"
                  >
                    <p className="text-sm font-bold text-white/95 group-hover:text-yellow-400/95 truncate tracking-wide">
                      {tr.start_name} → {tr.end_name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      {tr.start_date}
                      {tr.end_date && tr.end_date !== tr.start_date ? ` – ${tr.end_date}` : ""}
                    </p>
                  </li>
                ))}
            </ul>
          </div>

          {/* 底部：操作按钮 + 账号区 */}
          <div className="shrink-0 px-4 pb-4 space-y-3">
            <button onClick={handleOpenMapModal} className="w-full py-4 rounded-xl bg-white text-black hover:bg-yellow-400 text-sm font-black tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              {t.btn_add}
            </button>
            <button onClick={handleShare} className="w-full py-4 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-sm font-bold tracking-widest transition-all">
              {t.btn_share}
            </button>
            <button onClick={() => { setSelectedExportIds(myTrajectories.map(t => t.id)); setExportModalOpen(true); }} className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold tracking-widest transition-all">
              {t.btn_export}
            </button>
          </div>
          <div className="p-6 pt-0 border-t border-white/5 flex flex-col justify-end">
            {user ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 font-mono truncate text-center px-2">ID: {user.email}</div>
                <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 text-xs font-bold tracking-widest transition-all">
                  {t.btn_logout}
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="w-full py-3 rounded-xl bg-transparent border border-white/10 hover:border-white/30 text-white/70 hover:text-white text-xs font-bold tracking-widest transition-all">
                {t.btn_login}
              </button>
            )}
          </div>
        </aside>

        <div className="md:hidden absolute bottom-6 left-6 right-6 z-20 flex justify-between bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl">
           <button onClick={handleOpenMapModal} className="flex-1 py-3 text-center rounded-xl bg-white text-black text-xs font-black tracking-widest">
             <span className="block text-lg mb-1">➕</span> {t.btn_add}
           </button>
           <button onClick={handleShare} className="flex-1 py-3 text-center rounded-xl text-yellow-500 hover:bg-white/5 text-[10px] font-bold tracking-widest">
             <span className="block text-lg mb-1">🔗</span> {t.btn_share}
           </button>
           <button onClick={() => { setSelectedExportIds(myTrajectories.map(t => t.id)); setExportModalOpen(true); }} className="flex-1 py-3 text-center rounded-xl text-white hover:bg-white/5 text-[10px] font-bold tracking-widest">
             <span className="block text-lg mb-1">📸</span> {t.btn_export}
           </button>
           {user ? (
             <button onClick={handleLogout} className="flex-1 py-3 text-center rounded-xl text-red-500 hover:bg-white/5 text-[10px] font-bold tracking-widest">
               <span className="block text-lg mb-1 text-white">👤</span> {t.btn_logout}
             </button>
           ) : (
             <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="flex-1 py-3 text-center rounded-xl text-gray-400 hover:bg-white/5 text-[10px] font-bold tracking-widest">
               <span className="block text-lg mb-1">👤</span> {t.btn_login}
             </button>
           )}
        </div>

        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
          <button onClick={() => handleZoom('in')} className="w-10 h-10 bg-white/5 hover:bg-white/20 backdrop-blur-xl rounded-full text-white font-light text-xl border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all">＋</button>
          <button onClick={() => handleZoom('out')} className="w-10 h-10 bg-white/5 hover:bg-white/20 backdrop-blur-xl rounded-full text-white font-light text-xl border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all">－</button>
        </div>

        <div className="flex-1 relative bg-black">
          <div className="absolute inset-0 pb-24 md:pb-0">
            <Map2D
              lang={lang}
              viewState={viewState}
              onViewStateChange={({ viewState: vs }: any) => {
                const minZ = typeof viewState.minZoom === "number" ? viewState.minZoom : MIN_ZOOM;
                const maxZ = typeof viewState.maxZoom === "number" ? viewState.maxZoom : 20;
                const maxP = typeof viewState.maxPitch === "number" ? viewState.maxPitch : MAX_PITCH;
                setViewState({
                  ...vs,
                  zoom: Math.max(minZ, Math.min(maxZ, vs.zoom ?? minZ)),
                  pitch: Math.max(0, Math.min(maxP, vs.pitch ?? 0)),
                  transitionDuration: 0
                } as any);
              }}
              layers={layers}
              deckRef={deckRef}
              webglDefer={webglDefer}
              setSelectedTrajectory={setSelectedTrajectory}
              onMapLoad={() => setShowMainUI(true)}
              mapRef={mapRef}
            />
          </div>
        </div>
      </div>

      <motion.div className={`fixed bottom-0 right-0 h-[70vh] md:h-full w-full md:w-[450px] bg-[#050505]/95 backdrop-blur-3xl border-t md:border-l md:border-t-0 border-white/10 p-6 md:p-10 text-white z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-t-[2rem] md:rounded-none ${selectedTrajectory ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}>
        {selectedTrajectory && (
          <div className="h-full flex flex-col relative overflow-y-auto pr-2 pb-10 scrollbar-hide">
            <button className="absolute -top-2 md:-top-2 -right-2 md:-right-2 text-gray-500 hover:text-white text-xl z-50 bg-[#050505] rounded-full p-2" onClick={() => setSelectedTrajectory(null)}>✕</button>
            <div className="flex items-center gap-3 mb-4 mt-2 md:mt-4">
              <span className="text-xl">{selectedTrajectory.transport_mode === 'flight' ? '✈️' : selectedTrajectory.transport_mode === 'train' ? '🚄' : selectedTrajectory.transport_mode === 'drive' ? '🚗' : selectedTrajectory.transport_mode === 'cruise' ? '🚢' : '🚶'}</span>
              <p className="text-xs font-mono text-yellow-500/70 tracking-widest">{t.drawer_notes}</p>
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
                <p className="text-xs text-gray-500 font-mono tracking-widest mb-1">{t.drawer_date}</p>
                <p className="text-sm text-gray-200 mb-6 font-mono">{selectedTrajectory.start_date} to {selectedTrajectory.end_date}</p>
                <p className="text-xs text-gray-500 font-mono tracking-widest mb-2">{t.drawer_memos}</p>
                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{selectedTrajectory.notes}</p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button onClick={() => {
                  if(!user) { setAuthMode('login'); setAuthModalOpen(true); return; } if(!selectedTrajectory.id) return;
                  setStartQuery(selectedTrajectory.start_name); setEndQuery(selectedTrajectory.end_name);
                  setSelectedStartCoords({ lat: selectedTrajectory.start_lat, lng: selectedTrajectory.start_lng }); setSelectedEndCoords({ lat: selectedTrajectory.end_lat, lng: selectedTrajectory.end_lng });
                  setStartDate(selectedTrajectory.start_date); setEndDate(selectedTrajectory.end_date); setTransportMode(selectedTrajectory.transport_mode); setNewNotes(selectedTrajectory.notes);
                  setEditingId(selectedTrajectory.id); setSelectedTrajectory(null); setModalOpen(true); 
                }}
                className="flex-1 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition font-bold tracking-widest py-3 md:py-4 rounded-xl text-xs md:text-sm"
              >
                {t.drawer_edit}
              </button>
              {user && selectedTrajectory.id && !selectedTrajectory.id.startsWith("demo-") && (
                <button onClick={handleDeleteTrajectory} disabled={isSubmitting} className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition font-bold tracking-widest py-3 md:py-4 rounded-xl text-xs md:text-sm disabled:opacity-50">
                  {isSubmitting ? "..." : t.btn_delete}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isSubmitting && setModalOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl p-6 md:p-10 text-white max-h-[90vh] overflow-y-auto scrollbar-hide" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              <h3 className="text-xl md:text-2xl font-black tracking-widest mb-6 md:mb-8">{editingId ? t.modal_update : t.modal_title}</h3>
              <div className="space-y-4 md:space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_start}</label>
                      <input disabled={isSubmitting} type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); setSelectedStartCoords(null); fetchSuggestions(e.target.value, 'start'); setMapError(""); }} placeholder={t.modal_start_ph} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-yellow-500/50" />
                      {startSuggestions?.length > 0 && !selectedStartCoords && (
                        <div className="absolute top-full left-0 right-0 bg-[#111] border border-white/10 rounded-xl mt-1 z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {startSuggestions.map((f, i) => (
                            <button key={i} onClick={() => { setStartQuery(f.properties.name); setSelectedStartCoords({ lat: f.geometry?.coordinates?.[1] || 0, lng: f.geometry?.coordinates?.[0] || 0 }); setStartSuggestions([]); }} className="w-full p-3 text-left text-xs hover:bg-white/10 border-b border-white/5 text-white/80">
                              <span className="font-bold text-white block">{f.properties.name}</span>
                              <span className="text-gray-500 text-[9px] mt-0.5 block truncate">{[f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(", ")}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_date_start}</label>
                      <input disabled={isSubmitting} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-yellow-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                  </div>
                  <div className="space-y-4 relative">
                    <div className="absolute -left-3 top-[38px] bottom-[38px] w-px bg-white/10 hidden md:block"></div>
                    <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 bg-[#0a0a0a] text-gray-600 text-xs hidden md:block">→</div>
                    
                    <div className="relative">
                      <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_end}</label>
                      <input disabled={isSubmitting} type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); setSelectedEndCoords(null); fetchSuggestions(e.target.value, 'end'); setMapError(""); }} placeholder={t.modal_end_ph} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-yellow-500/50" />
                      {endSuggestions?.length > 0 && !selectedEndCoords && (
                        <div className="absolute top-full left-0 right-0 bg-[#111] border border-white/10 rounded-xl mt-1 z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {endSuggestions.map((f, i) => (
                            <button key={i} onClick={() => { setEndQuery(f.properties.name); setSelectedEndCoords({ lat: f.geometry?.coordinates?.[1] || 0, lng: f.geometry?.coordinates?.[0] || 0 }); setEndSuggestions([]); }} className="w-full p-3 text-left text-xs hover:bg-white/10 border-b border-white/5 text-white/80">
                              <span className="font-bold text-white block">{f.properties.name}</span>
                              <span className="text-gray-500 text-[9px] mt-0.5 block truncate">{[f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(", ")}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_date_end}</label>
                      <input disabled={isSubmitting} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-yellow-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_trans}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'flight', label: t.trans_flight }, { id: 'train', label: t.trans_train }, 
                      { id: 'drive', label: t.trans_drive }, { id: 'cruise', label: t.trans_cruise }, 
                      { id: 'walk', label: t.trans_walk }
                    ].map((mode) => (
                      <button 
                        key={mode.id} disabled={isSubmitting}
                        onClick={() => setTransportMode(mode.id)}
                        className={`py-2 md:py-3 rounded-xl text-xs font-medium border transition-all ${transportMode === mode.id ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                      >
                        <span className="block text-lg mb-1">{mode.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_photos}</label>
                  <label htmlFor="photo-upload" className={`w-full bg-white/[0.02] border border-dashed border-white/20 rounded-xl min-h-[4rem] md:min-h-[5rem] p-4 flex flex-col items-center justify-center transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5 hover:border-yellow-500/50 group'}`}>
                    <span className={`text-xs font-bold mb-1 ${isSubmitting ? 'text-gray-600' : 'text-gray-400 group-hover:text-yellow-400'}`}>
                      {selectedFiles.length > 0 ? `${t.modal_upload_count} ${selectedFiles.length}` : t.modal_upload}
                    </span>
                    {selectedFiles.length > 0 && (
                      <span className="text-[10px] text-gray-500 text-center truncate px-4 w-full">
                        {selectedFiles.map(f => f.name).join(', ')}
                      </span>
                    )}
                  </label>
                  <input id="photo-upload" type="file" multiple accept="image/*" onChange={handleFileChange} disabled={isSubmitting} className="hidden" />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-wider">{t.modal_notes}</label>
                  <textarea disabled={isSubmitting} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder={t.modal_notes_ph} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-yellow-500/50 resize-none disabled:opacity-50" />
                </div>
              </div>

              <AnimatePresence>
                {mapError && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-yellow-500 text-xs font-bold tracking-wider mt-4 text-center">{mapError}</motion.p>}
              </AnimatePresence>

              <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
                <button disabled={isSubmitting} onClick={() => { setModalOpen(false); setEditingId(null); }} className="flex-1 py-3 md:py-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white font-bold tracking-widest text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed">{t.modal_cancel}</button>
                <button disabled={isSubmitting} onClick={handleSaveTrajectory} className={`flex-1 py-3 md:py-4 rounded-xl text-black font-bold tracking-widest text-xs md:text-sm transition-all ${isSubmitting ? 'bg-yellow-600 cursor-not-allowed' : 'bg-white hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.2)]'}`}>
                  {isSubmitting ? t.modal_locating : (editingId ? t.modal_update : t.modal_save)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setExportModalOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
             <motion.div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl p-6 md:p-8 text-white max-h-[80vh] overflow-y-auto scrollbar-hide" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
                 <h3 className="text-lg md:text-xl font-black tracking-widest mb-6">{t.modal_export_title}</h3>
                 <div className="space-y-2 mb-8">
                    {myTrajectories.length === 0 || (myTrajectories.length > 0 && myTrajectories[0].id?.startsWith("demo-")) ? (
                       <p className="text-gray-500 text-sm text-center py-4">暂无专属记录，请先添加行程</p>
                    ) : (
                      myTrajectories.map(tr => (
                         <label key={tr.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                            <input type="checkbox" checked={selectedExportIds.includes(tr.id)} onChange={(e) => {
                                if (e.target.checked) setSelectedExportIds(prev => [...prev, tr.id]);
                                else setSelectedExportIds(prev => prev.filter(id => id !== tr.id));
                            }} className="accent-yellow-500 w-4 h-4 shrink-0" />
                            <span className="text-xs md:text-sm font-bold truncate">{tr.start_name} → {tr.end_name}</span>
                         </label>
                      ))
                    )}
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setExportModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white font-bold tracking-widest text-xs">{t.modal_cancel}</button>
                    <button onClick={executeExport} disabled={selectedExportIds.length === 0 || (myTrajectories.length > 0 && myTrajectories[0].id?.startsWith("demo-"))} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 font-bold tracking-widest text-xs disabled:opacity-30">{t.btn_confirm_export}</button>
                 </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
              <button disabled={isSubmitting} className="absolute top-6 right-6 text-gray-500 hover:text-white disabled:opacity-50" onClick={() => { setAuthModalOpen(false); setAuthSuccess(""); setAuthError(""); }}>✕</button>
              
              <h3 className="text-lg md:text-xl font-black tracking-widest mb-8 text-center">
                {authMode === 'login' ? t.auth_title_login : authMode === 'signup' ? t.auth_title_signup : t.auth_title_reset}
              </h3>
              
              {authSuccess ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20"><span className="text-2xl">📬</span></div>
                  <p className="text-green-400 text-sm font-bold tracking-widest leading-relaxed">{authSuccess}</p>
                  <button onClick={() => { setAuthSuccess(""); setAuthMode('login'); }} className="text-gray-400 text-xs underline underline-offset-4 hover:text-white mt-4">返回登录</button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest">{t.auth_email}</label>
                      <input disabled={isSubmitting} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setAuthError(""); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors disabled:opacity-50" />
                    </div>
                    
                    {authMode !== 'reset' && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="block text-[10px] font-mono text-gray-500 tracking-widest">{t.auth_pwd}</label>
                          {authMode === 'login' && (
                            <button onClick={() => { setAuthMode('reset'); setAuthError(""); }} className="text-[10px] text-gray-500 hover:text-white transition-colors tracking-widest underline underline-offset-4 disabled:opacity-50">
                              {t.auth_switch_reset}
                            </button>
                          )}
                        </div>
                        <input disabled={isSubmitting} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setAuthError(""); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors disabled:opacity-50" />
                      </div>
                    )}

                    {authMode !== 'reset' && (
                      <div className="flex items-start gap-3 pt-2">
                        <input disabled={isSubmitting} type="checkbox" id="agreement" checked={authAgreed} onChange={(e) => { setAuthAgreed(e.target.checked); setAuthError(""); }} className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-yellow-500 checked:border-yellow-500 appearance-none flex items-center justify-center after:content-['✓'] after:text-black after:text-[10px] after:font-bold checked:after:block after:hidden cursor-pointer disabled:opacity-50 shrink-0" />
                        <label htmlFor="agreement" className="text-[10px] text-gray-500 leading-relaxed cursor-pointer select-none flex-1">
                          {t.auth_agree}
                          <span className="text-yellow-500 hover:underline mx-1" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>《用户协议》</span>
                          {lang === 'zh' ? '和' : 'and'}
                          <span className="text-yellow-500 hover:underline mx-1" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}>《隐私政策》</span>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {authError && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-bold tracking-wider mt-5 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{authError}</motion.p>}
                  </AnimatePresence>
                  
                  <button disabled={isSubmitting} onClick={handleAuthSubmit} className={`w-full ${authError ? 'mt-4' : 'mt-8'} py-4 rounded-xl text-black transition-all text-xs font-black tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] ${isSubmitting ? 'bg-yellow-600 cursor-not-allowed' : 'bg-white hover:bg-yellow-400'}`}>
                    {isSubmitting ? t.loading : (authMode === 'login' ? t.auth_action_login : authMode === 'signup' ? t.auth_action_signup : t.auth_action_reset)}
                  </button>
                  
                  <div className="mt-6 text-center space-y-4 flex flex-col">
                    {authMode === 'reset' ? (
                       <button disabled={isSubmitting} onClick={() => { setAuthMode('login'); setAuthError(""); }} className="text-[10px] text-gray-500 hover:text-white transition-colors tracking-widest underline underline-offset-4 disabled:opacity-50">
                         {t.auth_switch_login}
                       </button>
                    ) : (
                       <button disabled={isSubmitting} onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(""); }} className="text-[10px] text-gray-500 hover:text-white transition-colors tracking-widest underline underline-offset-4 disabled:opacity-50">
                         {authMode === 'login' ? t.auth_switch_signup : t.auth_switch_login}
                       </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
             <motion.div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowTerms(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
             <motion.div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl p-8 text-white max-h-[80vh] overflow-y-auto scrollbar-hide" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
                 <button className="absolute top-6 right-6 text-gray-500 hover:text-white" onClick={() => setShowTerms(false)}>✕</button>
                 <h3 className="text-xl font-black tracking-widest mb-6">用户协议 (Terms of Service)</h3>
                 <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                    <p>欢迎使用 My Travel Globe。在使用本服务前，请仔细阅读以下条款：</p>
                    <h4 className="text-white font-bold">1. 服务内容</h4>
                    <p>本平台为您提供个人旅行轨迹的 3D 地图可视化、云端照片存储及地图图片生成导出服务。</p>
                    <h4 className="text-white font-bold">2. 用户行为规范</h4>
                    <p>您需对您账号下产生的所有行为负责。请勿上传任何违法、侵权、涉黄、涉暴的图片或文字内容。如若违反，平台有权随时封禁您的账号并删除相关数据。</p>
                    <h4 className="text-white font-bold">3. 数据确权与免责声明</h4>
                    <p>您上传的原创游记、摄影照片的知识产权完全归您个人所有。本平台仅提供云端存储与展示服务，不对因不可抗力导致的数据丢失承担法律责任，建议您对珍贵照片做好本地备份。</p>
                 </div>
                 <button onClick={() => setShowTerms(false)} className="w-full mt-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest text-xs transition">我已了解</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
             <motion.div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowPrivacy(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
             <motion.div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl p-8 text-white max-h-[80vh] overflow-y-auto scrollbar-hide" initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
                 <button className="absolute top-6 right-6 text-gray-500 hover:text-white" onClick={() => setShowPrivacy(false)}>✕</button>
                 <h3 className="text-xl font-black tracking-widest mb-6">隐私政策 (Privacy Policy)</h3>
                 <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                    <p>保护您的隐私是我们的首要原则。本平台严格遵循“最小化数据收集”标准：</p>
                    <h4 className="text-white font-bold">1. 我们收集哪些信息？</h4>
                    <p>为了提供核心功能，我们仅收集您的电子邮箱（用于注册鉴权）以及您主动填写的旅行地点、时间、文字日记与上传的照片。</p>
                    <h4 className="text-white font-bold">2. 数据如何被保护？</h4>
                    <p>您的密码通过 Supabase 提供的技术进行单向存储，即使是平台开发者也无法查看您的明文密码。我们承诺，绝不向任何第三方机构出售您的个人数据。</p>
                    <h4 className="text-white font-bold">3. 您的权利</h4>
                    <p>您拥有对个人数据的完全控制权。您可以随时在系统中修改、删除您的旅行记录与照片。如需彻底注销账号及清除云端所有数据，请联系支持团队。</p>
                 </div>
                 <button onClick={() => setShowPrivacy(false)} className="w-full mt-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest text-xs transition">我已了解</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}