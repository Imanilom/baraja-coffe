import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';

export default function SignUp() {
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
        setError(true);
        return;
      }
      navigate('/sign-in');
    } catch (error) {
      setLoading(false);
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-army/20 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-army mb-2">Baraja Coffee</h1>
          <p className="text-xl text-army/80">Create your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-army/80">Username</label>
            <input
              type="text"
              id="username"
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-beige border border-army/30 focus:outline-none focus:ring-2 focus:ring-army/50 transition-all"
              placeholder="Your preferred username"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-army/80">Email</label>
            <input
              type="email"
              id="email"
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-beige border border-army/30 focus:outline-none focus:ring-2 focus:ring-army/50 transition-all"
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-army/80">Password</label>
            <input
              type="password"
              id="password"
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-beige border border-army/30 focus:outline-none focus:ring-2 focus:ring-army/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-army text-beige py-3 rounded-lg uppercase font-semibold tracking-wider hover:bg-army-dark transition-all disabled:opacity-80 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-army/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-beige px-2 text-army/70">Or continue with</span>
            </div>
            <br />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <OAuth />
          </div>
        
        </div>

        <p className="mt-6 text-center text-sm text-army/80">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-army hover:text-army-dark hover:underline transition-colors">
            Sign in
          </Link>
        </p>

        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center text-sm">
            Something went wrong! Please try again
          </div>
        )}
      </div>
    </div>
  );
}