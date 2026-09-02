import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorsList from './pages/donors/DonorsList';
import DonorDetail from './pages/donors/DonorDetail';
import DonationsList from './pages/donations/DonationsList';
import VolunteersList from './pages/volunteers/VolunteersList';
import VolunteerDetail from './pages/volunteers/VolunteerDetail';
import CampaignsList from './pages/campaigns/CampaignsList';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
