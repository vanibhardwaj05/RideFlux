let user = null;
let currentRideId = null;
let socket = null;

document.addEventListener('DOMContentLoaded', async () => {
  user = checkAuth(['passenger']);
  if (!user) return;

  initSocket();
  loadAvailableCabs();
  loadRideHistory();

  // Tab switching logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content
      tabContents.forEach(content => {
        if (content.id === `${targetTab}-section`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });

      // Load data for the selected tab if needed
      if (targetTab === 'bus') {
        loadAvailableBuses();
      } else {
        loadAvailableCabs();
      }
    });
  });

  document.getElementById('book-cab-form').addEventListener('submit', handleBookCab);
  document.getElementById('search-bus-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loadAvailableBuses();
  });
  document.getElementById('refresh-cabs-btn').addEventListener('click', loadAvailableCabs);
  document.getElementById('refresh-buses-btn').addEventListener('click', loadAvailableBuses);
  document.getElementById('open-chat-btn').addEventListener('click', () => openModal('chat-modal'));
  document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);

  setInterval(() => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (activeTab === 'cab') {
      loadAvailableCabs();
    } else {
      loadAvailableBuses();
    }
  }, 15000);
});

// Helper to format currency consistently
function formatCurrency(amount) {
  return `₹${amount}`;
}

function initSocket() {
  socket = io(SOCKET_URL);

  socket.on('ride-status-update', async (data) => {
    updateRideUI(data.status);
    if (data.status === 'accepted') {
      // Fetch ride details to get OTP
      try {
        const ride = await fetchWithAuth(`/cab/${currentRideId}`);
        updateRideDetails(ride);
        document.getElementById('otp-display').classList.remove('hidden');
        document.querySelector('#otp-display span').textContent = ride.otp;
        document.getElementById('open-chat-btn').classList.remove('hidden');
        showToast('Driver accepted your ride!', 'success');
      } catch (err) {
        console.error(err);
      }
    } else if (data.status === 'started') {
      showToast('Ride started!', 'success');
      document.getElementById('otp-display').classList.add('hidden');
    } else if (data.status === 'completed') {
      showToast('Ride completed! Please pay Cash.', 'success');
      resetRideUI();
      loadRideHistory();
      loadAvailableCabs();
      closeModal('chat-modal');
    } else if (data.status === 'cancelled') {
      showToast('Ride was cancelled by the driver.', 'error');
      resetRideUI();
      loadRideHistory();
      loadAvailableCabs();
      closeModal('chat-modal');
    }
  });

  socket.on('receive-message', (data) => {
    appendMessage(data.senderName, data.message, 'other');
  });
}

async function handleBookCab(e) {
  e.preventDefault();
  const source = document.getElementById('cab-source').value.trim();
  const destination = document.getElementById('cab-destination').value.trim();

  if (!source || !destination) {
    return showToast('Enter both source and destination.', 'error');
  }

  const fare = calculateEstimatedFare(source, destination);

  try {
    const data = await fetchWithAuth('/cab/request', {
      method: 'POST',
      body: JSON.stringify({
        pickupLocation: { address: source },
        dropLocation: { address: destination },
        fare
      })
    });

    const availableDriversCount = data.availableDriversCount ?? data.nearbyDriversCount ?? 0;
    if (availableDriversCount === 0) {
      showToast('No cabs are online right now. Your request is saved and waiting for a driver.', 'warning');
    } else {
      showToast(`Cab request sent to ${availableDriversCount} available driver(s).`, 'success');
    }

    currentRideId = data.ride._id;
    socket.emit('join-ride-room', currentRideId);
    
    document.getElementById('active-ride-banner').classList.remove('hidden');
    updateRideDetails(data.ride);
    updateRideUI('searching');
    document.getElementById('book-cab-form').reset();

  } catch (error) {
    showToast(error.message, 'error');
  }
}

function calculateEstimatedFare(source, destination) {
  const src = source.toLowerCase();
  const dst = destination.toLowerCase();

  // Specific route pricing
  if ((src.includes('delhi') && dst.includes('patna')) || (src.includes('patna') && dst.includes('delhi'))) {
    return 890;
  }
  if ((src.includes('delhi') && dst.includes('lucknow')) || (src.includes('lucknow') && dst.includes('delhi'))) {
    return 445;
  }
  if ((src.includes('lucknow') && dst.includes('patna')) || (src.includes('patna') && dst.includes('lucknow'))) {
    return 445;
  }

  // Fallback formula
  const rawFare = 120 + (source.length * 6) + (destination.length * 8);
  return Math.max(150, Math.min(rawFare, 650));
}

function updateRideDetails(ride) {
  const details = [
    `From ${ride.pickupLocation.address} to ${ride.dropLocation.address}`,
    `Fare: ₹${ride.fare}`,
    `Payment: ${ride.paymentMode || 'Cash'}`,
    `ETA: 5 mins`
  ];

  document.getElementById('ride-details-text').textContent = details.join(' | ');

  const driverContainer = document.getElementById('driver-details-container');
  if (ride.driver) {
    document.getElementById('driver-name-display').textContent = ride.driver.name || 'N/A';
    document.getElementById('driver-phone-display').textContent = ride.driver.phoneNumber || 'Not available';
    document.getElementById('driver-vehicle-display').textContent = ride.driver.carNumber || 'Not assigned';
    driverContainer.classList.remove('hidden');
  } else {
    driverContainer.classList.add('hidden');
  }
}

function updateRideUI(status) {
  const statusText = document.getElementById('ride-status-text');
  switch(status) {
    case 'searching': statusText.textContent = 'Searching for driver...'; break;
    case 'accepted': statusText.textContent = 'Driver Accepted. Waiting for pickup.'; break;
    case 'started': statusText.textContent = 'Ride in progress.'; break;
    default: statusText.textContent = 'Searching for driver...';
  }
}

function resetRideUI() {
  currentRideId = null;
  document.getElementById('active-ride-banner').classList.add('hidden');
  document.getElementById('otp-display').classList.add('hidden');
  document.getElementById('open-chat-btn').classList.add('hidden');
  document.getElementById('driver-details-container').classList.add('hidden');
  document.getElementById('ride-details-text').textContent = 'Your current cab request will appear here.';
  document.getElementById('chat-messages').innerHTML = '<div class="text-center text-muted" style="font-size: 0.8rem;">Chat is ephemeral and disappears after the ride.</div>';
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

async function loadAvailableCabs() {
  try {
    const drivers = await fetchWithAuth('/cab/drivers');
    if (drivers.length === 0) {
      document.getElementById('cab-results').innerHTML = '<p class="text-muted">No cabs are online right now.</p>';
      return;
    }

    const cabContainer = document.getElementById('cab-results');
    cabContainer.innerHTML = '';

    drivers.forEach(driver => {
      const div = document.createElement('div');
      div.className = 'list-card';
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${driver.carNumber || 'Car Number Not Assigned'}</h4>
            <p>Driver: ${driver.name}</p>
          </div>
          <span class="badge badge-success">Online</span>
        </div>
        <div class="route-meta">
          <span>Phone: ${driver.phoneNumber || 'Not available'}</span>
          <span>Available for booking</span>
          <span>Payment: Cash</span>
        </div>
      `;
      cabContainer.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAvailableBuses() {
  try {
    const source = document.getElementById('bus-source').value.trim();
    const destination = document.getElementById('bus-destination').value.trim();
    
    const container = document.getElementById('bus-results');
    
    if (!source && !destination) {
      container.innerHTML = '<p class="text-muted">Enter source and destination to search for buses.</p>';
      return;
    }

    let url = '/bus/search';
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (destination) params.append('destination', destination);
    if (params.toString()) url += `?${params.toString()}`;

    const routes = await fetchWithAuth(url);
    container.innerHTML = '';

    if (routes.length === 0) {
      container.innerHTML = '<p class="text-muted">No route available.</p>';
      return;
    }

    routes.forEach(route => {
      const busNumber = route.busNumber || 'Bus Route';
      const div = document.createElement('div');
      div.className = 'list-card';
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${busNumber} | ${route.source} to ${route.destination}</h4>
            <p>Driver: ${(route.busDriver && route.busDriver.name) || 'Assigned Driver'}</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="bookBus('${route._id}')">Book Seat</button>
        </div>
        <div class="route-meta">
          <span>Departure: ${route.departureTime} on ${new Date(route.travelDate).toLocaleDateString()}</span>
          <span>Fare: ₹${route.fare}</span>
          <span>${route.availableSeats} seats left</span>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function bookBus(routeId) {
  const seatNumber = prompt('Enter a seat number (1-40):');
  if (!seatNumber) return;
  const parsedSeatNumber = parseInt(seatNumber, 10);

  if (Number.isNaN(parsedSeatNumber) || parsedSeatNumber < 1 || parsedSeatNumber > 40) {
    showToast('Enter a valid seat number between 1 and 40.', 'error');
    return;
  }

  try {
    await fetchWithAuth('/bus/book', {
      method: 'POST',
      body: JSON.stringify({ routeId, seatNumber: parsedSeatNumber })
    });
    showToast('Seat booked successfully! Please pay cash to the driver.', 'success');
    loadAvailableBuses();
  } catch (error) {
    showToast(error.message, 'error');
  }
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

    const activeRides = rides.filter(r => ['searching', 'accepted', 'started'].includes(r.status));
    const historyRides = rides.filter(r => ['completed', 'cancelled'].includes(r.status));

    // Restore active ride if it exists
    if (activeRides.length > 0 && !currentRideId) {
      const activeRide = activeRides[0];
      currentRideId = activeRide._id;
      socket.emit('join-ride-room', currentRideId);
      
      document.getElementById('active-ride-banner').classList.remove('hidden');
      updateRideDetails(activeRide);
      updateRideUI(activeRide.status);
      
      if (activeRide.status === 'accepted' || activeRide.status === 'started') {
        if (activeRide.status === 'accepted') {
          document.getElementById('otp-display').classList.remove('hidden');
          document.querySelector('#otp-display span').textContent = activeRide.otp || '****';
        }
        document.getElementById('open-chat-btn').classList.remove('hidden');
      }
    }

    if (historyRides.length === 0) {
      container.innerHTML = '<p class="text-muted">No history yet.</p>';
      return;
    }

    historyRides.forEach(ride => {
      const div = document.createElement('div');
      div.className = 'list-card';
      const statusClass = ride.status === 'completed' ? 'badge-success' : (ride.status === 'cancelled' ? 'badge-danger' : 'badge-warning');
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${ride.pickupLocation.address} to ${ride.dropLocation.address}</h4>
            <p>Driver: ${ride.driver ? ride.driver.name : 'Not assigned'}</p>
          </div>
          <span class="badge ${statusClass}">${ride.status.toUpperCase()}</span>
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
