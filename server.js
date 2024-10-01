var express = require('express')
var app = express()
const fs = require('fs')
const PORT = 5000
const path = require('path')

app.use(express.json());
app.use(express.static('/public'));

// Index
app.get('/', (req, res) => {
    res.status(300).redirect('/api')
})

app.get('/api', (req, res) => {
    res.send('/public/index.html')
})

app.get('/api/movies', (req, res) => {
    let movies = getMovies();
    res.json(movies);
})

app.get('/api/directors', (req, res) => {
    res.render('index.html')
})

// ! ADMIN
app.get('/add/movie/:title/:year/:genre', async (req, res) => {
    try {
        const { title, year, genre } = req.params;
        let movies = [];
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

// ! FUNCTIONS
async function getMovies() {
    try {
        const data = fs.readFileSync(path.join(__dirname + '/data/movies.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getDirectors() {
    try {
        const data = fs.readFile(path.join(__dirname + '/data/directors.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
        return [];
    }
}
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});