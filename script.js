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

    // --- WIKIPEDIA POSTER FETCHER ---
    async function getWikiPoster(movieTitle) {
        try {
            let cleanTitle = movieTitle.replace(/\s\(\d{4}\)$/, '');
            // Handle MovieLens title formatting (e.g. "Godfather, The" -> "The Godfather")
            if (cleanTitle.endsWith(', The')) {
                cleanTitle = 'The ' + cleanTitle.slice(0, -5);
            } else if (cleanTitle.endsWith(', A')) {
                cleanTitle = 'A ' + cleanTitle.slice(0, -3);
            }

            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=pageimages&format=json&pithumbsize=400&origin=*`);
            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId !== "-1" && pages[pageId].thumbnail) {
                return pages[pageId].thumbnail.source;
            }
        } catch (e) {
            console.error("Wikipedia image fetch failed for", movieTitle);
        }
        return `https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`;
    }

    // Initialize Home Screen Posters
    const dynamicPosters = document.querySelectorAll('.dynamic-poster');
    dynamicPosters.forEach(async (imgElement) => {
        const title = imgElement.getAttribute('data-title');
        const imgUrl = await getWikiPoster(title);
        imgElement.src = imgUrl;
    });

    // --- SVD RECOMMENDATION ENGINE ---
    
    // Live Backend Connection (Render.com)
    let apiBaseUrl = "https://cinematch-obk9.onrender.com"; 

    const recommendBtn = document.getElementById('recommendBtn');
    const userSelect = document.getElementById('userSelect');
    const resultsContainer = document.getElementById('resultsContainer');

    recommendBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        
        resultsContainer.innerHTML = '';
        recommendBtn.innerHTML = '<span style="opacity: 0.7;">Predicting via SVD...</span>';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            await Promise.all(data.recommendations.map(async (movie, index) => {
                const imgUrl = await getWikiPoster(movie.title);
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
