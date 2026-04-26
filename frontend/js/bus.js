let user = null;

document.addEventListener('DOMContentLoaded', async () => {
  user = checkAuth(['bus_driver']);
  if (!user) return;

  loadMyRoutes();

  const addStoppageBtn = document.getElementById('add-stoppage-btn');
  const stoppagesContainer = document.getElementById('stoppages-container');
  const createRouteForm = document.getElementById('create-route-form');

  if (addStoppageBtn) {
    addStoppageBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'flex gap-2 stoppage-row';
      row.innerHTML = `
        <input type="text" class="form-control stoppage-name" placeholder="Stop Name" style="flex: 2;" required>
        <input type="time" class="form-control stoppage-time" style="flex: 1;" required>
        <button type="button" class="btn btn-outline btn-sm remove-stop-btn" style="color: var(--danger); border-color: var(--danger);">×</button>
      `;
      stoppagesContainer.appendChild(row);

      row.querySelector('.remove-stop-btn').addEventListener('click', () => row.remove());
    });
  }

  if (createRouteForm) {
    createRouteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const busId = document.getElementById('route-bus-id').value.trim();
      const source = document.getElementById('route-source').value.trim();
      const destination = document.getElementById('route-destination').value.trim();
      const travelDate = document.getElementById('route-date').value;
      const departureTime = document.getElementById('route-time').value;
      const fare = document.getElementById('route-fare').value;
      
      const stoppageRows = document.querySelectorAll('.stoppage-row');
      const stops = Array.from(stoppageRows).map(row => ({
        name: row.querySelector('.stoppage-name').value.trim(),
        arrivalTime: row.querySelector('.stoppage-time').value
      })).filter(s => s.name !== '');

      try {
        await fetchWithAuth('/bus/create-route', {
          method: 'POST',
          body: JSON.stringify({ busId, source, destination, stops, travelDate, departureTime, fare })
        });
        showToast('Route created successfully!', 'success');
        createRouteForm.reset();
        stoppagesContainer.innerHTML = '';
        loadMyRoutes();
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }
});

async function loadMyRoutes() {
  try {
    const routes = await fetchWithAuth('/bus/my-routes');
    const container = document.getElementById('routes-list');
    container.innerHTML = '';

    if (routes.length === 0) {
      container.innerHTML = '<p class="text-muted">No assigned routes found.</p>';
      return;
    }

    routes.forEach(route => {
      const busId = route.busId || 'Bus Route';
      const div = document.createElement('div');
      div.className = 'list-card';
      div.style.cursor = 'pointer';
      
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${busId} | ${route.source} to ${route.destination}</h4>
            <p>Bus ID: ${busId}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); loadManifest('${route._id}')">View Manifest</button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteRoute('${route._id}')">Delete</button>
          </div>
        </div>
        <div class="route-meta">
          <span>Date: ${new Date(route.travelDate).toLocaleDateString()}</span>
          <span>Time: ${route.departureTime}</span>
          <span>${route.availableSeats} seats left</span>
        </div>
      `;

      div.addEventListener('click', () => loadManifest(route._id));
      container.appendChild(div);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteRoute(routeId) {
  if (!confirm('Are you sure you want to delete this route? All bookings will be lost.')) return;

  try {
    await fetchWithAuth(`/bus/route/${routeId}`, { method: 'DELETE' });
    showToast('Route deleted successfully.', 'success');
    loadMyRoutes();
    document.getElementById('manifest-placeholder').classList.remove('hidden');
    document.getElementById('manifest-content').classList.add('hidden');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadManifest(routeId) {
  try {
    const data = await fetchWithAuth(`/bus/manifest/${routeId}`);
    
    document.getElementById('manifest-placeholder').classList.add('hidden');
    document.getElementById('manifest-content').classList.remove('hidden');

    document.getElementById('manifest-route-details').textContent = `${data.route.busId || 'Bus Route'} | ${data.route.source} to ${data.route.destination}`;
    document.getElementById('manifest-date').textContent = new Date(data.route.travelDate).toLocaleDateString();
    document.getElementById('manifest-time').textContent = data.route.departureTime;

    const tbody = document.getElementById('manifest-table-body');
    tbody.innerHTML = '';

    if (data.bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="padding: 1rem; text-align: center; color: var(--text-muted);">No passengers booked yet.</td></tr>';
      return;
    }

    data.bookings.forEach(booking => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';
      tr.innerHTML = `
        <td style="padding: 0.75rem;"><span class="badge badge-info">Seat ${booking.seatNumber}</span></td>
        <td style="padding: 0.75rem;">
          <div>${booking.passenger.name}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${booking.passenger.phoneNumber || 'No Phone'}</div>
        </td>
        <td style="padding: 0.75rem;">
          <div style="font-size: 0.85rem;">${booking.boardingPoint}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${booking.boardingTime}</div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    showToast(error.message, 'error');
  }
}
