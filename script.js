const container = document.getElementById("anime-container");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const genreFilter = document.getElementById("genreFilter");
const sortOption = document.getElementById("sortOption");
const themeToggle = document.getElementById("themeToggle");
const loader = document.getElementById("loader");
const menuToggle = document.getElementById('menuToggle');
const menuOverlay = document.getElementById('menuOverlay');

let animeData = [];
let liked = new Set();

function showLoader() {
    if (loader) loader.setAttribute('aria-hidden', 'false');
}
function hideLoader() {
    if (loader) loader.setAttribute('aria-hidden', 'true');
}

// Safe getter for image URL with fallbacks
function getImageUrl(item){
    return (item.images && item.images.jpg && item.images.jpg.image_url) || item.image_url || '';
}

const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6b6b" font-size="20">No image</text></svg>`
);

// FETCH
async function fetchAnime(query=""){
    const url = query
        ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24`
        : "https://api.jikan.moe/v4/top/anime";

    showLoader();
    container.innerHTML = '';

    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        animeData = data.data || [];
        updateUI();
    }catch(err){
        console.error('Fetch error', err);
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center">Error loading data. Try again later.</p>`;
    }finally{
        hideLoader();
    }
}

// FILTER + SORT
function updateUI(){
    let list=[...animeData];

    if(genreFilter && genreFilter.value && genreFilter.value!=='all'){
        list = list.filter(a => a.genres && a.genres.some(g => g.name === genreFilter.value));
    }

    if(sortOption){
        if(sortOption.value === 'asc') list.sort((a,b)=> (a.score||0)-(b.score||0));
        if(sortOption.value === 'desc') list.sort((a,b)=> (b.score||0)-(a.score||0));
    }

    displayAnime(list);
}

// DISPLAY
function displayAnime(arr){
    container.innerHTML = '';

    if(!arr.length){
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center">No results found.</p>';
        return;
    }

    arr.forEach(a => {
        const card = document.createElement('article');
        card.className = 'anime-card';
        card.setAttribute('role','listitem');

        // Poster
        const posterWrap = document.createElement('div');
        posterWrap.className = 'poster-wrap';

        const img = document.createElement('img');
        img.alt = a.title || 'Anime poster';
        img.src = getImageUrl(a) || PLACEHOLDER_SVG;
        img.onerror = () => { img.src = PLACEHOLDER_SVG; };

        // Badges
        const scoreSpan = document.createElement('div');
        scoreSpan.className = 'badge';
        scoreSpan.textContent = `⭐ ${a.score ?? 'N/A'}`;

        const rankSpan = document.createElement('div');
        rankSpan.className = 'rank-badge';
        rankSpan.textContent = a.rank ? `#${a.rank}` : '';

        posterWrap.appendChild(img);
        posterWrap.appendChild(scoreSpan);
        if(rankSpan.textContent) posterWrap.appendChild(rankSpan);

        // Info
        const info = document.createElement('div');
        info.className = 'anime-info';

        const title = document.createElement('h3');
        title.textContent = a.title || 'Untitled';

        const synopsis = document.createElement('p');
        synopsis.textContent = a.synopsis ? (a.synopsis.length>140 ? a.synopsis.slice(0,137)+'…' : a.synopsis) : 'No synopsis available.';

        const actions = document.createElement('div');
        actions.className = 'anime-actions';

        const link = document.createElement('a');
        link.href = a.url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'View';

        const likeBtn = document.createElement('button');
        likeBtn.textContent = liked.has(a.mal_id) ? '❤️ Liked' : '🤍 Like';
        likeBtn.onclick = () => { toggleLike(a.mal_id); };

        actions.appendChild(link);
        actions.appendChild(likeBtn);

        info.appendChild(title);
        info.appendChild(synopsis);
        info.appendChild(actions);

        card.appendChild(posterWrap);
        card.appendChild(info);

        container.appendChild(card);
    });
}

// LIKE BUTTON
function toggleLike(id){
    if(!id) return;
    liked.has(id) ? liked.delete(id) : liked.add(id);
    updateUI();
}

// EVENTS (guard existence)
if(searchBtn) searchBtn.addEventListener('click', ()=> fetchAnime(searchInput.value.trim()));
if(searchInput) searchInput.addEventListener('keydown', e=> { if(e.key==='Enter') fetchAnime(searchInput.value.trim()); });
if(genreFilter) genreFilter.addEventListener('change', updateUI);
if(sortOption) sortOption.addEventListener('change', updateUI);
if(themeToggle) themeToggle.addEventListener('click', ()=> document.body.classList.toggle('light-mode'));

// MOBILE MENU: toggle and basic a11y
function openMenu(){
    document.body.classList.add('menu-open');
    if(menuToggle) menuToggle.setAttribute('aria-expanded','true');
    if(menuOverlay) menuOverlay.hidden = false;
}
function closeMenu(){
    document.body.classList.remove('menu-open');
    if(menuToggle) menuToggle.setAttribute('aria-expanded','false');
    if(menuOverlay) menuOverlay.hidden = true;
}

if(menuToggle){
    menuToggle.addEventListener('click', ()=>{
        const opened = document.body.classList.toggle('menu-open');
        menuToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
        if(menuOverlay) menuOverlay.hidden = !opened;
    });
}

if(menuOverlay){
    menuOverlay.addEventListener('click', closeMenu);
}

// Close menu on Escape key
document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && document.body.classList.contains('menu-open')){
        closeMenu();
    }
});

// Close menu when a control inside is activated (helpful on mobile)
const controls = document.querySelector('.controls');
if(controls){
    controls.addEventListener('click', (e)=>{
        // if a button or link inside controls was clicked, close menu
        if(document.body.classList.contains('menu-open') && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'SELECT')){
            // small delay so any control action still fires
            setTimeout(closeMenu, 120);
        }
    });
}

// INITIAL LOAD
fetchAnime();