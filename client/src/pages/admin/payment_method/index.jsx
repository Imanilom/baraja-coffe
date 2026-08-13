import { useState, useEffect, useRef } from "react";
import axios from "@/lib/axios";

const Icon = ({ d, size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const ICONS = {
  plus:    "M12 5v14M5 12h14",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2",
  close:   "M18 6 6 18M6 6l12 12",
  check:   "M20 6 9 17l-5-5",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  credit:  "M2 5h20v14H2zM2 10h20",
  cash:    "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  bank:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  wallet:  "M21 12V7a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3",
  search:  "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
};

const METHOD_GROUPS = [
  { id: "cash",         label: "Cash",         color: "#16a34a", bg: "#dcfce7" },
  { id: "debit",        label: "Debit",        color: "#2563eb", bg: "#dbeafe" },
  { id: "banktransfer", label: "Bank Transfer", color: "#7c3aed", bg: "#ede9fe" },
  { id: "qris",         label: "QRIS",         color: "#0891b2", bg: "#cffafe" },
  { id: "ewallet",      label: "E-Wallet",     color: "#ea580c", bg: "#ffedd5" },
];

const ALL_FILTERS = ["Semua", "Aktif", "Nonaktif", "Bank", "Cash", "Digital", "GRO Only"];

const hexToRgba = (hex, alpha = 0.12) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const StatCard = ({ label, value, color, icon }) => (
  <div className="rounded-xl p-4 flex items-center gap-3 shadow-sm border" style={{ borderColor: `${color}30`, background: hexToRgba(color, 0.06) }}>
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.15), color }}>
      <Icon d={ICONS[icon]} size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const GroupBadge = ({ groupId }) => {
  const g = METHOD_GROUPS.find((x) => x.id === groupId);
  if (!g) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{groupId}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: g.bg, color: g.color }}>{g.label}</span>;
};

const TypeBadge = ({ label, color, bg }) => (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>{label}</span>
);

const FLAG_CONFIG = [
  { key: "isBank",    label: "Bank",     color: "#2563eb" },
  { key: "isCash",    label: "Cash",     color: "#16a34a" },
  { key: "isDigital", label: "Digital",  color: "#7c3aed" },
  { key: "isPtBank",  label: "PT Bank",  color: "#d97706" },
  { key: "groOnly",   label: "GRO Only", color: "#dc2626" },
  { key: "isActive",  label: "Aktif",    color: "#059669" },
];

function MethodForm({ form, setForm }) {
  const toggleGroup = (id) => {
    setForm((prev) => ({
      ...prev,
      methodIds: prev.methodIds.includes(id)
        ? prev.methodIds.filter((x) => x !== id)
        : [...prev.methodIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Nama *</label>
          <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: BCA, Tunai, QRIS" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Bank Code *</label>
          <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="bca / cash / qris" value={form.bank_code} onChange={(e) => setForm({ ...form, bank_code: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Type Code</label>
          <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="BCA / CASH / QRIS" value={form.typeCode} onChange={(e) => setForm({ ...form, typeCode: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Payment Method (sistem) *</label>
          <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="">-- Pilih --</option>
            <option value="cash">cash</option>
            <option value="bank_transfer">bank_transfer</option>
            <option value="qris">qris</option>
            <option value="gopay">gopay</option>
            <option value="shopeepay">shopeepay</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Nama Grup POS</label>
          <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.payment_method_name} onChange={(e) => setForm({ ...form, payment_method_name: e.target.value })}>
            <option value="">-- Pilih --</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="E-Wallet">E-Wallet</option>
            <option value="Bank Transfer PT">Bank Transfer PT</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Warna</label>
          <div className="flex gap-2">
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 rounded-lg border cursor-pointer" />
            <input className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Tampilkan di Grup POS (MethodIds)</label>
        <div className="flex flex-wrap gap-2">
          {METHOD_GROUPS.map((g) => {
            const active = form.methodIds.includes(g.id);
            return (
              <button key={g.id} type="button" onClick={() => toggleGroup(g.id)} className="px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all" style={{ borderColor: active ? g.color : "#e5e7eb", background: active ? g.bg : "white", color: active ? g.color : "#6b7280" }}>
                {active && "✓ "}{g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Properti</label>
        <div className="grid grid-cols-3 gap-3">
          {FLAG_CONFIG.map(({ key, label, color }) => {
            const on = form[key];
            return (
              <button key={key} type="button" onClick={() => setForm({ ...form, [key]: !on })} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all" style={{ borderColor: on ? color : "#e5e7eb", background: on ? hexToRgba(color, 0.08) : "white", color: on ? color : "#6b7280" }}>
                <span className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? color : "#d1d5db", background: on ? color : "white" }}>
                  {on && <Icon d={ICONS.check} size={10} className="text-white" />}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", icon: "default.png", color: "#2196F3", payment_method: "", payment_method_name: "", bank_code: "", typeCode: "", methodIds: [], isBank: false, isCash: false, isPtBank: false, groOnly: false, isDigital: true, isActive: true };

function Modal({ title, subtitle, onClose, onSave, saving, error, children }) {
  const backdropRef = useRef(null);
  const handleBackdrop = (e) => { if (e.target === backdropRef.current) onClose(); };
  return (
    <div ref={backdropRef} onClick={handleBackdrop} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ animation: "slideUp .22s ease-out" }}>
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Icon d={ICONS.close} size={20} /></button>
        </div>
        <div className="p-6">
          {error && <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          {children}
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition">Batal</button>
          <button onClick={onSave} disabled={saving} className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition" style={{ background: saving ? "#93c5fd" : "#2563eb" }}>
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</> : <><Icon d={ICONS.check} size={16} />Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const PaymentCard = ({ pm, onEdit, onDelete, onToggleActive }) => {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const accent = pm.color || "#2196F3";

  const handleToggle = async () => { setToggling(true); await onToggleActive(pm._id, !pm.isActive); setToggling(false); };
  const handleDelete = async () => {
    if (!window.confirm(`Hapus "${pm.name}"?`)) return;
    setDeleting(true); await onDelete(pm._id); setDeleting(false);
  };

  return (
    <div className="relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200" style={{ borderColor: `${accent}25` }}>
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <div className="absolute top-4 right-4">
        <button onClick={handleToggle} disabled={toggling} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all" style={{ background: pm.isActive ? "#dcfce7" : "#fee2e2", color: pm.isActive ? "#16a34a" : "#dc2626" }} title={pm.isActive ? "Klik nonaktifkan" : "Klik aktifkan"}>
          {toggling ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <span className="w-2 h-2 rounded-full" style={{ background: pm.isActive ? "#16a34a" : "#dc2626" }} />}
          {pm.isActive ? "Aktif" : "Nonaktif"}
        </button>
      </div>
      <div className="p-5 pt-4">
        <div className="flex items-center gap-3 mb-4 pr-20">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: accent }}>
            {pm.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-sm">{pm.name}</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{pm.bank_code}</p>
          </div>
        </div>
        {pm.methodIds?.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-3">{pm.methodIds.map((id) => <GroupBadge key={id} groupId={id} />)}</div>
        ) : (
          <div className="mb-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Tidak di grup POS</span></div>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {pm.isBank    && <TypeBadge label="Bank"     color="#2563eb" bg="#dbeafe" />}
          {pm.isCash    && <TypeBadge label="Cash"     color="#16a34a" bg="#dcfce7" />}
          {pm.isDigital && <TypeBadge label="Digital"  color="#7c3aed" bg="#ede9fe" />}
          {pm.isPtBank  && <TypeBadge label="PT Bank"  color="#d97706" bg="#fef3c7" />}
          {pm.groOnly   && <TypeBadge label="GRO Only" color="#dc2626" bg="#fee2e2" />}
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Grup: <span className="font-semibold text-gray-600">{pm.payment_method_name || "-"}</span>
          {" · "}Sistem: <span className="font-mono text-gray-600">{pm.payment_method || "-"}</span>
        </p>
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button onClick={() => onEdit(pm)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
            <Icon d={ICONS.edit} size={13} /> Edit
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
            {deleting ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Icon d={ICONS.trash} size={13} />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PaymentMethodDashboard() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [editForm, setEditForm]   = useState(EMPTY_FORM);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError]   = useState(null);
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [activeGroup, setActiveGroup]   = useState("semua");

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get("/api/paymentMethode");
      if (res.data.success) setPaymentMethods(res.data.data);
      else setError(res.data.message || "Gagal mengambil data");
    } catch { setError("Terjadi kesalahan koneksi"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const total    = paymentMethods.length;
  const aktif    = paymentMethods.filter((p) => p.isActive).length;
  const nonaktif = total - aktif;
  const digital  = paymentMethods.filter((p) => p.isDigital).length;

  const filtered = paymentMethods.filter((pm) => {
    const q = search.toLowerCase();
    const matchSearch = pm.name?.toLowerCase().includes(q) || pm.bank_code?.toLowerCase().includes(q) || pm.typeCode?.toLowerCase().includes(q);
    const matchFilter = activeFilter === "Semua" ? true : activeFilter === "Aktif" ? pm.isActive : activeFilter === "Nonaktif" ? !pm.isActive : activeFilter === "Bank" ? pm.isBank : activeFilter === "Cash" ? pm.isCash : activeFilter === "Digital" ? pm.isDigital : activeFilter === "GRO Only" ? pm.groOnly : true;
    const matchGroup = activeGroup === "semua" ? true : pm.methodIds?.includes(activeGroup);
    return matchSearch && matchFilter && matchGroup;
  });

  const openEdit = (pm) => { setEditTarget(pm); setEditForm({ name: pm.name || "", icon: pm.icon || "default.png", color: pm.color || "#2196F3", payment_method: pm.payment_method || "", payment_method_name: pm.payment_method_name || "", bank_code: pm.bank_code || "", typeCode: pm.typeCode || "", methodIds: pm.methodIds || [], isBank: pm.isBank || false, isCash: pm.isCash || false, isPtBank: pm.isPtBank || false, groOnly: pm.groOnly || false, isDigital: pm.isDigital || false, isActive: pm.isActive !== undefined ? pm.isActive : true }); setModalError(null); };

  const handleEditSave = async () => {
    setModalSaving(true); setModalError(null);
    try {
      const res = await axios.put(`/api/paymentMethode/${editTarget._id}`, editForm);
      if (res.data.success) { setPaymentMethods((prev) => prev.map((p) => p._id === res.data.data._id ? res.data.data : p)); setEditTarget(null); }
      else setModalError(res.data.message || "Gagal menyimpan");
    } catch { setModalError("Terjadi kesalahan jaringan"); }
    finally { setModalSaving(false); }
  };

  const handleAddSave = async () => {
    if (!addForm.name || !addForm.bank_code || !addForm.payment_method) { setModalError("Nama, Bank Code, dan Payment Method wajib diisi"); return; }
    setModalSaving(true); setModalError(null);
    try {
      const res = await axios.post("/api/paymentMethode", addForm);
      if (res.data.success) { setPaymentMethods((prev) => [res.data.data, ...prev]); setShowAdd(false); setAddForm(EMPTY_FORM); }
      else setModalError(res.data.message || "Gagal menyimpan");
    } catch { setModalError("Terjadi kesalahan jaringan"); }
    finally { setModalSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`/api/paymentMethode/${id}`); setPaymentMethods((prev) => prev.filter((p) => p._id !== id)); }
    catch { alert("Gagal menghapus"); }
  };

  const handleToggleActive = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/paymentMethode/${id}`, { isActive: newStatus });
      if (res.data.success) setPaymentMethods((prev) => prev.map((p) => p._id === id ? { ...p, isActive: newStatus } : p));
    } catch { alert("Gagal mengubah status"); }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .pm-card { animation: fadeIn .25s ease-out; }
      `}</style>

      <div className="min-h-screen pb-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Payment Method</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola metode pembayaran yang tampil di kasir POS</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition shadow-sm">
              <Icon d={ICONS.refresh} size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button id="btn-add-payment-method" onClick={() => { setAddForm(EMPTY_FORM); setModalError(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:brightness-110" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              <Icon d={ICONS.plus} size={16} /> Tambah Method
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total"    value={total}    color="#2563eb" icon="credit" />
          <StatCard label="Aktif"    value={aktif}    color="#16a34a" icon="check"  />
          <StatCard label="Nonaktif" value={nonaktif} color="#dc2626" icon="close"  />
          <StatCard label="Digital"  value={digital}  color="#7c3aed" icon="wallet" />
        </div>

        {/* Group tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[{ id: "semua", label: "Semua Grup", color: "#374151" }, ...METHOD_GROUPS].map((g) => {
            const isActive = activeGroup === g.id;
            return (
              <button key={g.id} onClick={() => setActiveGroup(g.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border-2 transition-all" style={{ borderColor: isActive ? g.color : "#e5e7eb", background: isActive ? (g.bg || "#f3f4f6") : "white", color: isActive ? g.color : "#6b7280" }}>
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Icon d={ICONS.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="search-payment-method" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" placeholder="Cari nama, bank code, type code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap" style={{ background: activeFilter === f ? "#1e3a5f" : "white", color: activeFilter === f ? "white" : "#6b7280", borderColor: activeFilter === f ? "#1e3a5f" : "#e5e7eb" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse">
                <div className="h-1.5 bg-gray-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-3"><div className="w-11 h-11 rounded-xl bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-200 rounded w-1/2" /></div></div>
                  <div className="flex gap-1"><div className="h-5 bg-gray-200 rounded-full w-16" /><div className="h-5 bg-gray-200 rounded-full w-16" /></div>
                  <div className="h-2 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4"><Icon d={ICONS.close} size={28} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-800 mb-1">Gagal memuat data</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={fetchData} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Coba Lagi</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Icon d={ICONS.credit} size={28} className="text-gray-400" /></div>
            <h3 className="font-bold text-gray-700 mb-1">Tidak ada data</h3>
            <p className="text-sm text-gray-400">{search ? `Tidak ada hasil untuk "${search}"` : "Belum ada payment method"}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 font-medium">Menampilkan {filtered.length} dari {total} payment method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((pm) => (
                <div key={pm._id} className="pm-card">
                  <PaymentCard pm={pm} onEdit={openEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <Modal title="Edit Payment Method" subtitle={editTarget.name} onClose={() => setEditTarget(null)} onSave={handleEditSave} saving={modalSaving} error={modalError}>
          <MethodForm form={editForm} setForm={setEditForm} />
        </Modal>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Payment Method" subtitle="Isi detail metode pembayaran baru" onClose={() => setShowAdd(false)} onSave={handleAddSave} saving={modalSaving} error={modalError}>
          <MethodForm form={addForm} setForm={setAddForm} />
        </Modal>
      )}
    </>
  );
}
