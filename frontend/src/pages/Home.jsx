import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in: show login/register prompt
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4 tracking-tight">Welcome to UniLance</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl text-center">
          UniLance connects talented students with real-world freelance gigs. Sign in to discover opportunities, apply for jobs, and grow your career!
        </p>
        <div className="flex gap-4">
          <Link to="/login" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition">Login</Link>
          <Link to="/register" className="px-8 py-3 bg-white border border-blue-600 text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition">Register</Link>
        </div>
      </div>
    );
  }

  // Logged in: show catchy hero/benefits
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4 tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
      <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl text-center">
        Unlock your potential with UniLance. Browse gigs, connect with clients, and build your portfolio. <span className="text-blue-600 font-bold">Get started now!</span>
      </p>
      <div className="flex flex-wrap gap-6 justify-center mt-4">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center w-64">
          <img src="/public/hero-gigs.svg" alt="Gigs" className="w-20 h-20 mb-3" />
          <h2 className="font-bold text-blue-700 text-lg mb-1">Find Gigs</h2>
          <p className="text-gray-600 text-sm text-center">Explore a curated feed of freelance jobs tailored for students.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center w-64">
          <img src="/public/hero-connect.svg" alt="Connect" className="w-20 h-20 mb-3" />
          <h2 className="font-bold text-blue-700 text-lg mb-1">Connect & Chat</h2>
          <p className="text-gray-600 text-sm text-center">Message clients, discuss projects, and get instant notifications.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center w-64">
          <img src="/public/hero-growth.svg" alt="Growth" className="w-20 h-20 mb-3" />
          <h2 className="font-bold text-blue-700 text-lg mb-1">Grow Your Skills</h2>
          <p className="text-gray-600 text-sm text-center">Build your portfolio, earn money, and gain real-world experience.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
