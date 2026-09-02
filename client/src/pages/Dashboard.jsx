import { useState, useEffect } from 'react';
import { Users, DollarSign, UserPlus, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    donors: 0,
    donations: 0,
    volunteers: 0,
    revenue: 0,
    campaigns: 0,
    monthlyGrowth: 12,
  });
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donorsRes, donationsRes, volunteersRes, campaignsRes] = await Promise.all([
          api.get('/donors'),
          api.get('/donations'),
          api.get('/volunteers'),
          api.get('/campaigns'),
        ]);

        const donations = donationsRes.data;
        const totalRevenue = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

        setStats({
          donors: donorsRes.data.length,
          donations: donations.length,
          volunteers: volunteersRes.data.length,
          revenue: totalRevenue,
          campaigns: campaignsRes.data.length,
          monthlyGrowth: 12,
        });

        // Get recent 5 donations
        setRecentDonations(
          donations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        );
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statsCards = [
    { label: 'Total Donors', value: stats.donors, icon: Users, color: 'blue' },
    { label: 'Total Donations', value: stats.donations, icon: DollarSign, color: 'green' },
    { label: 'Active Volunteers', value: stats.volunteers, icon: UserPlus, color: 'purple' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'yellow' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">Last 30 days</span>
          <span className="flex items-center text-green-600 font-medium">
            <ArrowUp className="w-4 h-4 mr-1" />
            {stats.monthlyGrowth}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${color}-50`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Donations */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Donations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Donor</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No donations yet
                  </td>
                </tr>
              ) : (
                recentDonations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-100">
                    <td className="py-3">{donation.donorName}</td>
                    <td className="py-3 font-medium">${donation.amount}</td>
                    <td className="py-3">{donation.campaignId?.name || 'General'}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
