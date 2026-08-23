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

    // --- SVD RECOMMENDATION ENGINE ---
    
    // Live Backend Connection (Render.com)
    let apiBaseUrl = "https://cinematch-obk9.onrender.com"; 

    const recommendBtn = document.getElementById('recommendBtn');
    const userSelect = document.getElementById('userSelect');
    const resultsContainer = document.getElementById('resultsContainer');

    // Populate the dropdown with 610 users
    if (userSelect) {
        userSelect.innerHTML = '';
        for (let i = 1; i <= 610; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `User Profile #${i}`;
            if (i === 101) opt.selected = true;
            userSelect.appendChild(opt);
        }
    }

    recommendBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        
        resultsContainer.innerHTML = '';
        recommendBtn.innerHTML = '<span style="opacity: 0.7;">Predicting via SVD...</span>';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            // Show the user's real favorite movie returned from the backend!
            const favMovieHtml = `<h3 style="grid-column: 1/-1; text-align: center; margin-bottom: 1rem; color: var(--accent-secondary);">Because you loved <i>"${data.favorite_movie}"</i>, we recommend:</h3>`;
            resultsContainer.innerHTML = favMovieHtml;

            data.recommendations.forEach((movie, index) => {
                const matchPercent = ((movie.match / 5.0) * 100).toFixed(1) + "%";
                const formattedGenre = (movie.genre || "Unknown").replace(/\|/g, ', ');

                const card = document.createElement('div');
                card.className = 'rec-card no-image';
                card.style.animationDelay = `${index * 0.1}s`;

                // NO IMAGES FOR RECOMMENDATIONS, ONLY TEXT
                card.innerHTML = `
                    <div class="rec-details">
                        <div class="rec-title" title="${movie.title}">${movie.title}</div>
                        <div class="rec-genre">${formattedGenre}</div>
                        <div class="rec-match">${matchPercent} Match</div>
                    </div>
                `;
                
                resultsContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Error fetching recommendations:", error);
            resultsContainer.innerHTML = `<p style="color: #ef4444; text-align: center; grid-column: 1/-1; padding: 2rem;">Failed to connect to backend API.</p>`;
        } finally {
            recommendBtn.innerHTML = 'Generate Recommendations';
            recommendBtn.disabled = false;
        }
    });
});
