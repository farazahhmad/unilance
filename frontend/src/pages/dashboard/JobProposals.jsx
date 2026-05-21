import { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';
import { User, IndianRupee, Clock, CheckCircle, XCircle, MessageSquare, Star, Award } from 'lucide-react';

const JobProposals = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobDetails, setJobDetails] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, jobRes] = await Promise.all([
                    API.get(`/proposals/job/${id}`),
                    API.get(`/jobs/${id}`)
                ]);
                setProposals(propsRes.data.proposals);
                setJobDetails(jobRes.data.job);
            } catch (err) {
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAction = async (proposalId, action) => {
        try {
            if (action === 'accept') {
                await API.patch(`/proposals/${proposalId}/accept`);
                toast.success("Proposal accepted!");
            } else if (action === 'reject') {
                await API.patch(`/proposals/${proposalId}/reject`);
                toast.success("Proposal rejected!");
            }
            setProposals(proposals.map(p => p._id === proposalId ? { ...p, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : p));
        } catch (err) {
            toast.error("Action failed");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin text-blue-600 mb-4">
                    <Award size={40} />
                </div>
                <p className="text-gray-600 font-medium">Loading applicants...</p>
            </div>
        </div>
    );

    const pendingProposals = proposals.filter(p => p.status === 'PENDING');
    const acceptedProposals = proposals.filter(p => p.status === 'ACCEPTED');
    const rejectedProposals = proposals.filter(p => p.status === 'REJECTED');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-5xl font-black text-gray-900 mb-2">Review Applicants</h1>
                    <p className="text-gray-600 text-lg flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">{pendingProposals.length} Pending</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">{acceptedProposals.length} Accepted</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">{rejectedProposals.length} Rejected</span>
                    </p>
                </div>

                {proposals.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <User size={60} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No applicants yet</h3>
                        <p className="text-gray-500">Check back soon for proposals from skilled freelancers</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Pending Section */}
                        {pendingProposals.length > 0 && (
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    Pending Review ({pendingProposals.length})
                                </h2>
                                <div className="grid gap-4">
                                    {pendingProposals.map(p => (
                                        <ProposalCard 
                                            key={p._id} 
                                            proposal={p} 
                                            onAction={handleAction}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Accepted Section */}
                        {acceptedProposals.length > 0 && (
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    Hired ({acceptedProposals.length})
                                </h2>
                                <div className="grid gap-4">
                                    {acceptedProposals.map(p => (
                                        <ProposalCard 
                                            key={p._id} 
                                            proposal={p} 
                                            onAction={handleAction}
                                            status="accepted"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rejected Section */}
                        {rejectedProposals.length > 0 && (
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                    Rejected ({rejectedProposals.length})
                                </h2>
                                <div className="grid gap-4">
                                    {rejectedProposals.map(p => (
                                        <ProposalCard 
                                            key={p._id} 
                                            proposal={p} 
                                            onAction={handleAction}
                                            status="rejected"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProposalCard = ({ proposal, onAction, status }) => (
    <div className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-lg ${
        status === 'accepted' ? 'border-green-200 bg-green-50/30' :
        status === 'rejected' ? 'border-red-200 bg-red-50/30' :
        'border-blue-200'
    }`}>
        <div className="flex flex-col lg:flex-row justify-between gap-6">
            {/* Worker Info */}
            <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md">
                    {proposal.workerId.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900">{proposal.workerId.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{proposal.workerId.college}</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl italic border-l-4 border-blue-400">
                        "{proposal.proposalText}"
                    </p>
                </div>
            </div>

            {/* Proposal Details */}
            <div className="flex flex-col items-end justify-start lg:min-w-[250px]">
                <div className="text-right mb-4">
                    <div className="text-3xl font-black text-blue-600 flex items-center justify-end gap-1">
                        ₹{proposal.proposedPrice}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center justify-end gap-1 mt-1">
                        <Clock size={14} /> {proposal.estimatedDays} days
                    </p>
                </div>

                {/* Action Buttons */}
                {status === 'accepted' ? (
                    <div className="w-full space-y-2">
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-center text-sm">
                            ✓ HIRED
                        </div>
                        <Link
                            to={`/chat/${proposal.jobId}`}
                            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition text-sm"
                        >
                            <MessageSquare size={16} /> Message
                        </Link>
                    </div>
                ) : status === 'rejected' ? (
                    <div className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-center text-sm">
                        ✕ REJECTED
                    </div>
                ) : (
                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={() => onAction(proposal._id, 'accept')}
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition text-sm"
                        >
                            <CheckCircle size={16} /> Hire
                        </button>
                        <button 
                            onClick={() => onAction(proposal._id, 'reject')}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default JobProposals;
                                    