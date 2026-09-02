import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, DollarSign, Users, TrendingUp, Filter } from 'lucide-react';
import api from '../../services/api';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredCampaigns = filterStatus === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Campaigns</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <span className="text-sm text-gray-500">
            {filteredCampaigns.length} campaigns
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No campaigns found</p>
            <p className="text-sm">Create your first fundraising campaign</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => {
              const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
              return (
                <Link
                  key={campaign._id}
                  to={`/campaigns/${campaign._id}`}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                >
                  {campaign.imageUrl && (
                    <div className="h-40 -mx-6 -mt-6 rounded-t-lg overflow-hidden">
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {campaign.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">${campaign.raised.toLocaleString()}</span>
                        <span className="text-gray-500">raised of ${campaign.goal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {campaign.donorCount || 0} donors
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {campaign.endDate
                          ? `Ends ${new Date(campaign.endDate).toLocaleDateString()}`
                          : 'No end date'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
