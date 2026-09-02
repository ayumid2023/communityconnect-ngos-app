import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Calendar } from 'lucide-react';
import api from '../../services/api';

export default function DonationsList() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = donations;

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.donorEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((d) => d.status === filterStatus);
    }

    if (filterCampaign !== 'all') {
      filtered = filtered.filter((d) => d.campaignId?._id === filterCampaign);
    }

    setFilteredDonations(filtered);
  }, [searchTerm, filterStatus, filterCampaign, donations]);

  const fetchData = async () => {
    try {
      const [donationsRes, campaignsRes] = await Promise.all([
        api.get('/donations'),
        api.get('/campaigns')
      ]);
      setDonations(donationsRes.data);
      setFilteredDonations(donationsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const totalAmount = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donations</h1>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Donation
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by donor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="input-field w-auto min-w-[160px]"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign._id} value={campaign._id}>
                {campaign.name}
              </option>
            ))}
          </select>

          <button className="btn-secondary flex items-center ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">
            Showing {filteredDonations.length} of {donations.length} donations
          </span>
          <span className="font-semibold">
            Total: ${totalAmount.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No donations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Donor</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{donation.donorName}</p>
                        <p className="text-xs text-gray-500">{donation.donorEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 font-semibold">${donation.amount}</td>
                    <td className="py-3">{donation.campaignId?.name || 'General'}</td>
                    <td className="py-3 capitalize">{donation.paymentMethod}</td>
                    <td className="py-3">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          donation.status
                        )}`}
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
