const Message = require('../models/MessageModel');

exports.getChatHistory = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        // Find messages for this specific job and sort them by time (oldest first)
        const messages = await Message.find({ jobId }).sort({ createdAt: 1 });
        
        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Failed to load messages" });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all messages where user is either sender or recipient
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { jobId: { $exists: true } } // Get all messages in jobs user is involved in
            ]
        })
        .sort({ createdAt: -1 })
        .lean();

        // Group messages by jobId and get the latest message per job
        const conversationMap = {};
        messages.forEach(msg => {
            const jobId = msg.jobId.toString();
            if (!conversationMap[jobId]) {
                conversationMap[jobId] = msg;
            }
        });

        const conversations = Object.values(conversationMap);

        res.status(200).json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Failed to load conversations" });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // For now, return 0 since we haven't implemented read/unread tracking
        // In a full implementation, you would track which messages each user has read
        res.status(200).json({
            success: true,
            unreadCount: 0
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Failed to get unread count" });
    }
};