import os
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from surprise import Dataset, Reader, SVD
import urllib.request
import zipfile

app = Flask(__name__)
# Allow CORS so your Netlify/Vercel frontend can make requests to this Render API
CORS(app) 

# --- BOOTUP LOGIC ---
# Render needs to download the dataset if it's not checked into GitHub
if not os.path.exists('ml-latest-small'):
    print("Downloading MovieLens dataset...")
    url = "http://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
    urllib.request.urlretrieve(url, "ml-latest-small.zip")
    with zipfile.ZipFile("ml-latest-small.zip", 'r') as zip_ref:
        zip_ref.extractall(".")
    print("Download complete.")

print("Loading data and training SVD model for production...")
movies = pd.read_csv('ml-latest-small/movies.csv')
ratings = pd.read_csv('ml-latest-small/ratings.csv')

# Pre-calculate popular movies to filter out obscure niche films (Standard Data Science practice)
movie_counts = ratings['movieId'].value_counts()
popular_movie_ids = movie_counts[movie_counts >= 30].index.tolist()

reader = Reader(rating_scale=(0.5, 5.0))
data = Dataset.load_from_df(ratings[['userId', 'movieId', 'rating']], reader)
trainset = data.build_full_trainset()

# Train the optimal model in memory
algo_svd = SVD(n_factors=150, lr_all=0.01, reg_all=0.1, random_state=42)
algo_svd.fit(trainset)
print("Model trained and ready for production API traffic!")

# --- API ENDPOINTS ---
@app.route('/')
def home():
    return "CineMatch API is running! Use /recommend/<user_id> to get predictions."

@app.route('/users_preview')
def users_preview():
    # Get the highest rated movie for each user
    idx = ratings.groupby('userId')['rating'].idxmax()
    best_movies = ratings.loc[idx]
    merged = best_movies.merge(movies, on='movieId')[['userId', 'title']]
    
    # Convert to a dictionary: { "1": "Toy Story", "2": "Jumanji", ... }
    favs = {str(row['userId']): str(row['title']) for _, row in merged.iterrows()}
    return jsonify(favs)

@app.route('/recommend/<int:user_id>')
def recommend(user_id):
    # Only predict from popular movies to ensure high-quality, recognizable recommendations
    all_movie_ids = popular_movie_ids
    user_rated_movies = ratings[ratings['userId'] == user_id]['movieId'].unique()
    # Find user's favorite movie (highest rating)
    user_ratings = ratings[ratings['userId'] == user_id]
    favorite_movie_title = "Unknown"
    
    if not user_ratings.empty:
        best_movie_id = user_ratings.sort_values(by='rating', ascending=False).iloc[0]['movieId']
        favorite_movie_title = movies[movies['movieId'] == best_movie_id]['title'].values[0]
        
    predictions = []
    for movie_id in all_movie_ids:
        if movie_id not in user_rated_movies:
            predicted_rating = algo_svd.predict(user_id, movie_id).est
            predictions.append((movie_id, predicted_rating))
            
    predictions.sort(key=lambda x: x[1], reverse=True)
    
    results = []
    for movie_id, predicted_rating in predictions[:5]:
        movie_row = movies[movies['movieId'] == movie_id]
        movie_title = movie_row['title'].values[0]
        movie_genre = movie_row['genres'].values[0]
        
        results.append({
            "title": str(movie_title),
            "genre": str(movie_genre),
            "match": float(predicted_rating)
        })
        
    return jsonify({
        "favorite_movie": str(favorite_movie_title),
        "recommendations": results
    })

if __name__ == '__main__':
    # Render assigns the port dynamically via an environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
