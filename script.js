// Grab DOM elements (fallback: create container if missing)
let container = document.getElementById("anime-container");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

if (!container) {
    container = document.createElement("main");
    container.id = "anime-container";
    container.className = "anime-container";
    document.body.appendChild(container);
}

// Fetch anime data. If `query` provided, use search endpoint; otherwise show top anime.
async function fetchAnime(query) {
    const baseTop = "https://api.jikan.moe/v4/top/anime";
    const baseSearch = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query || "")}&&limit=24`;

    const url = query ? baseSearch : baseTop;

    try {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center">Loading...</p>';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        displayAnime(result.data || []);
    } catch (error) {
        console.error("Error fetching anime:", error);
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center">Error loading data. See console for details.</p>`;
    }
}

// Display fetched data into cards using classes from style.css
function displayAnime(animeList) {
    container.innerHTML = "";

    if (!animeList.length) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center">No results found.</p>';
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement("div");
        card.className = "anime-card";

        // Image
        const img = document.createElement("img");
        img.alt = anime.title || "Anime image";
        img.src = (anime.images && anime.images.jpg && anime.images.jpg.image_url) || (anime.image_url) || "";

        // Info
        const info = document.createElement("div");
        info.className = "anime-info";

        const title = document.createElement("h3");
        title.textContent = anime.title || "Untitled";

        const synopsis = document.createElement("p");
        synopsis.textContent = anime.synopsis ? truncate(anime.synopsis, 140) : "No synopsis available.";

        info.appendChild(title);
        info.appendChild(synopsis);

        if (img.src) card.appendChild(img);
        card.appendChild(info);
        container.appendChild(card);
    });
}

function truncate(str, n) {
    return str && str.length > n ? str.slice(0, n - 1) + '…' : str;
}

// Search handlers
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const q = searchInput ? searchInput.value.trim() : '';
        fetchAnime(q);
    });
}

if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = searchInput.value.trim();
            fetchAnime(q);
        }
    });
}

// Initial load: top anime
fetchAnime();