import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import OAuth from '../components/OAuth';
import api from '../lib/axios';
import SignUp from './SignUp';

export default function SignIn() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({});
  const [warehouse, setWarehouses] = useState({});
  const { loading, error } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/api/warehouses");

      setWarehouses(res.data.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());

      const res = await api.post('/api/auth/signin', formData);
      const data = res.data;

      // 🔥 Logging response sebelum dipakai
      // console.log("Response status:", res.status);
      // console.log("Full response JSON:", data);

      dispatch(signInSuccess(data));
      if (
        data.role === 'superadmin' ||
        data.role === 'admin' ||
        data.role === 'akuntan' ||
        data.role === 'marketing' ||
        data.role === 'hrd' ||
        data.role === 'gro' ||
        data.role === 'inventory' ||
        data.role === 'cashier senior' ||
        data.role === 'super kasir'
      ) {
        if (data.isActive === true) {
          if (data.role === "cashier senior") {
            navigate('/admin/menu');
          } else {
            navigate('/admin/dashboard');
          }
        } else {
          dispatch(signInFailure({ message: "User tidak aktif!" }))
        }
      } else {
        dispatch(signInFailure({ message: "User tidak memiliki Hak Akses!" }))
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Sign-in failed';
      dispatch(signInFailure({ message: errorMessage }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-['Inter',sans-serif]">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#005429] opacity-5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#005429] opacity-5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[1000px] bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col md:flex-row overflow-hidden border border-white m-4 relative z-10">

        {/* Left Side (Branding & Experience) */}
        <div className="hidden md:flex w-[45%] bg-[#005429] relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://barajacoffee.com/assets/images/intro-video-bg.jpg"
              alt="Context"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#005429] via-[#005429]/80 to-[#005429]/40"></div>

          <div className="relative z-10 p-12 text-center text-white">
            <div className="mb-8 flex justify-center">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <img src="/images/baraja.png" alt="Baraja Logo" className="w-24 brightness-0 invert" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Baraja Coffee</h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-[280px] mx-auto">
              Premium Coffee Experience. Manage your outlet with elegance and ease.
            </p>
          </div>

          {/* Glass Card Decoration */}
          <div className="absolute bottom-8 left-8 right-8 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-lg font-bold">B</span>
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-semibold">Integrasi Cloud</p>
              <p className="text-white/40 text-[10px]">v1.0.0 Stable</p>
            </div>
          </div>
        </div>

        {/* Right Side (Auth Form) */}
        <div className="w-full md:w-[55%] p-8 md:p-14 bg-white/40 flex flex-col justify-center">
          <div className="mb-10 block md:hidden">
            <img src="/images/baraja.png" alt="Logo" className="w-24 opacity-80" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#1e293b] mb-2 font-['Outfit',sans-serif]">Login</h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmitLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group relative">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[#005429]">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    id="identifier"
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="w-full bg-white/50 border border-slate-200 text-[#1e293b] px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#005429]/10 focus:border-[#005429] transition-all placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="group relative">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[#005429]">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-white/50 border border-slate-200 text-[#1e293b] px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#005429]/10 focus:border-[#005429] transition-all placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 bg-white text-[#005429] focus:ring-[#005429] focus:ring-offset-0" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#005429] text-white py-4 rounded-2xl font-bold hover:bg-[#007036] hover:shadow-[0_10px_25px_-5px_rgba(0,84,41,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider mt-2 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : "Sign In"}
            </button>

          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl text-xs flex items-center gap-3 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                {typeof error === "object" ? error.message || "Invalid credentials!" : error}
              </span>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              &copy; 2026 Baraja Coffee Premium Cloud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}