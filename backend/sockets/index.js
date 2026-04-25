module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific ride room
    socket.on('join-ride-room', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`Socket ${socket.id} joined room ride_${rideId}`);
    });

    // Handle chat messages (ephemeral)
    socket.on('send-message', ({ rideId, message, senderId, senderName }) => {
      console.log(`Message from ${senderName} in ride_${rideId}: ${message.substring(0, 20)}...`);
      // Broadcast to everyone in the room except the sender
      socket.to(`ride_${rideId}`).emit('receive-message', {
        message,
        senderId,
        senderName,
        timestamp: new Date()
      });
    });

    // Handle ride status updates (notify passenger/driver)
    socket.on('ride-accepted', ({ rideId }) => {
      io.to(`ride_${rideId}`).emit('ride-status-update', { status: 'accepted' });
    });

    socket.on('ride-started', ({ rideId }) => {
      io.to(`ride_${rideId}`).emit('ride-status-update', { status: 'started' });
    });

    socket.on('ride-completed', ({ rideId }) => {
      io.to(`ride_${rideId}`).emit('ride-status-update', { status: 'completed' });
    });

    socket.on('ride-cancelled', ({ rideId }) => {
      io.to(`ride_${rideId}`).emit('ride-status-update', { status: 'cancelled' });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
