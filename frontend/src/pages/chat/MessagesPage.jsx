import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';
import { MessageSquare, Search, ArrowLeft, Clock } from 'lucide-react';

const MessagesPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const socketRef = useRef(null);

    // Initialize socket
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3000", {
                transports: ["websocket", "polling"],
            });
        }

        return () => {
            // Keep socket alive
        };
    }, []);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await API.get('/chat/conversations');
                console.log('Conversations:', res.data);
                
                // Group messages by jobId and create conversation list
                const convoMap = {};
                
                if (res.data.conversations && Array.isArray(res.data.conversations)) {
                    res.data.conversations.forEach(msg => {
                        if (!convoMap[msg.jobId]) {
                            convoMap[msg.jobId] = {
                                jobId: msg.jobId,
                                messages: [msg],
                                lastMessage: msg,
                                timestamp: msg.createdAt
                            };
                        } else {
                            convoMap[msg.jobId].messages.push(msg);
                            if (new Date(msg.createdAt) > new Date(convoMap[msg.jobId].timestamp)) {
                                convoMap[msg.jobId].lastMessage = msg;
                                convoMap[msg.jobId].timestamp = msg.createdAt;
                            }
                        }
                    });
                }

                // Sort by latest message
                const convos = Object.values(convoMap).sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                setConversations(convos);
            } catch (err) {
                console.error("Failed to load conversations", err);
                toast.error("Failed to load messages");
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    // Listen for new messages
    useEffect(() => {
        if (!socketRef.current) return;

        const handleNewMessage = (data) => {
            setConversations((prev) => {
                const existing = prev.find(c => c.jobId === data.room);
                if (existing) {
                    existing.lastMessage = data;
                    existing.timestamp = data.createdAt || new Date();
                    return [...prev.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))];
                }
                return [{
                    jobId: data.room,
                    messages: [data],
                    lastMessage: data,
                    timestamp: data.createdAt || new Date()
                }, ...prev];
            });
        };

        socketRef.current.on('receive_message', handleNewMessage);

        return () => {
            socketRef.current.off('receive_message', handleNewMessage);
        };
    }, []);

    const filteredConversations = conversations.filter(c => 
        c.lastMessage.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <MessageSquare size={50} className="mx-auto mb-4 text-blue-600 animate-bounce" />
                    <p className="text-gray-600 font-medium">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-black text-gray-900">Messages</h1>
                    </div>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="max-w-4xl mx-auto p-6">
                {filteredConversations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                        <MessageSquare size={60} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-500 mb-6">Start a conversation by hiring a freelancer</p>
                        <Link
                            to="/jobs"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredConversations.map((convo) => (
                            <ConversationItem
                                key={convo.jobId}
                                conversation={convo}
                                currentUser={user}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ConversationItem = ({ conversation, currentUser }) => {
    const lastMsg = conversation.lastMessage;
    const senderName = lastMsg.senderName;
    const isOwnMessage = lastMsg.senderId === currentUser?._id;
    
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <Link
            to={`/chat/${conversation.jobId}`}
            className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
        >
            {/* Avatar */}
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md">
                {senderName.charAt(0).toUpperCase()}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm">{senderName}</h3>
                <p className={`text-sm truncate ${isOwnMessage ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                    {isOwnMessage ? 'You: ' : ''}{lastMsg.text}
                </p>
            </div>

            {/* Time */}
            <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {timeAgo(lastMsg.createdAt)}
                </p>
                <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
        </Link>
    );
};

export default MessagesPage;
