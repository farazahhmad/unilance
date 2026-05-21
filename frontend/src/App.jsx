import Home from './pages/Home';
import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import JobFeed from './pages/jobs/JobFeed';
import JobDetails from './pages/jobs/JobDetails';
import CreateJob from './pages/jobs/CreateJob';
import Navbar from './components/common/Navbar';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import JobProposals from './pages/dashboard/JobProposals';
import WorkerDashboard from './pages/dashboard/WorkerDashboard';
import ChatPage from './pages/chat/ChatPage';
import MessagesPage from './pages/chat/MessagesPage';



const Dashboard = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'client') {
    return <ClientDashboard />;
  } else if (user?.role === 'worker') {
    return <WorkerDashboard />;
  } else {
    return <div className="p-10">Invalid role: {user?.role || 'undefined'}, User: {JSON.stringify(user)}</div>;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<JobFeed />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/create-job" element={<CreateJob />} />
          <Route path="/dashboard/proposals/:id" element={<JobProposals />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/chat/:roomId" element={<ChatPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;