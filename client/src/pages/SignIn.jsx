import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import OAuth from '../components/OAuth';

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
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

      if (!res.ok) {
        throw new Error(data.message || 'Sign-in failed');
      }

      dispatch(signInSuccess(data));
      if (data.role === 'admin' || data.role === 'superadmin') {
        navigate('/admin/menu');
      } else {
        navigate('/');
      }
    } catch (err) {
      dispatch(signInFailure({ message: err.message }));
    }
  };

  return (
    <div className="min-h-screen bg-[#005429] flex items-center justify-center px-4">
      <div className="w-full max-w-md sm:max-w-sm md:max-w-md lg:max-w-lg px-6 bg-white shadow-xl border border-army/20 transform transition-all py-10 rounded-xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/baraja.png"
            alt="Logo"
            className="w-32 mx-auto md:w-40 lg:w-48"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-army/80"
            >
              Username or Email
            </label>
            <input
              type="text"
              id="identifier"
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-beige border border-army/30 
                     focus:outline-none focus:ring-2 focus:ring-army/50 transition-all"
              placeholder="Your username or email"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-army/80"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-beige border border-army/30 
                     focus:outline-none focus:ring-2 focus:ring-army/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-army text-army py-2 rounded-lg uppercase font-semibold tracking-wider 
                   hover:bg-army-dark hover:text-white transition-all 
                   disabled:opacity-80 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-army/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-beige px-2 text-army/70">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <OAuth />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-army/80">
          Don't have an account?{" "}
          <Link
            to="/sign-up"
            className="font-medium text-army hover:text-army-dark hover:underline transition-colors"
          >
            Create account
          </Link>
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center text-sm">
            {typeof error === "object"
              ? error.message || "Something went wrong!"
              : error}
          </div>
        )}
      </div>
    </div>

  );
}