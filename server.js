var express = require('express')
var app = express()
const fs = require('fs')
const PORT = 5000
const bodyParser = require('body-parser')
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// Middleware
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('pages/index', {
        pageTitle: 'Home',
        customStylesheet: '/public/css/index.css'
    })
})