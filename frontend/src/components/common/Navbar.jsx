import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import API from '../../api/axios';
import { LayoutGrid, PlusCircle, LogOut, User, MessageSquare } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    // Initialize socket and listen for new messages
    useEffect(() => {
        if (!socketRef.current && user) {
            socketRef.current = io("http://localhost:3000", {
                transports: ["websocket", "polling"],
            });

            socketRef.current.on('receive_message', (data) => {
                // Increment unread count when a new message arrives
                setUnreadCount(prev => prev + 1);
            });
        }

        return () => {
            // Keep socket alive
        };
    }, [user]);

    // Fetch initial unread count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await API.get('/chat/unread-count');
                setUnreadCount(res.data.unreadCount || 0);
            } catch (err) {
                console.error('Failed to fetch unread count', err);
            }
        };

        if (user) {
            fetchUnreadCount();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMessagesClick = () => {
        setUnreadCount(0); // Reset unread count when visiting messages
        navigate('/messages');
    };

    return (
        <nav className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter">
                    UniLance
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/jobs" className="flex items-center gap-1 text-gray-600 font-medium hover:text-blue-600 transition">
                        <LayoutGrid size={18} /> Feed
                    </Link>

                    {user ? (
                        <>
                            {user.role === 'client' && (
                                <Link to="/create-job" className="flex items-center gap-1 text-gray-600 font-medium hover:text-blue-600 transition">
                                    <PlusCircle size={18} /> Post Job
                                </Link>
                            )}

                            {/* Messages Icon with Notification */}
                            <button 
                                onClick={handleMessagesClick}
                                className="relative text-gray-600 hover:text-blue-600 transition group"
                                title="Messages"
                            >
                                <MessageSquare size={20} />
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </button>

                            <div className="h-6 w-px bg-gray-200"></div>

                            <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition">
                                <User size={14} /> {user.name.split(' ')[0]}
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${user.role === 'client' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role === 'client' ? 'Client' : 'Worker'}
                                </span>
                            </Link>
                            <button 
                                onClick={handleLogout} 
                                className="text-red-500 hover:text-red-700 transition"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;