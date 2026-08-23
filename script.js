document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Long Tail Chart
    const longTailCtx = document.getElementById('longTailChart').getContext('2d');
    
    // Generate long tail data (exponential decay)
    const labels = Array.from({length: 50}, (_, i) => i + 1);
    const data = labels.map(x => Math.floor(1000 * Math.exp(-0.15 * x)));

    new Chart(longTailCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Ratings',
                data: data,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // 2. Sparsity Matrix Visual
    const matrixGrid = document.getElementById('matrixGrid');
    const rows = 10;
    const cols = 20;
    const totalCells = rows * cols;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        
        // Randomly fill ~2% of cells to simulate 98% sparsity
        if (Math.random() > 0.98) {
            cell.classList.add('filled');
        }
        
        matrixGrid.appendChild(cell);
    }

    // 3. RMSE Comparison Chart
    const rmseCtx = document.getElementById('rmseChart').getContext('2d');
    new Chart(rmseCtx, {
        type: 'bar',
        data: {
            labels: ['Baseline (Average)', 'User-User CF', 'Item-Item CF', 'SVD (Matrix Factorization)'],
            datasets: [{
                label: 'RMSE Score (Lower is Better)',
                data: [1.05, 0.96, 0.93, 0.87],
                backgroundColor: [
                    'rgba(255, 255, 255, 0.2)',
                    'rgba(56, 189, 248, 0.5)',
                    'rgba(129, 140, 248, 0.5)',
                    'rgba(52, 211, 153, 0.8)' // Green for best
                ],
                borderColor: [
                    'rgba(255, 255, 255, 0.5)',
                    '#38bdf8',
                    '#818cf8',
                    '#34d399'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0.8,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // 4. Live Backend Connection (Render.com)
    // IMPORTANT: Replace this URL with your actual Render API URL once you deploy it!
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
