import { useSelector } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import api from '../lib/axios';

import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOut,
} from '../redux/user/userSlice';

export default function Profile() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const { currentUser, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    if (image) {
      handleFileUpload(image);
    }
  }, [image]);

  const handleFileUpload = async (image) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImagePercent(Math.round(progress));
      },
      (error) => {
        setImageError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, profilePicture: downloadURL })
        );
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Bangun payload dari data user yang ada, lalu timpa dengan perubahan
      const payload = {
        username: currentUser.username,
        email: currentUser.email,
        ...formData,
      };

      // Jangan kirim password kosong ke backend
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }

      // Jangan kirim jika tidak ada perubahan sama sekali
      if (Object.keys(formData).length === 0) {
        return;
      }

      dispatch(updateUserStart());
      // Gunakan endpoint /api/user/profile (bukan /api/user/:id yang hanya toggle isActive)
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("📦 Response Error Detail:", JSON.stringify(data, null, 2));

      if (!res.ok || data.success === false) {
        // Jika backend mengirim array errors dari express-validator, tampilkan error spesifik
        if (data.errors && data.errors.length > 0) {
          data.message = data.errors.map(err => err.msg || err.message).join(", ");
        }
        dispatch(updateUserFailure(data));
        return;
      }

      // Ekstrak user data dari response (bisa di root atau di .data)
      const userData = data._id ? data : (data.data?._id ? data.data : null);

      if (userData) {
        // Gabungkan response dengan data existing
        // PENTING: pertahankan token & role dari currentUser
        // karena backend tidak mengembalikan token dan role dikembalikan sebagai ID string
        const updatedUser = {
          ...currentUser,
          username: userData.username || currentUser.username,
          email: userData.email || currentUser.email,
          profilePicture: userData.profilePicture || currentUser.profilePicture,
          isActive: userData.isActive,
          // token dan role TIDAK ditimpa dari response backend
        };
        dispatch(updateUserSuccess(updatedUser));
      } else {
        // Response tidak mengandung data user, gunakan payload yang dikirim
        const updatedUser = {
          ...currentUser,
          ...payload,
        };
        // Hapus password dari state
        delete updatedUser.password;
        dispatch(updateUserSuccess(updatedUser));
      }
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        dispatch(deleteUserFailure(data));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error));
    }
  };

  const handleSignOut = async () => {
    try {
      await api.get('/auth/signout');
      dispatch(signOut());
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className='min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-8 relative font-["Inter",sans-serif] selection:bg-[#005429] selection:text-white'>
      {/* Enterprise-grade subtle top accent */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#005429]/[0.03] to-transparent pointer-events-none"></div>

      <div className='w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgb(0,0,0,0.03)] relative z-10 flex flex-col md:flex-row overflow-hidden transition-all duration-300 hover:shadow-[0_8px_50px_rgb(0,0,0,0.05)]'>
        
        {/* Left Panel: Profile Summary & Avatar */}
        <div className='w-full md:w-2/5 bg-slate-50/50 p-8 sm:p-12 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden'>
          {/* Decorative pattern for the left panel */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#005429]/5 rounded-bl-full pointer-events-none"></div>

          <div className="relative mb-6 group cursor-pointer" onClick={() => fileRef.current.click()}>
            <div className="relative w-36 h-36 rounded-full p-1 bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:border-[#005429]/30">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                <img
                  src={formData.profilePicture || currentUser.profilePicture}
                  alt='Profile Avatar'
                  className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
              </div>
              
              {/* Hover Edit Overlay */}
              <div className="absolute inset-1 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0F172A]/40 backdrop-blur-[2px]">
                <div className="bg-white/90 p-2 rounded-full shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#005429]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Upload Progress */}
              {imagePercent > 0 && imagePercent < 100 && (
                <div className="absolute inset-1 bg-white/80 rounded-full flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-[#005429] rounded-full animate-spin mb-1"></div>
                  <span className="text-[10px] font-bold text-[#005429]">{imagePercent}%</span>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-['Outfit',sans-serif] text-center mb-1">
            {currentUser.username || 'User'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-8 text-center px-4">
            {currentUser.email}
          </p>

          <div className="w-full space-y-3 mt-auto">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#005429] hover:border-slate-300 transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
          </div>
        </div>

        {/* Right Panel: Settings Form */}
        <div className='w-full md:w-3/5 p-8 sm:p-12 flex flex-col bg-white'>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Outfit',sans-serif] mb-2">Account Settings</h1>
            <p className="text-sm text-slate-500">Update your personal details and security credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-grow">
            <input
              type='file'
              ref={fileRef}
              hidden
              accept='image/*'
              onChange={(e) => setImage(e.target.files[0])}
            />

            <div className="grid grid-cols-1 gap-6">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-[#005429] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    defaultValue={currentUser.username}
                    type='text'
                    id='username'
                    placeholder='Enter your username'
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] transition-all text-sm placeholder:text-slate-400"
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-[#005429] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    defaultValue={currentUser.email}
                    type='email'
                    id='email'
                    placeholder='Enter your email'
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] transition-all text-sm placeholder:text-slate-400"
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-[#005429] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type='password'
                    id='password'
                    placeholder='Leave blank to keep current'
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] transition-all text-sm placeholder:text-slate-400"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            {(imageError || error || updateSuccess) && (
              <div className="mt-2">
                {imageError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Error uploading image (Max 2 MB)
                  </div>
                )}
                {error && !imageError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {typeof error === "object" ? error.message || "Something went wrong!" : error}
                  </div>
                )}
                {updateSuccess && (
                  <div className="p-3 bg-[#005429]/5 text-[#005429] rounded-xl text-sm border border-[#005429]/20 flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Profile updated successfully!
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Baraja Coffee System</span>
              <button
                type="submit"
                className="bg-[#005429] text-white py-3 px-8 rounded-xl font-semibold hover:bg-[#004220] hover:shadow-[0_8px_20px_-6px_rgba(0,84,41,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                disabled={loading || (imagePercent > 0 && imagePercent < 100)}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}