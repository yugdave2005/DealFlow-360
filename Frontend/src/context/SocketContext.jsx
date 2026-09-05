import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? new URL(import.meta.env.VITE_API_BASE_URL).origin : 'http://localhost:5001');

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Event handlers for real-time reactivity
    s.on('QUOTATION_CREATED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    });

    s.on('QUOTATION_SUBMITTED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['managerDashboard'] });
    });

    s.on('APPROVAL_REQUESTED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['managerDashboard'] });
      toast.info(`New approval pending for ${data.quotationNumber} (${data.requiredRole})`);
    });

    s.on('APPROVAL_ACTIONED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      toast.success(data.message || `Quotation status updated to ${data.newStatus}`);
    });

    s.on('QUOTATION_SENT', (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', data.quotationId] });
    });

    s.on('QUOTATION_UPDATED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      if (data.message) {
        toast.info(data.message);
      }
    });

    s.on('QUOTATION_CONFIRMED', (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['customerQuotation', data.quotationId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillments'] });
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['operationsDashboard'] });
      toast.success(`🎉 Deal Confirmed! Order #${data.orderNumber || ''} created.`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || { socket: null, isConnected: false };
}
