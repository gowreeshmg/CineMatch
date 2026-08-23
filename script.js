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

        // Clear previous results
        resultsContainer.innerHTML = '';

        // Add loading state
        recommendBtn.innerHTML = '<span style="opacity: 0.7;">Generating AI Predictions...</span>';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            data.recommendations.forEach((movie, index) => {
                const card = document.createElement('div');
                card.className = 'rec-card';
                card.style.animationDelay = `${index * 0.15}s`;
                
                // GENERATING ACTUAL POSTERS VIA AI
                // We use pollinations.ai to generate a cinematic movie poster on the fly using the movie title!
                const encodedTitle = encodeURIComponent(`Cinematic movie poster for ${movie.title}`);
                const imgUrl = `https://image.pollinations.ai/prompt/${encodedTitle}?width=300&height=450&nologo=true`;
                
                const matchPercent = ((movie.match / 5.0) * 100).toFixed(1) + "%";

                card.innerHTML = `
                    <img src="${imgUrl}" alt="${movie.title}" loading="lazy">
                    <div class="rec-details">
                        <div class="rec-title" title="${movie.title}">${movie.title}</div>
                        <div class="rec-match">${matchPercent} Match</div>
                    </div>
                `;
                
                resultsContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Error fetching recommendations:", error);
            resultsContainer.innerHTML = `<p style="color: #ef4444; text-align: center; grid-column: 1/-1; padding: 2rem;">Failed to connect to backend API.</p>`;
        } finally {
            recommendBtn.innerHTML = 'Generate For You';
            recommendBtn.disabled = false;
        }
    });
});
