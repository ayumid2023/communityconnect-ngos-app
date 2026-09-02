import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Calendar, DollarSign, 
  Edit, Trash2, Download, Send, Clock 
} from 'lucide-react';
import api from '../../services/api';

export default function DonorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDonorData();
  }, [id]);

  const fetchDonorData = async () => {
    try {
      const [donorRes, donationsRes] = await Promise.all([
        api.get(`/donors/${id}`),
        api.get(`/donors/${id}/donations`)
      ]);
      setDonor(donorRes.data);
      setDonations(donationsRes.data);
      setEditForm(donorRes.data.profile || {});
    } catch (error) {
      console.error('Error fetching donor data:', error);
      if (error.response?.status === 404) {
        navigate('/donors');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/donors/${id}`, { profile: editForm });
      setDonor({ ...donor, profile: editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating donor:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await api.delete(`/donors/${id}`);
        navigate('/donors');
      } catch (error) {
        console.error('Error deleting donor:', error);
      }
    }
  };

  const getInitials = () => {
    const first = donor?.profile?.firstName?.[0] || '';
    const last = donor?.profile?.lastName?.[0] || '';
    return (first + last).toUpperCase() || donor?.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Donor not found</p>
        <Link to="/donors" className="text-primary-600 hover:underline mt-2 inline-block">
          Return to donors
        </Link>
      </div>
    );
  }

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const donationCount = donations.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/donors" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Donor Profile</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Donor Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
            {getInitials()}
          </div>
          <div className="ml-6 flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editForm.firstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    placeholder="First Name"
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={editForm.lastName || ''}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="input-field"
                  />
                </div>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Phone"
                  className="input-field"
                />
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Address"
                  className="input-field"
                />
                <button onClick={handleUpdate} className="btn-primary">
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  {donor.profile?.firstName} {donor.profile?.lastName}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {donor.email}
                  </span>
                  {donor.profile?.phone && (
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {donor.profile.phone}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(donor.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {donor.profile?.address && (
                  <p className="text-sm text-gray-500 mt-2">{donor.profile.address}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Total Donated</p>
            <p className="text-xl font-bold text-primary-600">${totalDonated.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Donation Count</p>
            <p className="text-xl font-bold">{donationCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Donation</p>
            <p className="text-xl font-bold">
              ${donationCount > 0 ? (totalDonated / donationCount).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Donation History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Donation History</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>

        {donations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No donations recorded for this donor</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-100">
                    <td className="py-3">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-medium">${donation.amount}</td>
                    <td className="py-3">{donation.campaignId?.name || 'General'}</td>
                    <td className="py-3 capitalize">{donation.paymentMethod}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donation.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : donation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
