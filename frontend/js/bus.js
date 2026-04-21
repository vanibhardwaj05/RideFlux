let user = null;

document.addEventListener('DOMContentLoaded', async () => {
  user = checkAuth(['bus_driver']);
  if (!user) return;

  loadMyRoutes();
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
      const busNumber = route.busNumber || 'Bus Route';
      const div = document.createElement('div');
      div.className = 'list-card';
      div.style.cursor = 'pointer';
      
      div.innerHTML = `
        <div class="list-card-header">
          <div>
            <h4>${busNumber} | ${route.source} to ${route.destination}</h4>
            <p>Bus Number: ${busNumber}</p>
          </div>
          <button class="btn btn-outline btn-sm">View Manifest</button>
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

async function loadManifest(routeId) {
  try {
    const data = await fetchWithAuth(`/bus/manifest/${routeId}`);
    
    document.getElementById('manifest-placeholder').classList.add('hidden');
    document.getElementById('manifest-content').classList.remove('hidden');

    document.getElementById('manifest-route-details').textContent = `${data.route.busNumber || 'Bus Route'} | ${data.route.source} to ${data.route.destination}`;
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
        <td style="padding: 0.75rem;">${booking.passenger.name}</td>
        <td style="padding: 0.75rem;">
          <span class="badge badge-warning" style="font-size: 0.7rem;">${booking.paymentMode}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    showToast(error.message, 'error');
  }
}
