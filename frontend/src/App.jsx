import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import Reports from './pages/Reports';
import AtsChecker from './pages/AtsChecker';
import CampaignRoom from './pages/CampaignRoom';
import CampaignSetup from './pages/CampaignSetup';
import HowItWorks from './pages/HowItWorks';
import InterviewTips from './pages/InterviewTips';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="setup" element={<InterviewSetup />} />
          <Route path="campaign-setup" element={<CampaignSetup />} />
          <Route path="ats" element={<AtsChecker />} />
          <Route path="room" element={<InterviewRoom />} />
          <Route path="campaign" element={<CampaignRoom />} />
          <Route path="reports" element={<Reports />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="interview-tips" element={<InterviewTips />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
