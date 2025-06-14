import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOut,
} from '../redux/user/userSlice';
import ImageUploader from '../utils/uploadImage';

export default function Profile() {
  const dispatch = useDispatch();
  const { currentUser, loading, error } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    username: currentUser.username,
    email: currentUser.email,
    profilePicture: currentUser.profilePicture || '',
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateUserStart());
    try {
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (err) {
      dispatch(updateUserFailure(err));
    }
  };

  const handleDeleteAccount = async () => {
    dispatch(deleteUserStart());
    try {
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (err) {
      dispatch(deleteUserFailure(err));
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout');
      dispatch(signOut());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-3xl font-semibold text-center text-army my-7">Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ImageUploader
          currentImage={formData.profilePicture}
          onUploadSuccess={(url) => setFormData({ ...formData, profilePicture: url })}
        />

        <input
          type="text"
          id="username"
          value={formData.username}
          placeholder="Username"
          className="bg-beige-100 rounded-lg p-3 border border-army focus:outline-none focus:ring-2 focus:ring-army"
          onChange={handleChange}
        />
        <input
          type="email"
          id="email"
          value={formData.email}
          placeholder="Email"
          className="bg-beige-100 rounded-lg p-3 border border-army focus:outline-none focus:ring-2 focus:ring-army"
          onChange={handleChange}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          className="bg-beige-100 rounded-lg p-3 border border-army focus:outline-none focus:ring-2 focus:ring-army"
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-army text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Update'}
        </button>
      </form>

      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer" onClick={handleDeleteAccount}>
          Delete Account
        </span>
        <span className="text-red-700 cursor-pointer" onClick={handleSignOut}>
          Sign Out
        </span>
      </div>

      {error && <p className="text-red-700 mt-5">Something went wrong!</p>}
      {updateSuccess && <p className="text-green-700 mt-5">User updated successfully!</p>}
    </div>
  );
}
