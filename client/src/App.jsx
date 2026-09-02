import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Authentication Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Donor Pages
import DonorsList from './pages/donors/DonorsList';
import DonorDetail from './pages/donors/DonorDetail';

// Donation Pages
import DonationsList from './pages/donations/DonationsList';

// Volunteer Pages
import VolunteersList from './pages/volunteers/VolunteersList';
import VolunteerDetail from './pages/volunteers/VolunteerDetail';

// Campaign Pages
import CampaignsList from './pages/campaigns/CampaignsList';
import CampaignDetail from './pages/campaigns/CampaignDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />

            {/* Donors */}
            <Route path="donors" element={<DonorsList />} />
            <Route path="donors/:id" element={<DonorDetail />} />

            {/* Donations */}
            <Route path="donations" element={<DonationsList />} />

            {/* Volunteers */}
            <Route path="volunteers" element={<VolunteersList />} />
            <Route path="volunteers/:id" element={<VolunteerDetail />} />

            {/* Campaigns */}
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
