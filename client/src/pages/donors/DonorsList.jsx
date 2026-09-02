import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function DonorsList() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDonors, setFilteredDonors] = useState([]);

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    const filtered = donors.filter(
      (donor) =>
        donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.profile?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.profile?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDonors(filtered);
  }, [searchTerm, donors]);

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors');
      setDonors(response.data);
      setFilteredDonors(response.data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (donor) => {
    const first = donor.profile?.firstName?.[0] || '';
    const last = donor.profile?.lastName?.[0] || '';
    return (first + last).toUpperCase() || donor.email[0].toUpperCase();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Donors</h1>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Donor
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredDonors.length} donors
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDonors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No donors found</p>
            <p className="text-sm">Start by adding your first donor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonors.map((donor) => (
              <Link
                key={donor._id}
                to={`/donors/${donor._id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {getInitials(donor)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">
                        {donor.profile?.firstName} {donor.profile?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{donor.email}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                  {donor.profile?.phone && (
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {donor.profile.phone}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {donor.email}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-500">
                    Joined {new Date(donor.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
