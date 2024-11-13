import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaStar } from 'react-icons/fa';
import languages from '../../data/languages'; // Assume these are your language options
import genres from '../../data/genres'; // Assume these are your genre options
import image from '../../assets/optical-fiber-background.jpg';
import MoodSelector from './MoodSelector'; // Import the MoodSelector component

const TMDB_API_KEY = '82bf8e7015e539b6b3839975fa59392a';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  adult: boolean;
  trailerUrl?: string;
  tagline?: string;
  runtime?: number;
  vote_average?: number;
}

const MovieSearch: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mood, setMood] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trailerMovieId, setTrailerMovieId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&certification_country=US&certification.lte=R`;

      if (searchQuery) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&certification_country=US&certification.lte=R`;
      } else {
        if (language) url += `&with_original_language=${language}`;
        if (genre) url += `&with_genres=${genre}`;
        if (mood) url += `&with_genres=${moodGenreMapping[mood]}`;
      }

      const response = await axios.get(url);
      const moviesWithDetails = await Promise.all(
        response.data.results.map(async (movie: Movie) => {
          if (!movie.adult) {
            const movieDetailResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`
            );

            const trailerResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`
            );

            const movieDetails = movieDetailResponse.data;
            const trailer = trailerResponse.data.results.find((video: any) => video.type === 'Trailer');

            return {
              ...movie,
              genres: movieDetails.genres.map((g: any) => g.name),
              runtime: movieDetails.runtime,
              vote_average: movieDetails.vote_average,
              trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
            };
          }
          return null; // Return null for adult movies
        })
      );

      const filteredMovies = moviesWithDetails.filter(Boolean) as Movie[];
      setMovies(filteredMovies);
    } catch (err) {
      setError('Failed to fetch movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const moodGenreMapping: { [key: string]: string } = {
    Happy: '35', // Comedy
    Sad: '18', // Drama
    Excited: '28', // Action
    Romantic: '10749', // Romance
    Angry: '27', // Horror
    Scared: '27', // Horror
  };

  const fetchFavorites = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`http://localhost:8080/api/favourites?userId=${userId}`);
      setFavorites(response.data.map((fav: any) => fav.movieId));
    } catch (error) {
      console.error('Error fetching favorites', error);
    }
  };

  const toggleFavorite = async (movie: Movie) => {
    if (!userId) return;
    try {
      const isFavorite = favorites.includes(movie.id);

      if (isFavorite) {
        await axios.delete(`http://localhost:8080/api/favourites`, {
          params: { userId, movieId: movie.id },
        });
        setFavorites(favorites.filter((id) => id !== movie.id));
      } else {
        await axios.post('http://localhost:8080/api/favourites', {
          userId,
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
        });
        setFavorites([...favorites, movie.id]);
      }
    } catch (error) {
      console.error('Error toggling favorite', error);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchFavorites();
  }, [userId, searchQuery, language, genre, mood]);

  const handleDoubleClick = (movieId: number) => {
    setTrailerMovieId(trailerMovieId === movieId ? null : movieId);
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${image})` }}>
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative container mx-auto p-4 max-w-[2000px] backdrop-blur-lg bg-white bg-opacity-10 rounded-lg shadow-lg">
        <div className="mb-4 bg-white bg-opacity-70 p-4 rounded-lg shadow sticky top-0 z-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Movie Search</h1>
          <form onSubmit={(e) => { e.preventDefault(); fetchMovies(); }} className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded py-2 px-4 flex-grow"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded py-2 px-4"
            >
              <option value="">Select Language</option>
              {languages.map((lang) => (
                <option key={lang.iso_639_1} value={lang.iso_639_1}>
                  {lang.english_name}
                </option>
              ))}
            </select>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="border rounded py-2 px-4"
            >
              <option value="">Select Genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded mt-2"
            >
              Search
            </button>
          </form>
        </div>

        {loading && <p className="text-center">Loading movies...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="relative bg-white rounded-lg shadow overflow-hidden"
              onDoubleClick={() => handleDoubleClick(movie.id)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-64 object-cover cursor-pointer"
              />
              <div className="p-4">
                <h2 className="text-xl font-bold">{movie.title}</h2>
                <p className="text-gray-600">{movie.release_date}</p>
                <p className="text-gray-800">{movie.overview}</p>
                <p className="text-gray-800">Runtime: {movie.runtime} minutes</p>
                <p className="flex items-center">
                  <FaStar className="text-yellow-500 mr-1" />
                  {movie.vote_average}
                </p>
                <button
                  onClick={() => toggleFavorite(movie)}
                  className={`flex items-center mt-2 text-lg ${favorites.includes(movie.id) ? 'text-red-500' : 'text-gray-800'}`}
                >
                  <FaHeart className="mr-1" />
                  {favorites.includes(movie.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              </div>
              {trailerMovieId === movie.id && movie.trailerUrl && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                  <iframe
                    title={movie.title}
                    width="560"
                    height="315"
                    src={movie.trailerUrl}
                    frameBorder="0"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieSearch;
