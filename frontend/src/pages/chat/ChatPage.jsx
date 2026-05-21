import { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import { Send, CheckCircle } from 'lucide-react';

const ChatPage = () => {
    const { roomId } = useParams(); 
    const { user, loading: userLoading } = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();
    const socketRef = useRef(null);
    const listenerAttachedRef = useRef(false);

    // Initialize socket connection (run once)
    useEffect(() => {
        if (!socketRef.current) {
            console.log('Initializing socket connection...');
            socketRef.current = io("http://localhost:3000", {
                transports: ["websocket", "polling"],
            });
            
            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current.id);
                // When socket connects, setup listeners and join room
                setupSocketListeners();
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
                listenerAttachedRef.current = false;
            });
        }

        return () => {
            // Don't disconnect, just cleanup on unmount
        };
    }, []);

    // Setup socket listeners (only once per socket)
    const setupSocketListeners = () => {
        if (listenerAttachedRef.current || !socketRef.current || !roomId) {
            return;
        }
        
        console.log('Setting up socket listeners for room:', roomId);
        const socket = socketRef.current;
        
        // Join the room
        socket.emit("join_room", roomId);
        listenerAttachedRef.current = true;

        const handleReceiveMessage = (data) => {
            console.log('=== MESSAGE RECEIVED ===', data);
            
            setChatLog((prev) => {
                // Prevent duplicate messages by checking _id
                if (data._id && prev.some(msg => msg._id === data._id)) {
                    console.log('Duplicate message prevented');
                    return prev;
                }
                
                // If server sends back a message with _id, replace the optimistic one
                if (data._id) {
                    const hasOptimistic = prev.some(msg => 
                        msg.message === data.message && 
                        msg.senderId === data.senderId &&
                        !msg._id
                    );
                    if (hasOptimistic) {
                        console.log('Replacing optimistic message with DB version');
                        return prev.map(msg => 
                            msg.message === data.message && 
                            msg.senderId === data.senderId &&
                            !msg._id ? { ...data } : msg
                        );
                    }
                }
                
                return [...prev, data];
            });
        };

        socket.on("receive_message", handleReceiveMessage);
        console.log('receive_message listener attached');
    };

    // Load chat history when user is ready and roomId changes
    useEffect(() => {
        if (!userLoading && roomId) {
            const fetchHistory = async () => {
                try {
                    const res = await API.get(`/chat/history/${roomId}`);
                    console.log('Loaded chat history:', res.data.messages);
                    const history = res.data.messages.map(msg => ({
                        room: msg.jobId,
                        author: msg.senderName,
                        senderId: msg.senderId,
                        message: msg.text,
                        _id: msg._id,
                        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        createdAt: msg.createdAt
                    }));
                    setChatLog(history);
                } catch (err) {
                    console.error("Failed to load history", err);
                } finally {
                    setLoading(false);
                }
            };

            fetchHistory();
        }
    }, [roomId, userLoading]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog]);

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || !roomId) {
            console.warn('Cannot send message:', { 
                hasMessage: !!message.trim(), 
                hasRoomId: !!roomId,
                hasSocket: !!socketRef.current,
                hasUser: !!user
            });
            return;
        }

        const messageData = {
            room: roomId,
            author: user?.name || "User",
            senderId: user?._id,
            message: message.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        console.log('=== SENDING MESSAGE ===');
        console.log('Message data:', messageData);
        console.log('User ID:', user?._id);
        console.log('Socket connected:', socketRef.current?.connected);
        console.log('Socket ID:', socketRef.current?.id);
        
        // OPTIMISTIC UPDATE: Add message to local state immediately
        setChatLog((prev) => [...prev, messageData]);
        setMessage("");
        
        // Then emit to server - server will save to DB and broadcast to other clients
        socketRef.current.emit("send_message", messageData, (ack) => {
            console.log('Server acknowledgement:', ack);
        });
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-white bg-slate-900">Loading conversation...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md h-[700px] bg-black rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-gray-900 flex flex-col relative">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border border-white/30">
                        {user?.role === 'worker' ? 'C' : 'W'}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-white text-sm">Project Discussion</h2>
                        <p className="text-[10px] text-blue-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Encrypted & Secure
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa] custom-scrollbar">
                    {chatLog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Send size={40} className="mb-2 opacity-20" />
                            <p className="text-xs">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        chatLog.map((msg, index) => {
                            const isOwnMessage = msg.senderId === user?._id;
                            return (
                                <div key={index} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                                        isOwnMessage 
                                        ? "bg-blue-600 text-white rounded-br-none" 
                                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                                    }`}>
                                        {!isOwnMessage && (
                                            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1">
                                                {msg.author}
                                            </p>
                                        )}
                                        <p className="text-sm leading-relaxed">{msg.message}</p>
                                        <p className={`text-[9px] mt-1 text-right ${isOwnMessage ? "text-blue-100" : "text-gray-400"}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={sendMessage} className="flex flex-col gap-3">
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-full border border-gray-200 focus-within:border-blue-400 transition shadow-inner">
                            <input 
                                type="text" 
                                value={message}
                                placeholder="Write a message..."
                                className="flex-1 p-2 bg-transparent outline-none text-sm px-4"
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:scale-105 active:scale-95 transition shadow-md">
                                <Send size={18} />
                            </button>
                        </div>
                        
                        {user?.role === 'worker' && (
                            <button 
                                type="button"
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition uppercase tracking-widest shadow-lg"
                            >
                                <CheckCircle size={14}/> Mark as Delivered
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;