document.addEventListener('DOMContentLoaded', () => {
    
    

    // 4. Live Backend Connection (Render.com)
    let apiBaseUrl = "https://cinematch-obk9.onrender.com"; 

    const recommendBtn = document.getElementById('recommendBtn');
    const userSelect = document.getElementById('userSelect');
    const resultsContainer = document.getElementById('resultsContainer');

    recommendBtn.addEventListener('click', async () => {
        const userId = userSelect.value;
        
        // Clear previous results
        resultsContainer.innerHTML = '';

        // Add loading state
        recommendBtn.innerText = 'Fetching live AI predictions from Render...';
        recommendBtn.disabled = true;

        try {
            const response = await fetch(`${apiBaseUrl}/recommend/${userId}`);
            
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            
            data.recommendations.forEach((movie, index) => {
                const card = document.createElement('div');
                card.className = 'rec-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                // Generic placeholder image since MovieLens doesn't provide posters
                const imgUrl = "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80";
                
                const matchPercent = ((movie.match / 5.0) * 100).toFixed(1) + "%";

                card.innerHTML = `
                    <img src="${imgUrl}" alt="${movie.title}">
                    <div class="rec-details">
                        <div class="rec-title" title="${movie.title}">${movie.title}</div>
                        <div class="rec-match">SVD Match: ${matchPercent}</div>
                    </div>
                `;
                
                resultsContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Error fetching recommendations:", error);
            resultsContainer.innerHTML = `<p style="color: #ef4444; text-align: center; width: 100%; padding-top: 20px;">Failed to connect to backend. Please ensure your Render API is deployed and the URL in script.js is correct!</p>`;
        } finally {
            recommendBtn.innerText = 'Generate Recommendations';
            recommendBtn.disabled = false;
        }
    });
});
