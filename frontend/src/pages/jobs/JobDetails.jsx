import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IndianRupee, Calendar, MapPin, Briefcase, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Application Form State
    const [showApply, setShowApply] = useState(false);
    const [proposal, setProposal] = useState({
        proposalText: '',
        proposedPrice: '',
        estimatedDays: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await API.get(`/jobs/${id}`);
                setJob(res.data.job);
            } catch (err) {
                toast.error("Could not find this job.");
                navigate('/jobs');
            } finally {
                setLoading(false);
            }
        };
        
        const checkApplied = async () => {
            if (user?.role === 'worker') {
                try {
                    const res = await API.get(`/proposals/check-applied/${id}`);
                    setHasApplied(res.data.applied);
                } catch (err) {
                    console.error("Error checking application status");
                }
            }
        };
        
        fetchJob();
        checkApplied();
    }, [id, user]);

    const prevImage = () => {
        setCurrentImageIndex(prev => (prev === 0 ? (job?.images?.length || 1) - 1 : prev - 1));
    };

    const nextImage = () => {
        setCurrentImageIndex(prev => (prev === (job?.images?.length || 1) - 1 ? 0 : prev + 1));
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await API.post('/proposals/submit', {
                jobId: id,
                proposalText: proposal.proposalText,
                proposedPrice: proposal.proposedPrice,
                estimatedDays: proposal.estimatedDays
            });

            toast.success('Proposal submitted successfully!');
            setShowApply(false);
            setProposal({ proposalText: '', proposedPrice: '', estimatedDays: '' });
            setHasApplied(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit proposal');
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Job Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h1 className="text-3xl font-black text-gray-900 mb-4">{job.title}</h1>
                        <div className="flex flex-wrap gap-4 text-gray-500 mb-8">
                            <span className="flex items-center gap-1"><MapPin size={16}/> {job.college}</span>
                            <span className="flex items-center gap-1"><Briefcase size={16}/> {job.category}</span>
                            <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Image Gallery */}
                        {job.images && job.images.length > 0 && (
                            <div className="mb-8">
                                <div className="relative bg-gray-100 rounded-2xl overflow-hidden mb-4">
                                    <img 
                                        src={job.images[currentImageIndex]} 
                                        alt={`Job reference ${currentImageIndex + 1}`}
                                        className="w-full h-64 object-cover"
                                    />
                                    {job.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                {currentImageIndex + 1} / {job.images.length}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnails */}
                                {job.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {job.images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                                                    currentImageIndex === index ? 'border-blue-600' : 'border-gray-300'
                                                }`}
                                            >
                                                <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 mt-8">
                            <div className="flex-1">
                                <h2 className="text-lg font-bold mb-2">Description</h2>
                                <p className="text-gray-700 mb-4">{job.description}</p>
                                <h2 className="text-lg font-bold mb-2">Skills Required</h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {job.skills && job.skills.length > 0 ? job.skills.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{skill}</span>
                                    )) : <span className="text-gray-400">No skills listed</span>}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold mb-2">Budget & Timeline</h2>
                                <p className="text-gray-700 mb-2"><IndianRupee size={16}/> <span className="font-bold">{job.budget}</span></p>
                                <p className="text-gray-700 mb-2"><Calendar size={16}/> {job.timeline || 'Flexible'}</p>
                                <p className="text-gray-700 mb-2"><MapPin size={16}/> {job.college}</p>
                            </div>
                        </div>

                        {/* Apply Button/Form - Only for workers */}
                        {user?.role === 'worker' && !hasApplied && !showApply && (
                            <button
                                onClick={() => setShowApply(true)}
                                className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Send size={18}/> Apply for this Gig
                            </button>
                        )}

                        {/* Application Form */}
                        {user?.role === 'worker' && showApply && !hasApplied && (
                            <form onSubmit={handleApply} className="mt-8 bg-blue-50 p-6 rounded-2xl">
                                <h3 className="font-bold text-lg mb-4">Submit Your Proposal</h3>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 mb-4"
                                    rows={4}
                                    placeholder="Describe why you're the best fit..."
                                    value={proposal.proposalText}
                                    onChange={e => setProposal({ ...proposal, proposalText: e.target.value })}
                                    required
                                />
                                <div className="flex gap-4 mb-4">
                                    <input
                                        type="number"
                                        className="flex-1 p-3 rounded-xl border border-gray-200"
                                        placeholder="Your Bid (₹)"
                                        value={proposal.proposedPrice}
                                        onChange={e => setProposal({ ...proposal, proposedPrice: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="flex-1 p-3 rounded-xl border border-gray-200"
                                        placeholder="Days to Complete"
                                        value={proposal.estimatedDays}
                                        onChange={e => setProposal({ ...proposal, estimatedDays: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                                        onClick={() => setShowApply(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Already Applied Message */}
                        {user?.role === 'worker' && hasApplied && (
                            <div className="mt-8 bg-green-50 text-green-700 p-4 rounded-xl font-bold text-center">
                                You have already applied for this gig.
                            </div>
                        )}
                        {/* If client, show info message */}
                        {user?.role === 'client' && (
                            <div className="mt-8 bg-yellow-50 text-yellow-700 p-4 rounded-xl font-bold text-center">
                                Clients cannot apply for gigs. Switch to a worker account to apply.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar (optional) */}
                <div className="space-y-6">
                    {/* ...other sidebar content... */}
                </div>
            </div>
        </div>
    );
};

export default JobDetails;