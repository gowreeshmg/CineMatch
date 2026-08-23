document.addEventListener('DOMContentLoaded', () => {

    // --- NAVIGATION LOGIC ---
    const navHome = document.getElementById('nav-home');
    const navEngine = document.getElementById('nav-engine');
    const homeView = document.getElementById('home-view');
    const engineView = document.getElementById('engine-view');

    function switchView(view) {
        if (view === 'home') {
            homeView.style.display = 'block';
            engineView.style.display = 'none';
            navHome.classList.remove('active');
            navEngine.classList.remove('active');
            navHome.classList.add('active');
        } else {
            homeView.style.display = 'none';
            engineView.style.display = 'block';
            navHome.classList.remove('active');
            navEngine.classList.remove('active');
            navEngine.classList.add('active');
        }
        window.scrollTo(0,0);
    }

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('home');
    });

    navEngine.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('engine');
    });

    // Initialize API endpoint
    let apiBaseUrl = "https://cinematch-obk9.onrender.com"; 

    const recommendBtn = document.getElementById('recommendBtn');
    const userSelect = document.getElementById('userSelect');
    const resultsContainer = document.getElementById('resultsContainer');

    // Populate the user dropdown
    if (userSelect) {
        userSelect.innerHTML = '<option value="">Loading profiles...</option>';
        
        async function loadUserProfiles() {
            try {
                const res = await fetch(`${apiBaseUrl}/users_preview`);
                if (!res.ok) throw new Error("Failed to load profiles");
                const favs = await res.json();
                
                userSelect.innerHTML = '';
                for (let i = 1; i <= 610; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    
                    // Clean up the title if it's too long, just for the dropdown
                    let movieTitle = favs[i] || "Unknown Movie";
                    if (movieTitle.length > 35) movieTitle = movieTitle.substring(0, 35) + "...";
                    
                    opt.textContent = `User Profile #${i} (who likes ${movieTitle})`;
                    if (i === 101) opt.selected = true;
                    userSelect.appendChild(opt);
                }
            } catch (err) {
                console.error(err);
                userSelect.innerHTML = '<option value="101">User Profile #101 (Offline Mode)</option>';
            }
        }
        
        loadUserProfiles();
    }

    // Fetch movie posters from Cinemeta
    async function getCinemetaPoster(movieTitle) {
        try {
            const cleanTitle = movieTitle.replace(/\s\(\d{4}\)$/, '').trim();
            const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(cleanTitle)}.json`);
            const data = await res.json();
            
            if (data && data.metas && data.metas.length > 0 && data.metas[0].poster) {
                return data.metas[0].poster;
            }
        } catch (e) {
            console.error("Poster fetch failed", movieTitle);
        }
        return `https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`;
    }

    recommendBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        
        resultsContainer.innerHTML = '';
        recommendBtn.innerHTML = '<span style="opacity: 0.7;">Loading...</span>';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            const favMovieHtml = `<h3 style="grid-column: 1/-1; text-align: center; margin-bottom: 1rem; color: var(--accent-secondary);">Because you loved <i>"${data.favorite_movie}"</i>, we recommend:</h3>`;
            resultsContainer.innerHTML = favMovieHtml;

            await Promise.all(data.recommendations.map(async (movie, index) => {
                const imgUrl = await getCinemetaPoster(movie.title);
                const matchPercent = ((movie.match / 5.0) * 100).toFixed(1) + "%";
                const formattedGenre = (movie.genre || "Unknown").replace(/\|/g, ', ');

                const card = document.createElement('div');
                card.className = 'rec-card';
                card.style.animationDelay = `${index * 0.1}s`;

                card.innerHTML = `
                    <img src="${imgUrl}" alt="${movie.title}" loading="lazy">
                    <div class="rec-details">
                        <div class="rec-title" title="${movie.title}">${movie.title}</div>
                        <div class="rec-genre">${formattedGenre}</div>
                        <div class="rec-match">${matchPercent} Match</div>
                    </div>
                `;
                
                resultsContainer.appendChild(card);
            }));

        } catch (error) {
            console.error("Error fetching recommendations:", error);
            resultsContainer.innerHTML = `<p style="color: #ef4444; text-align: center; grid-column: 1/-1; padding: 2rem;">Failed to connect to backend API.</p>`;
        } finally {
            recommendBtn.innerHTML = 'Generate Recommendations';
            recommendBtn.disabled = false;
        }
    });
});
