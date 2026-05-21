// 1. Load env variables FIRST
require("dotenv").config();

// 2. Import app
const app = require("./src/app");

// 3. Import DB connection
const connectDB = require("./src/config/db");

const Message = require('./src/models/MessageModel'); // Import the model

// 4. Define PORT
const PORT = process.env.PORT || 5000;

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        console.log('Message received:', data);
        
        if (!data.room || !data.message) {
            console.error('Invalid message data:', data);
            socket.emit('error', { message: 'Invalid message format' });
            return;
        }

        // 1. Save to MongoDB
        try {
            const newMessage = new Message({
                jobId: data.room,
                senderId: data.senderId,
                senderName: data.author,
                text: data.message
            });
            const savedMessage = await newMessage.save();
            console.log('Message saved to DB:', savedMessage._id);

            // 2. Broadcast to everyone in the room (including sender)
            const messageWithTimestamp = {
                ...data,
                _id: savedMessage._id,
                createdAt: savedMessage.createdAt
            };
            console.log('Broadcasting to room:', data.room, messageWithTimestamp);
            io.to(data.room).emit('receive_message', messageWithTimestamp);
        } catch (err) {
            console.error("Message save failed:", err);
            socket.emit('error', { message: 'Failed to save message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// 5. Connect DB and Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// 6. Start server
startServer();

// 7. Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Only exit for critical errors, log and continue for non-critical ones
  if (error.code === "ERR_HTTP_REQUEST_TIMEOUT") {
    process.exit(1);
  }
});

// 8. Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Log but don't exit for unhandled rejections - let the server continue
});