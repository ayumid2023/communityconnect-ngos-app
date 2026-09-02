import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Calendar, Clock, 
  Edit, Trash2, Plus, CheckCircle, XCircle 
} from 'lucide-react';
import api from '../../services/api';

export default function VolunteerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    task: '',
    description: '',
    dueDate: '',
    hours: ''
  });

  useEffect(() => {
    fetchVolunteerData();
  }, [id]);

  const fetchVolunteerData = async () => {
    try {
      const response = await api.get(`/volunteers/${id}`);
      setVolunteer(response.data);
      setEditForm({
        skills: response.data.skills || [],
        status: response.data.status,
        notes: response.data.notes || '',
        availability: response.data.availability || {}
      });
    } catch (error) {
      console.error('Error fetching volunteer:', error);
      if (error.response?.status === 404) {
        navigate('/volunteers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/volunteers/${id}`, editForm);
      setVolunteer({ ...volunteer, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating volunteer:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this volunteer?')) {
      try {
        await api.delete(`/volunteers/${id}`);
        navigate('/volunteers');
      } catch (error) {
        console.error('Error deleting volunteer:', error);
      }
    }
  };

  const handleAssign = async () => {
    try {
      await api.post(`/volunteers/${id}/assign`, assignmentForm);
      setShowAssignForm(false);
      setAssignmentForm({ task: '', description: '', dueDate: '', hours: '' });
      fetchVolunteerData();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleLogHours = async (assignmentId, hours) => {
    try {
      await api.post(`/volunteers/${id}/log-hours`, { assignmentId, hours });
      fetchVolunteerData();
    } catch (error) {
      console.error('Error logging hours:', error);
    }
  };

  const getInitials = () => {
    const first = volunteer?.userId?.profile?.firstName?.[0] || '';
    const last = volunteer?.userId?.profile?.lastName?.[0] || '';
    return (first + last).toUpperCase() || volunteer?.userId?.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Volunteer not found</p>
        <Link to="/volunteers" className="text-primary-600 hover:underline mt-2 inline-block">
          Return to volunteers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/volunteers" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Volunteer Profile</h1>
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
            Remove
          </button>
        </div>
      </div>

      {/* Volunteer Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
            {getInitials()}
          </div>
          <div className="ml-6 flex-1">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">
                {volunteer.userId?.profile?.firstName} {volunteer.userId?.profile?.lastName}
              </h2>
              <span
                className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                  volunteer.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : volunteer.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {volunteer.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                {volunteer.userId?.email}
              </span>
              {volunteer.userId?.profile?.phone && (
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {volunteer.userId.profile.phone}
                </span>
              )}
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {volunteer.hoursWorked || 0} hours logged
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editForm.skills.join(', ')}
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="Enter skills separated by commas"
                className="input-field text-sm"
              />
              <button onClick={handleUpdate} className="btn-primary mt-2 text-sm">
                Save Skills
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {volunteer.skills?.length > 0 ? (
                volunteer.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No skills listed</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Assignments</h3>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="btn-primary text-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assign Task
          </button>
        </div>

        {showAssignForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={assignmentForm.task}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, task: e.target.value })}
                placeholder="Task name"
                className="input-field"
              />
              <input
                type="date"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
            <textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              placeholder="Task description"
              className="input-field mt-2"
              rows="2"
            />
            <div className="flex mt-2 space-x-2">
              <button onClick={handleAssign} className="btn-primary">
                Assign
              </button>
              <button
                onClick={() => setShowAssignForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {volunteer.assignments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {volunteer.assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium">{assignment.task}</h4>
                  <p className="text-sm text-gray-500">{assignment.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>
                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                    </span>
                    {assignment.dueDate && (
                      <span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span>Status: {assignment.status}</span>
                    {assignment.hoursCompleted > 0 && (
                      <span className="text-purple-600">
                        {assignment.hoursCompleted} hours
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {assignment.status !== 'completed' && (
                    <button
                      onClick={() => {
                        const hours = prompt('Enter hours completed:');
                        if (hours) {
                          handleLogHours(assignment._id, parseFloat(hours));
                        }
                      }}
                      className="text-green-600 hover:text-green-700 text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Log Hours
                    </button>
                  )}
                  {assignment.status === 'completed' && (
                    <span className="text-green-600 text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
