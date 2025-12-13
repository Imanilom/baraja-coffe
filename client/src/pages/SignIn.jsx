import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import OAuth from '../components/OAuth';
import axios from 'axios';
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
      const res = await axios.get("/api/warehouses");

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
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      // 🔥 Logging response sebelum dipakai
      console.log("Response status:", res.status);
      console.log("Full response JSON:", data);

      // deklarasi di luar
      let w = null;

      if (!res.ok) {
        throw new Error(data.message || 'Sign-in failed');
      }

      dispatch(signInSuccess(data));
      if (
        data.role === 'superadmin' ||
        data.role === 'admin' ||
        data.role === 'akuntan' ||
        data.role === 'marketing' ||
        data.role === 'hrd' ||
        data.role === 'gro' ||
        data.role === 'inventory' ||
        data.role === 'cashier senior'
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
      dispatch(signInFailure({ message: err.message }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">

        {/* Left Side (Illustration) */}
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center">
          <img
            src="https://barajacoffee.com/assets/images/intro-video-bg.jpg"
            alt="Illustration"
            className="w-full h-full object-cover"
          />
        </div>


        {/* Right Side (Form) */}
        <div className="w-full md:w-1/2 p-10">
          <div className="mb-8">
            <img src="/images/baraja.png" alt="Logo" className="w-32" />
          </div>
          <>
            <h2 className="text-2xl font-bold mb-2">Welcome Back :)</h2>
            <p className="text-gray-500 mb-6 text-sm">
              To keep connected with us please login with your personal information by email address and password 🔒
            </p>

            <form onSubmit={handleSubmitLogin} className="space-y-5">
              <div>
                <input
                  type="text"
                  id="identifier"
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
                />
              </div>
              <div>
                <input
                  type="password"
                  id="password"
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-900 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-70"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                {typeof error === "object"
                  ? error.message || "Something went wrong!"
                  : error}
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
}