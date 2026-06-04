import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  isRead: string;
  createdAt: Date;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Determine the WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}`;

    const newSocket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Connection event
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected:', newSocket.id);
      setIsConnected(true);

      // Authenticate with server
      newSocket.emit('authenticate', user.id);
    });

    // Receive notification event
    newSocket.on('notification', (notification: Notification) => {
      console.log('[WebSocket] Received notification:', notification);
      setNotifications((prev) => [notification, ...prev]);

      // Show toast based on priority
      const toastOptions = {
        low: { description: notification.message },
        normal: { description: notification.message },
        high: { description: notification.message },
        critical: { description: notification.message },
      };

      const toastFn = notification.priority === 'critical' ? toast.error : toast.info;
      toastFn(notification.title, toastOptions[notification.priority]);
    });

    // Disconnect event
    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    // Error event
    newSocket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // Test event for debugging
    newSocket.on('test-response', (data) => {
      console.log('[WebSocket] Test response:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: 'true' } : n
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => n.isRead === 'false').length;

  const value: WebSocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
