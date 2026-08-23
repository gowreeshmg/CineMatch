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
            navHome.classList.add('active');
            navEngine.classList.remove('active');
        } else {
            homeView.style.display = 'none';
            engineView.style.display = 'block';
            navHome.classList.remove('active');
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
    // Safely fetches official Wikipedia thumbnails instead of relying on blocked AI APIs
    async function getWikiPoster(movieTitle) {
        try {
            // Remove the year (e.g., "(1995)") to improve search accuracy
            const cleanTitle = movieTitle.replace(/\s\(\d{4}\)$/, '');
            
            // Query Wikipedia API for the page image
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
        
        // Fallback placeholder if Wikipedia doesn't have an image
        return `https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`;
    }

    // --- SVD RECOMMENDATION ENGINE ---
    
    // Live Backend Connection (Render.com)
    let apiBaseUrl = "https://cinematch-obk9.onrender.com"; 

    const recommendBtn = document.getElementById('recommendBtn');
    const userSelect = document.getElementById('userSelect');
    const resultsContainer = document.getElementById('resultsContainer');

    recommendBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        
        if (!userId || userId < 1 || userId > 610) {
            alert("Please enter a valid User ID between 1 and 610.");
            return;
        }

        resultsContainer.innerHTML = '';
        recommendBtn.innerHTML = '<span style="opacity: 0.7;">Predicting via SVD...</span>';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            // We use Promise.all to fetch all Wikipedia images in parallel
            await Promise.all(data.recommendations.map(async (movie, index) => {
                const imgUrl = await getWikiPoster(movie.title);
                const matchPercent = ((movie.match / 5.0) * 100).toFixed(1) + "%";
                
                // Format genres (replace pipes with spaces or commas)
                const formattedGenre = (movie.genre || "Unknown").replace(/\|/g, ', ');

                const card = document.createElement('div');
                card.className = 'rec-card';
                card.style.animationDelay = `${index * 0.15}s`;

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
            recommendBtn.innerHTML = 'Generate For You';
            recommendBtn.disabled = false;
        }
    });
});
