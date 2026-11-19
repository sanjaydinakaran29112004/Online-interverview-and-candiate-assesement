import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseInterviewSocketProps {
  roomCode?: string;
  userId?: string;
  userName?: string;
  role?: string;
  enabled?: boolean;
}

export const useInterviewSocket = ({
  roomCode,
  userId,
  userName,
  role,
  enabled = true
}: UseInterviewSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== 'undefined' &&
     window.location.hostname !== 'localhost' &&
     window.location.hostname !== '127.0.0.1'
      ? window.location.origin
      : 'http://localhost:5000');

  useEffect(() => {
    if (!enabled || !roomCode) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', {
        roomCode,
        userId: userId || 'guest',
        userName: userName || 'Guest',
        role: role || 'CANDIDATE'
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room-users', data => {
      if (data.participants) {
        setParticipants(data.participants);
      }
    });

    socket.on('user-joined', data => {
      if (data.participants) {
        setParticipants(data.participants);
      }
    });

    socket.on('user-left', data => {
      if (data.participants) {
        setParticipants(data.participants);
      }
    });

    socket.on('chat-message', msg => {
      setChatMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, userId, userName, role, enabled]);

  const sendChatMessage = (message: string) => {
    if (!socketRef.current || !roomCode || !message.trim()) return;
    const msgId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    socketRef.current.emit('chat-message', {
      id: msgId,
      roomCode,
      message,
      senderName: userName || 'User',
      senderRole: role || 'CANDIDATE'
    });
  };

  return {
    socket: socketRef.current,
    isConnected,
    participants,
    chatMessages,
    sendChatMessage
  };
};
