import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const useWebSocket = (assignmentId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const setProgressLog = useAssignmentStore((state) => state.setProgressLog);

  useEffect(() => {
    if (!assignmentId) return;

    console.log(`Connecting to socket server at ${SOCKET_URL} for room: ${assignmentId}`);

    // Connect to server
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      // Request to join the specific assignment updates channel
      socket.emit('join:assignment', assignmentId);
    });

    // Listen for status changes
    socket.on('assignment:status', (data: any) => {
      console.log('Received socket status update:', data);

      const { status, progress, error, assignment } = data;

      if (progress) {
        setProgressLog(progress);
      }

      // Update state in Zustand store
      if (status === 'completed' && assignment) {
        updateAssignmentStatus(assignmentId, 'completed', assignment);
      } else if (status === 'failed') {
        updateAssignmentStatus(assignmentId, 'failed', { error: error || 'Generation failed' });
      } else {
        updateAssignmentStatus(assignmentId, status);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socket) {
        console.log(`Leaving socket channel: ${assignmentId}`);
        socket.emit('leave:assignment', assignmentId);
        socket.disconnect();
      }
    };
  }, [assignmentId, updateAssignmentStatus, setProgressLog]);

  return socketRef.current;
};
