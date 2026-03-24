import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRescue, updateRescueStatus } from "../api/rescue";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, MapPin, User, Phone, Image as ImageIcon, Video, Calendar, ChevronDown, Clock, Loader2, CheckCircle2, XCircle, Play, X, ChevronLeft, ChevronRight } from "lucide-react";

const USER_BACKEND_URL = import.meta.env.VITE_USER_BACKEND_URL || "http://localhost:5555";
const ADMIN_API_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5557";

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${USER_BACKEND_URL}${url}`;
}

const statusConfig = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
  in_progress: { label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", icon: Loader2 },
  completed: { label: "Completed", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
};

const statuses = ["pending", "in_progress", "completed", "cancelled"];

function StatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = statusConfig[value] || statusConfig.pending;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (disabled) {
    return (
      <span className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-semibold border ${current.bg} ${current.text} ${current.border}`}>
        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        {current.label}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-semibold border cursor-pointer transition-all hover:shadow-sm ${current.bg} ${current.text} ${current.border}`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        {current.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Change status</p>
          </div>
          {statuses.map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            const isActive = s === value;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${isActive ? `${cfg.bg} ${cfg.text} font-semibold` : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon size={16} className={isActive ? cfg.text : "text-slate-400"} />
                {cfg.label}
                {isActive && <CheckCircle2 size={14} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MediaViewer({ items, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const item = items[index];
  const url = resolveMediaUrl(item?.image_url);
  const isVideo = item?.media_type === "video";

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < items.length - 1) setIndex(index + 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [index, items.length, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center justify-center min-h-[300px]">
          {index > 0 && (
            <button onClick={() => setIndex(index - 1)} className="absolute left-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all">
              <ChevronLeft size={24} />
            </button>
          )}

          {isVideo ? (
            <video src={url} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl" />
          ) : (
            <img src={url} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
          )}

          {index < items.length - 1 && (
            <button onClick={() => setIndex(index + 1)} className="absolute right-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all">
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        <div className="text-center mt-3 text-white/60 text-sm">
          {index + 1} / {items.length} {isVideo ? "Video" : "Image"}
        </div>
      </div>
    </div>
  );
}

function MediaItem({ item, onClick }) {
  const url = resolveMediaUrl(item.image_url);
  const isVideo = item.media_type === "video";

  if (isVideo) {
    return (
      <button onClick={onClick} className="relative w-48 h-36 rounded-xl overflow-hidden border border-slate-200 bg-black hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group">
        <video src={url} className="w-full h-full object-contain" preload="metadata" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={20} className="text-slate-700 ml-0.5" />
          </div>
        </div>
        <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <Video size={10} /> Video
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="block w-28 h-28 rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer">
      <img src={url} alt="" className="w-full h-full object-cover" />
    </button>
  );
}

export default function RescueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission("rescue_update");

  const { data, isLoading } = useQuery({
    queryKey: ["rescue", id],
    queryFn: () => getRescue(id),
  });

  const statusMut = useMutation({
    mutationFn: (status) => updateRescueStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rescue", id] }),
  });

  const [viewer, setViewer] = useState({ open: false, items: [], index: 0 });

  const rescue = data?.data?.data;

  if (isLoading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;
  if (!rescue) return <div className="flex items-center justify-center py-20 text-slate-400">Rescue not found</div>;

  const images = Array.isArray(rescue.images) ? rescue.images : rescue.images?.id ? [rescue.images] : [];
  const rescuePersons = Array.isArray(rescue.rescue_persons) ? rescue.rescue_persons : rescue.rescue_persons?.id ? [rescue.rescue_persons] : [];

  const mediaImages = images.filter((m) => m.media_type !== "video");
  const mediaVideos = images.filter((m) => m.media_type === "video");
  const allMedia = [...mediaImages, ...mediaVideos];

  const openViewer = (item) => {
    const idx = allMedia.findIndex((m) => m.id === item.id);
    setViewer({ open: true, items: allMedia, index: idx >= 0 ? idx : 0 });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={18} /> Back to Rescues
      </button>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500 text-white">
              <span className="font-bold text-lg">#{rescue.id}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Rescue #{rescue.id}</h1>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                <Calendar size={14} />
                {new Date(rescue.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <StatusDropdown
            value={rescue.status}
            onChange={(status) => statusMut.mutate(status)}
            disabled={!canUpdate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Animal info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Animal Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Type</p>
              <p className="text-slate-900 font-semibold">{rescue.animal_type}</p>
            </div>
            {rescue.animal_description && (
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-slate-700 text-sm">{rescue.animal_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info provider */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Info Provider</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-sm font-medium text-slate-900">{rescue.info_provider_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Number</p>
                <p className="text-sm font-medium text-slate-900">{rescue.info_provider_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* From address */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <MapPin size={18} />
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">From Address</h2>
          </div>
          <p className="text-sm text-slate-900 font-medium">{rescue.from_address}</p>
          <div className="flex gap-4 mt-2">
            {rescue.from_pincode && <p className="text-xs text-slate-500">Pincode: <span className="text-slate-700">{rescue.from_pincode}</span></p>}
            {rescue.from_area && <p className="text-xs text-slate-500">Area: <span className="text-slate-700">{rescue.from_area}</span></p>}
          </div>
        </div>

        {/* To address */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <MapPin size={18} />
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Address</h2>
          </div>
          <p className="text-sm text-slate-900 font-medium">{rescue.to_address}</p>
          <div className="flex gap-4 mt-2">
            {rescue.to_pincode && <p className="text-xs text-slate-500">Pincode: <span className="text-slate-700">{rescue.to_pincode}</span></p>}
            {rescue.to_area && <p className="text-xs text-slate-500">Area: <span className="text-slate-700">{rescue.to_area}</span></p>}
          </div>
        </div>
      </div>

      {/* Images */}
      {mediaImages.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
              <ImageIcon size={18} />
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Images ({mediaImages.length})</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {mediaImages.map((img, i) => (
              <MediaItem key={img.id || i} item={img} onClick={() => openViewer(img)} />
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {mediaVideos.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Video size={18} />
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Videos ({mediaVideos.length})</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {mediaVideos.map((vid, i) => (
              <MediaItem key={vid.id || i} item={vid} onClick={() => openViewer(vid)} />
            ))}
          </div>
        </div>
      )}

      {/* Rescue persons */}
      {rescuePersons.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Rescue Persons</h2>
          <div className="flex flex-wrap gap-2">
            {rescuePersons.map((p) => (
              <span key={p.id || p.user_id} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-sm px-3.5 py-1.5 rounded-full font-medium">
                <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-white text-[10px] font-bold">
                  {(p.user?.full_name || p.full_name || "U")[0].toUpperCase()}
                </div>
                {p.user?.full_name || p.full_name || `User #${p.user_id}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer timestamps */}
      {rescue.updatedAt && (
        <div className="text-xs text-slate-400 text-right">
          Updated: {new Date(rescue.updatedAt).toLocaleString()}
        </div>
      )}

      {viewer.open && (
        <MediaViewer
          items={viewer.items}
          startIndex={viewer.index}
          onClose={() => setViewer({ open: false, items: [], index: 0 })}
        />
      )}
    </div>
  );
}
