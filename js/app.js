const gridEl = document.getElementById("grid");
const detailEl = document.getElementById("detail");

const modalEl = document.getElementById("detailModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");

// Debug (istersen sonra silebilirsin)
console.log("Modal elements:", modalEl, modalBackdrop, modalClose);

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const yearSelect = document.getElementById("yearSelect");

const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const showAllBtn = document.getElementById("showAllBtn");

const FAVORITES_KEY = "mediaFavorites";

let allItems = [];
let showingFavorites = false;

/* -------------------- Favorites -------------------- */
const getFavorites = () => {
  const raw = localStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
};

const isFavorite = (id) => getFavorites().includes(id);

const toggleFavorite = (id) => {
  const favs = getFavorites();
  const isAlreadyFavorite = favs.includes(id);

  const updated = isAlreadyFavorite
    ? favs.filter((x) => x !== id)
    : [...favs, id];

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

  if (isAlreadyFavorite) {
    alert("Film favorilerden çıkarıldı.");
  } else {
    alert("Film favorilere eklendi!");
  }
};


/* -------------------- Filters -------------------- */
const buildYearOptions = (items) => {
  yearSelect.innerHTML = `<option value="all">Yıl (Tümü)</option>`;
  const years = [...new Set(items.map((x) => x.year))].sort((a, b) => b - a);

  years.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSelect.appendChild(opt);
  });
};

const matchesFilters = (item) => {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categorySelect.value;
  const y = yearSelect.value;

  const okSearch = item.title.toLowerCase().includes(q);
  const okCat = cat === "all" || item.category === cat;
  const okYear = y === "all" || String(item.year) === y;

  return okSearch && okCat && okYear;
};

const currentList = () => {
  const base = showingFavorites ? allItems.filter((x) => isFavorite(x.id)) : allItems;
  return base.filter(matchesFilters);
};

/* -------------------- Modal helpers -------------------- */
const closeModal = () => {
  if (modalEl) modalEl.classList.add("hidden");
};

// Modal kapatma olayları (1 kez bağlanır)
if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
if (modalClose) modalClose.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* -------------------- UI Render -------------------- */
const renderGrid = () => {
  const items = currentList();
  gridEl.innerHTML = "";

  if (items.length === 0) {
    gridEl.innerHTML = `<p>Sonuç bulunamadı.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
  <div class="card-fav" data-id="${item.id}">
    ${isFavorite(item.id) ? "⭐" : "☆"}
  </div>

  <div class="poster-wrap">
    <img src="${item.poster}" alt="${item.title}">
  </div>

  <div class="pad">
    <div class="badge">${item.category} • ${item.year}</div>
    <div class="title">${item.title}</div>
    <div class="row">
      <span>⭐ ${item.rating}</span>
    </div>
  </div>
`;

const favBtn = card.querySelector(".card-fav");

favBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // ❗ popup'ı engeller
  toggleFavorite(item.id);
  renderGrid(); // ikon güncellensin
});


    card.addEventListener("click", () => {
      console.log("Karta tıklandı:", item.title);
      openDetail(item.id);
    });

    gridEl.appendChild(card);
  });
};

const openDetail = (id) => {
  const item = allItems.find((x) => x.id === id);
  if (!item) return;

  // ✅ Modal içi detay + poster
  detailEl.innerHTML = `
    <div class="detail-layout">
      <img
        class="detail-poster"
        src="${item.poster}"
        alt="${item.title}"
        onerror="this.src='assets/posters/no-image.jpg'"
      />

      <div class="detail-info">
        <h2>${item.title}</h2>
        <p><b>Tür:</b> ${item.category} | <b>Yıl:</b> ${item.year} | <b>Puan:</b> ⭐ ${item.rating}</p>
        <p>${item.summary}</p>
        <p><b>Oyuncular:</b> ${item.actors.join(", ")}</p>

        <button id="favBtn">
          ${isFavorite(item.id) ? "✗ Favorilerden Çıkar" : "🔥 Favorilere Ekle"}
        </button>
        <button id="closeBtn" class="secondary">Kapat</button>
      </div>
    </div>
  `;

  // ✅ Modal aç
  if (modalEl) modalEl.classList.remove("hidden");

  // Buton olayları
  document.getElementById("favBtn").addEventListener("click", () => {
    toggleFavorite(item.id);
    openDetail(item.id); // buton yazısı güncellensin
    renderGrid();        // kart üzerindeki favori durumu güncellensin
  });

  document.getElementById("closeBtn").addEventListener("click", closeModal);
};

/* -------------------- Events -------------------- */
const attachEvents = () => {
  searchInput.addEventListener("input", renderGrid);
  categorySelect.addEventListener("change", renderGrid);
  yearSelect.addEventListener("change", renderGrid);

  showFavoritesBtn.addEventListener("click", () => {
    showingFavorites = true;
    renderGrid();
  });

  showAllBtn.addEventListener("click", () => {
    showingFavorites = false;
    renderGrid();
  });
};

/* -------------------- Init -------------------- */
const init = async () => {
  try {
    console.log("Fetch başlıyor...");
    const res = await fetch("./data/movies.json");
    console.log("Status:", res.status);

    if (!res.ok) throw new Error(`movies.json bulunamadı! Status: ${res.status}`);

    const text = await res.text();
    console.log("İlk 30 karakter:", text.slice(0, 30));

    allItems = JSON.parse(text);
    console.log("Film sayısı:", allItems.length);

    buildYearOptions(allItems);
    attachEvents();
    renderGrid();
  } catch (err) {
    console.error("JSON okuma hatası:", err);
    gridEl.innerHTML = `<p>Hata: ${err.message}</p>`;
  }
};

init();
