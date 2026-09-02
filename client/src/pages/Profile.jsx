import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Save, Camera } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    address: user?.profile?.address || '',
    bio: user?.profile?.bio || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({ profile });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (passwordData.new !== passwordData.confirm) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.new.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordData.current, passwordData.new);
      setMessage('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const first = profile.firstName?.[0] || '';
    const last = profile.lastName?.[0] || '';
    return (first + last).toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mx-auto">
                {getInitials()}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              Role: {user?.role}
            </p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Member since:</span>{' '}
                {new Date(user?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4 mr-3" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4 mr-3" />
              Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {message && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 border border-green-200">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate}>
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input-field"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="input-field"
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio / About
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange}>
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="input-field"
                      required
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>At least 8 characters long</li>
                      <li>Contains at least one uppercase letter</li>
                      <li>Contains at least one lowercase letter</li>
                      <li>Contains at least one number</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
