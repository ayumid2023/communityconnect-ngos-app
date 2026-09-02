import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, UserPlus, Clock, Award, Filter } from 'lucide-react';
import api from '../../services/api';

export default function VolunteersList() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [skills, setSkills] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  useEffect(() => {
    let filtered = volunteers;

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.userId?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.userId?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((v) => v.status === filterStatus);
    }

    if (filterSkill !== 'all') {
      filtered = filtered.filter((v) => v.skills?.includes(filterSkill));
    }

    setFilteredVolunteers(filtered);
  }, [searchTerm, filterStatus, filterSkill, volunteers]);

  const fetchVolunteers = async () => {
    try {
      const response = await api.get('/volunteers');
      setVolunteers(response.data);
      setFilteredVolunteers(response.data);

      // Extract unique skills
      const allSkills = new Set();
      response.data.forEach((v) => {
        v.skills?.forEach((skill) => allSkills.add(skill));
      });
      setSkills(Array.from(allSkills));
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getInitials = (volunteer) => {
    const first = volunteer.userId?.profile?.firstName?.[0] || '';
    const last = volunteer.userId?.profile?.lastName?.[0] || '';
    return (first + last).toUpperCase() || volunteer.userId?.email?.[0]?.toUpperCase() || '?';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Volunteers</h1>
        <button className="btn-primary flex items-center">
          <UserPlus className="w-4 h-4 mr-2" />
          Register Volunteer
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search volunteers..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="all">All Skills</option>
            {skills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500 ml-auto">
            {filteredVolunteers.length} volunteers
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No volunteers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.map((volunteer) => (
              <Link
                key={volunteer._id}
                to={`/volunteers/${volunteer._id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                      {getInitials(volunteer)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">
                        {volunteer.userId?.profile?.firstName}{' '}
                        {volunteer.userId?.profile?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{volunteer.userId?.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      volunteer.status
                    )}`}
                  >
                    {volunteer.status}
                  </span>
                </div>

                <div className="mt-3">
                  {volunteer.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {volunteer.hoursWorked || 0} hours
                  </span>
                  <span>
                    {volunteer.assignments?.length || 0} assignments
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
