var express = require('express')
var app = express()
const fs = require('fs').promises
const PORT = 5000
const path = require('path')

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Index
app.get('/', (req, res) => {
    res.status(300).redirect('/api')
})

app.get('/api', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'))
})

let ADMIN_TOKEN = "1987"

// * Movie Pages
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await getMovies();
        const allMovies = movies.map((movie) => {
            const {id, title, release_year, genre} = movie;
            return {id, title, release_year, genre};
        })
        res.json(allMovies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to fetch movies" });
    }
    
})

app.get('/api/movies/search', async (req, res) => {
    try {
        const movies = await getMovies();
        const {id, search, release_year, genre} = req.query
        let sortedMovies = [...movies]
        if(search) {
            sortedMovies = sortedMovies.filter((movie) => {
                return movie.title.toLowerCase().includes(search.toLowerCase());
            })
        }
        if(release_year) {
            sortedMovies = sortedMovies.filter((movie) => {
                return movie.release_year === parseInt(release_year);
            });
        }
        if(id) {
            sortedMovies = sortedMovies.filter((movie) => {
                return movie.id === parseInt(id);
            });
        }
        if(genre) {
            sortedMovies = sortedMovies.filter((movie) => {
                return movie.genre.toLowerCase().includes(genre.toLowerCase());
            });
        }
        if(sortedMovies.length < 1) {
            return res.status(200).json({success:true, data:[]})
        } 
        res.json(sortedMovies)
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, error: "Failed to search movies" });
    }
})

// * Director Pages
app.get('/api/directors', async (req, res) => {
    try {
        const directors = await getDirectors();
        const allDirectors = directors.map((movie) => {
            const {id, name, birthdate} = movie;
            return {id, name, birthdate};
        })
        res.json(allDirectors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to fetch directors" });
    }
    
})

app.get('/api/directors/search', async (req, res) => {
    try {
        const directors = await getDirectors();
        const {id, name, birthyear} = req.query
        let sortedDirectors = [...directors]
        if(id) {
            sortedDirectors = sortedDirectors.filter((director) => {
                return director.id === parseInt(id);
            });
        }
        if(name) {
            sortedDirectors = sortedDirectors.filter((director) => {
                return director.name.toLowerCase().includes(search.toLowerCase());
            })
        }
        if(birthyear) {
            sortedDirectors = sortedDirectors.filter((director) => {
                return parseInt(director.birthdate.slice(0, 4));
            });
        }
    
        if(sortedDirectors.length < 1) {
            return res.status(200).json({success:true, data:[]})
        } 
        res.json(sortedDirectors)
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to search directors" });
    }
})

app.get('/api/directors/:directorId/movies', async (req, res) => {
    try {
        const directorId = parseInt(req.params.directorId);
        const directors = await getDirectors();
        const movies = await getMovies();

        // Find the director
        const director = directors.find(d => d.id === directorId);
        
        if (!director) {
            return res.status(404).json({success: false, message: 'Director not found'});
        }

        // Get all movies by this director
        const directorMovies = movies.filter(movie => 
            director.movies.includes(movie.id)
        );

        return res.status(200).json({success: true, data: {director: director, movies: directorMovies}});
    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false, error: 'Server error'});
    }
});

// ! ADMIN
app.get('/add/movie/:title/:year/:genre/:token', async (req, res) => {
    try {
        const { title, year, genre, token} = req.params;
        let movies = [];
        if(token != ADMIN_TOKEN) {
            res.send("")
        }
        try {
            const data = fs.readFile(path.join(__dirname + '/data/movies.json'), 'utf8');
            movies = JSON.parse(data);
        } catch (error) {
            console.error(error);
        }

        // Find highest existing movie ID
        const highestId = movies.reduce((max, movie) => {
            Math.max(max, movie.id || 0)
        }, 0)

        const newMovie = {
            id: highestId + 1,
            title,
            year,
            genre,
        }
        movies.push(newMovie);
        fs.writeFile(path.join(__dirname, 'movies.json'), JSON.stringify(movies, null, 2 ))
        res.status(201).json({ message: 'Movie added successfully', movie: newMovie });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding movie');
    }
})

// ! ADMIN
app.delete('/delete/movie/:id/:token', async (req, res) => {
    try {
        const { id, token } = req.params;
        
        if (token != ADMIN_TOKEN) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        let movies = [];

        try {
            const data = await fs.promises.readFile(path.join(__dirname + '/data/movies.json'), 'utf8');
            movies = JSON.parse(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error reading movies data' });
        }

        const movieIndex = movies.findIndex(movie => movie.id === parseInt(id));

        if (movieIndex === -1) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        const deletedMovie = movies.splice(movieIndex, 1);

        try {
            await fs.promises.writeFile(path.join(__dirname, 'data/movies.json'), JSON.stringify(movies, null, 2));
            res.status(200).json({ message: 'Movie deleted successfully', movie: deletedMovie });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting movie' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing request');
    }
});

// ! FUNCTIONS
async function getMovies() {
    try {
        const data = await fs.readFile(path.join(__dirname + '/data/movies.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getDirectors() {
    try {
        const data = await fs.readFile(path.join(__dirname + '/data/directors.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
    }
}
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});