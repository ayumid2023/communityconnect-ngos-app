import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Users, DollarSign, Edit, Trash2, 
  Plus, Copy, Share2, TrendingUp
} from 'lucide-react';
import api from '../../services/api';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      const [campaignRes, donationsRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get('/donations', { params: { campaignId: id } })
      ]);
      setCampaign(campaignRes.data);
      setDonations(donationsRes.data);
      setEditForm(campaignRes.data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      if (error.response?.status === 404) {
        navigate('/campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/campaigns/${id}`, editForm);
      setCampaign({ ...campaign, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await api.delete(`/campaigns/${id}`);
        navigate('/campaigns');
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const progress = campaign?.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found</p>
        <Link to="/campaigns" className="text-primary-600 hover:underline mt-2 inline-block">
          Return to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/campaigns" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
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

      {/* Campaign Header */}
      {campaign.imageUrl && (
        <div className="rounded-lg overflow-hidden mb-6">
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {isEditing ? (
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Campaign description"
              />
            ) : (
              <p className="text-gray-600">{campaign.description || 'No description provided'}</p>
            )}
            {isEditing && (
              <button onClick={handleUpdate} className="btn-primary mt-3">
                Save Changes
              </button>
            )}
          </div>

          {/* Donations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Donations</h3>
            {donations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No donations yet</p>
            ) : (
              <div className="space-y-3">
                {donations.slice(0, 10).map((donation) => (
                  <div
                    key={donation._id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3"
                  >
                    <div>
                      <p className="font-medium">{donation.donorName}</p>
                      <p className="text-sm text-gray-500">{donation.donorEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">${donation.amount}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                ${campaign.raised.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                raised of ${campaign.goal.toLocaleString()}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium mt-2">{Math.round(progress)}%</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Donors</p>
                <p className="font-semibold">{campaign.donorCount || 0}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Status</p>
                <p className="font-semibold capitalize">{campaign.status}</p>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-medium text-gray-700 mb-3">Campaign Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Start Date</span>
                <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
              </div>
              {campaign.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t flex space-x-2">
              <button className="flex-1 btn-secondary text-sm flex items-center justify-center">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </button>
              <button className="flex-1 btn-secondary text-sm flex items-center justify-center">
                <Copy className="w-4 h-4 mr-1" />
                Embed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
