
import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import JobCard from '../../components/jobs/JobCard';
import { Search, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const JobFeed = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await API.get('/jobs');
                setJobs(res.data.jobs);
            } catch (err) {
                console.error("Error fetching jobs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return <div className="p-10 text-center font-medium">Loading opportunities...</div>;

    // Only workers can see the feed
    if (!user || user.role !== 'worker') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <AlertTriangle size={48} className="text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                <p className="text-gray-600 mb-6">Only workers can view and apply for gigs. Please log in as a worker.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Search Header */}
            <div className="bg-white border-b border-gray-200 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Available Gigs</h1>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search for 'Logo Design', 'Web Dev'..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                        <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
                            <SlidersHorizontal size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Job Grid */}
            <div className="max-w-5xl mx-auto px-4 mt-10">
                {jobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {jobs.map(job => (
                            <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No jobs found. Be the first to post one!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobFeed;