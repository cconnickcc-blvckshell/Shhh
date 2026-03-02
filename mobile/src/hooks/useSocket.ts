import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';

const WS_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

type MessageHandler = (data: any) => void;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => { /* connected */ });
    socket.on('disconnect', () => { /* disconnected */ });

    socketRef.current = socket;

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('leave_conversation', conversationId);
  }, []);

  const sendTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('stop_typing', { conversationId });
  }, []);

  const onNewMessage = useCallback((handler: MessageHandler) => {
    socketRef.current?.on('new_message', handler);
    return () => { socketRef.current?.off('new_message', handler); };
  }, []);

  const onNotification = useCallback((handler: MessageHandler) => {
    socketRef.current?.on('notification', handler);
    return () => { socketRef.current?.off('notification', handler); };
  }, []);

  const onTyping = useCallback((handler: MessageHandler) => {
    socketRef.current?.on('user_typing', handler);
    return () => { socketRef.current?.off('user_typing', handler); };
  }, []);

  const onAlbumShared = useCallback((handler: MessageHandler) => {
    socketRef.current?.on('album_shared', handler);
    return () => { socketRef.current?.off('album_shared', handler); };
  }, []);

  return {
    socket: socketRef.current,
    joinConversation, leaveConversation,
    sendTyping, stopTyping,
    onNewMessage, onNotification, onTyping, onAlbumShared,
  };
}
