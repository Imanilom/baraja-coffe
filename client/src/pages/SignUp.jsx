import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';

export default function SignUp({ setIsLogin }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(false);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        console.error("Signup failed:", data.message || data); // tampilkan pesan error dari backend
        setError(true);
        return;
      }

      navigate('/sign-in');
    } catch (error) {
      setLoading(false);
      setError(true);
      console.error("Signup request error:", error); // tampilkan error dari fetch
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm">
          Join us and start your journey with Baraja Coffee ☕
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-900 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-70"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t"></div>
        <span className="px-4 text-gray-400 text-sm">Or continue with</span>
        <div className="flex-1 border-t"></div>
      </div>

      {/* Social Login */}
      <div className="flex justify-center gap-4">
        <OAuth />
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          onClick={() => setIsLogin(true)}
          className="text-green-900 hover:underline"
        >
          Sign In
        </button>
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
          Something went wrong! Please try again
        </div>
      )}
    </>
  );
}