let user = null;
let currentRideId = null;
let socket = null;

document.addEventListener('DOMContentLoaded', async () => {
  user = checkAuth(['cab_driver']);
  if (!user) return;

  initSocket();
  loadRideHistory();
  loadAvailableRequests(); // Load initially

  const toggle = document.getElementById('availability-toggle');
  
  // Set initial state from user object (default false)
  toggle.checked = user.isAvailable || false;
  updateAvailabilityUI(toggle.checked);

  toggle.addEventListener('change', async (e) => {
    const isAvailable = e.target.checked;
    await updateAvailability(isAvailable);
  });

  document.getElementById('open-chat-btn').addEventListener('click', () => openModal('chat-modal'));
  document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
  document.getElementById('start-ride-btn').addEventListener('click', startRide);
  document.getElementById('complete-ride-btn').addEventListener('click', completeRide);
  document.getElementById('cancel-ride-btn').addEventListener('click', cancelRide);
});

function initSocket() {
  socket = io(SOCKET_URL);

  socket.on('receive-message', (data) => {
    appendMessage(data.senderName, data.message, 'other');
  });

  // Basic polling for requests for demo purposes
  // In a real app, socket would push new requests based on geofencing
  setInterval(() => {
    if (document.getElementById('availability-toggle').checked && !currentRideId) {
      loadAvailableRequests();
    }
  }, 5000);
}

async function updateAvailability(isAvailable) {
  try {
    await fetchWithAuth('/cab/availability', {
      method: 'PUT',
      body: JSON.stringify({ isAvailable })
    });

    updateAvailabilityUI(isAvailable);
    user = { ...user, isAvailable };
    sessionStorage.setItem('user', JSON.stringify(user));
    
    if (isAvailable) {
      loadAvailableRequests();
    } else {
      document.getElementById('requests-list').innerHTML = '<p class="text-muted">Go online to see requests...</p>';
    }

  } catch (error) {
    showToast('Failed to update availability', 'error');
    document.getElementById('availability-toggle').checked = !isAvailable;
  }
}

function updateAvailabilityUI(isAvailable) {
  const statusEl = document.getElementById('availability-status');
  if (isAvailable) {
    statusEl.textContent = 'ONLINE';
    statusEl.className = 'badge badge-success';
  } else {
    statusEl.textContent = 'OFFLINE';
    statusEl.className = 'badge badge-warning';
  }
}

async function loadAvailableRequests() {
  if (!document.getElementById('availability-toggle').checked || currentRideId) return;

  try {
    const rides = await fetchWithAuth('/cab/available');
    const container = document.getElementById('requests-list');
    
    if (rides.length === 0) {
      container.innerHTML = '<p class="text-muted">No open requests at the moment.</p>';
      return;
    }

    container.innerHTML = '';
    rides.forEach(ride => {
      const div = document.createElement('div');
      div.className = 'list-card';
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${ride.passenger.name}</h4>
            <p>Pickup: ${ride.pickupLocation.address}</p>
          </div>
          <span class="badge badge-info">₹${ride.fare}</span>
        </div>
        <div class="route-meta">
          <span>Drop: ${ride.dropLocation.address}</span>
          <span>Payment: Cash</span>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary w-full" onclick="acceptRide('${ride._id}')">Accept Ride</button>
          <button class="btn btn-outline w-full" onclick="rejectRide('${ride._id}')">Reject Ride</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

async function rejectRide(rideId) {
  try {
    await fetchWithAuth(`/cab/reject/${rideId}`, { method: 'POST' });
    showToast('Ride rejected.', 'info');
    loadAvailableRequests();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function acceptRide(rideId) {
  try {
    const ride = await fetchWithAuth(`/cab/accept/${rideId}`, { method: 'POST' });
    currentRideId = ride._id;
    
    // Join room & Notify passenger
    socket.emit('join-ride-room', currentRideId);
    socket.emit('ride-accepted', { rideId: currentRideId });

    showToast('Ride accepted. Coordinate with the passenger and head to the pickup point.', 'success');
    
    // Update UI
    document.getElementById('availability-toggle').checked = false;
    updateAvailabilityUI(false);
    user = { ...user, isAvailable: false };
    sessionStorage.setItem('user', JSON.stringify(user));
    document.getElementById('requests-list').innerHTML = '<p class="text-muted">You have an active ride.</p>';
    
    showActiveRidePanel(ride, 'accepted');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function showActiveRidePanel(ride, status) {
  const panel = document.getElementById('active-ride-panel');
  panel.classList.remove('hidden');

  document.getElementById('otp-section').classList.add('hidden');
  document.getElementById('open-chat-btn').classList.add('hidden');
  document.getElementById('complete-ride-btn').classList.add('hidden');
  document.getElementById('cancel-ride-btn').classList.add('hidden');

  document.getElementById('active-ride-details').innerHTML = `
    <p><strong>Source:</strong> ${ride.pickupLocation.address}</p>
    <p><strong>Destination:</strong> ${ride.dropLocation.address}</p>
    <p><strong>Fare:</strong> ₹${ride.fare} (Cash)</p>
  `;

  const passengerContainer = document.getElementById('passenger-details-container');
  if (ride.passenger) {
    document.getElementById('passenger-name-display').textContent = ride.passenger.name || 'Passenger';
    document.getElementById('passenger-phone-display').textContent = ride.passenger.phoneNumber || 'Not available';
    passengerContainer.classList.remove('hidden');
  } else {
    passengerContainer.classList.add('hidden');
  }

  if (status === 'accepted') {
    document.getElementById('otp-section').classList.remove('hidden');
    document.getElementById('open-chat-btn').classList.remove('hidden');
    document.getElementById('cancel-ride-btn').classList.remove('hidden');
  } else if (status === 'started') {
    document.getElementById('otp-section').classList.add('hidden');
    document.getElementById('complete-ride-btn').classList.remove('hidden');
    document.getElementById('cancel-ride-btn').classList.remove('hidden');
  }
}

async function startRide() {
  const otp = document.getElementById('otp-input').value;
  if (otp.length !== 4) return showToast('Enter 4 digit OTP', 'error');

  try {
    const ride = await fetchWithAuth(`/cab/start/${currentRideId}`, {
      method: 'POST',
      body: JSON.stringify({ otp })
    });

    socket.emit('ride-started', { rideId: currentRideId });
    showToast('Ride started!', 'success');
    showActiveRidePanel(ride, 'started');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function completeRide() {
  if (!confirm('Have you collected the cash?')) return;

  try {
    await fetchWithAuth(`/cab/complete/${currentRideId}`, { method: 'POST' });
    
    socket.emit('ride-completed', { rideId: currentRideId });
    showToast('Ride completed successfully.', 'success');
    
    // Reset UI
    currentRideId = null;
    user = { ...user, isAvailable: false };
    sessionStorage.setItem('user', JSON.stringify(user));
    document.getElementById('active-ride-panel').classList.add('hidden');
    document.getElementById('complete-ride-btn').classList.add('hidden');
    document.getElementById('cancel-ride-btn').classList.add('hidden');
    document.getElementById('open-chat-btn').classList.add('hidden');
    document.getElementById('passenger-details-container').classList.add('hidden');
    document.getElementById('chat-messages').innerHTML = '<div class="text-center text-muted" style="font-size: 0.8rem;">Chat is ephemeral and disappears after the ride.</div>';
    
    loadRideHistory();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cancelRide() {
  if (!confirm('Are you sure you want to cancel this ride?')) return;

  try {
    await fetchWithAuth(`/cab/cancel/${currentRideId}`, { method: 'POST' });
    
    socket.emit('ride-cancelled', { rideId: currentRideId });
    showToast('Ride cancelled.', 'info');
    
    // Reset UI
    currentRideId = null;
    user = { ...user, isAvailable: true };
    sessionStorage.setItem('user', JSON.stringify(user));
    document.getElementById('availability-toggle').checked = true;
    updateAvailabilityUI(true);
    
    document.getElementById('active-ride-panel').classList.add('hidden');
    document.getElementById('complete-ride-btn').classList.add('hidden');
    document.getElementById('cancel-ride-btn').classList.add('hidden');
    document.getElementById('open-chat-btn').classList.add('hidden');
    document.getElementById('passenger-details-container').classList.add('hidden');
    
    loadRideHistory();
    loadAvailableRequests();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || !currentRideId) return;

  appendMessage('You', message, 'self');
  socket.emit('send-message', {
    rideId: currentRideId,
    message,
    senderId: user.id,
    senderName: user.name
  });
  input.value = '';
}

function appendMessage(sender, text, type) {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${type}`;
  msgDiv.innerHTML = `<div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 2px;">${sender}</div><div>${text}</div>`;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

async function loadRideHistory() {
  try {
    const rides = await fetchWithAuth('/cab/history');
    const container = document.getElementById('ride-history-list');
    container.innerHTML = '';

    if (rides.length === 0) {
      container.innerHTML = '<p class="text-muted">No rides yet.</p>';
      return;
    }

    const activeRides = rides.filter(r => ['accepted', 'started'].includes(r.status));
    const historyRides = rides.filter(r => ['completed', 'cancelled'].includes(r.status));

    // Restore active ride if exists
    if (activeRides.length > 0 && !currentRideId) {
      const activeRide = activeRides[0];
      currentRideId = activeRide._id;
      
      socket.emit('join-ride-room', currentRideId);
      
      document.getElementById('availability-toggle').checked = false;
      updateAvailabilityUI(false);
      user = { ...user, isAvailable: false };
      sessionStorage.setItem('user', JSON.stringify(user));
      document.getElementById('requests-list').innerHTML = '<p class="text-muted">You have an active ride.</p>';
      
      showActiveRidePanel(activeRide, activeRide.status);
    }

    if (historyRides.length === 0) {
      container.innerHTML = '<p class="text-muted">No history yet.</p>';
      return;
    }

    historyRides.forEach(ride => {
      const div = document.createElement('div');
      div.className = 'list-card';
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${ride.pickupLocation.address} to ${ride.dropLocation.address}</h4>
            <p>Passenger: ${ride.passenger ? ride.passenger.name : 'N/A'}</p>
          </div>
          <span class="badge ${ride.status === 'completed' ? 'badge-success' : 'badge-warning'}">${ride.status.toUpperCase()}</span>
        </div>
        <div class="route-meta">
          <span>Fare: ₹${ride.fare}</span>
          <span>Payment: Cash</span>
          <span>${new Date(ride.createdAt).toLocaleString()}</span>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error(error);
  }
}
