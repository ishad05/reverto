const grid = document.getElementById("listingGrid");

listings.forEach(item => {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-image"></div>
    <div class="card-body">
      <span>${item.type}</span>
      <h3>${item.title}</h3>
      <p>${item.quantity}</p>
      <p>📍 ${item.distance}</p>

      <div class="card-footer">
        <strong>${item.price}</strong>
        <button>View details</button>
      </div>
    </div>
  `;

  grid.appendChild(card);
});