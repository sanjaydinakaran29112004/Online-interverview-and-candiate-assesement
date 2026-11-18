"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupInterviewSocket = void 0;
const setupInterviewSocket = (io) => {
    const rooms = {};
    io.on('connection', (socket) => {
        console.log(`[Socket Connected] ID: ${socket.id}`);
        // User joins interview room
        socket.on('join-room', ({ roomCode, userId, userName, role }) => {
            socket.join(roomCode);
            if (!rooms[roomCode]) {
                rooms[roomCode] = [];
            }
            // Remove existing socket for same user if reconnecting
            rooms[roomCode] = rooms[roomCode].filter(u => u.userId !== userId);
            const newUser = { socketId: socket.id, userId, userName, role };
            rooms[roomCode].push(newUser);
            console.log(`[Room ${roomCode}] ${userName} (${role}) joined. Total participants: ${rooms[roomCode].length}`);
            // Broadcast to existing room members that new peer arrived
            socket.to(roomCode).emit('user-joined', {
                socketId: socket.id,
                userId,
                userName,
                role,
                participants: rooms[roomCode]
            });
            // Send existing participants list to joining user
            socket.emit('room-users', {
                participants: rooms[roomCode]
            });
        });
        // WebRTC Signaling: Offer
        socket.on('offer', ({ targetSocketId, sdp }) => {
            io.to(targetSocketId).emit('offer', {
                senderSocketId: socket.id,
                sdp
            });
        });
        // WebRTC Signaling: Answer
        socket.on('answer', ({ targetSocketId, sdp }) => {
            io.to(targetSocketId).emit('answer', {
                senderSocketId: socket.id,
                sdp
            });
        });
        // WebRTC Signaling: ICE Candidate
        socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
            io.to(targetSocketId).emit('ice-candidate', {
                senderSocketId: socket.id,
                candidate
            });
        });
        // In-Interview Live Chat
        socket.on('chat-message', ({ roomCode, message, senderName, senderRole, timestamp }) => {
            io.in(roomCode).emit('chat-message', {
                senderId: socket.id,
                senderName,
                senderRole,
                message,
                timestamp: timestamp || new Date().toISOString()
            });
        });
        // Synchronized Question Control (Interviewer triggers next question for candidate)
        socket.on('push-question', ({ roomCode, question }) => {
            io.in(roomCode).emit('active-question-changed', {
                question
            });
        });
        // Participant recording consent change
        socket.on('consent-changed', ({ roomCode, userId, userName, consentGiven }) => {
            io.in(roomCode).emit('consent-updated', {
                userId,
                userName,
                consentGiven
            });
        });
        // Participant media toggle state (mute/camera off)
        socket.on('media-state-change', ({ roomCode, isMuted, isCameraOff }) => {
            socket.to(roomCode).emit('peer-media-state', {
                socketId: socket.id,
                isMuted,
                isCameraOff
            });
        });
        // Disconnect handling
        socket.on('disconnect', () => {
            for (const roomCode in rooms) {
                const foundIndex = rooms[roomCode].findIndex(u => u.socketId === socket.id);
                if (foundIndex !== -1) {
                    const departingUser = rooms[roomCode][foundIndex];
                    rooms[roomCode].splice(foundIndex, 1);
                    console.log(`[Room ${roomCode}] ${departingUser.userName} disconnected.`);
                    socket.to(roomCode).emit('user-left', {
                        socketId: socket.id,
                        userId: departingUser.userId,
                        userName: departingUser.userName,
                        participants: rooms[roomCode]
                    });
                    if (rooms[roomCode].length === 0) {
                        delete rooms[roomCode];
                    }
                    break;
                }
            }
        });
    });
};
exports.setupInterviewSocket = setupInterviewSocket;
