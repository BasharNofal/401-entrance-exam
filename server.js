'use strict';

// including - importing libraries

const express = require('express');
const superAgent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

// setup and configuration

require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
app.use(cors());
app.use(methodOverride('_method'));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

// const client = new pg.Client(process.env.DATABASE_URL); 
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); 

//================================ROUTES=====================================\\

app.get('/',handleHome);
app.get('/getCountryResult',handleOneCountryRecords);
app.get('/allCountries',handleAllCountriesRecords);
app.post('/myRecords',handleAddToMyRecords);
app.get('/myRecords',handleMyRecords);
app.get('/recordsDetails/:id',handleRecordsDetails);
app.delete('/recordsDetails/:id',handleDeleteRecords);

//================================HANDLERS===================================\\

function handleHome(req,res){
    let url = 'https://api.covid19api.com/world/total';
    superAgent.get(url).then(results =>{
        res.render('home',{data: results.body});
    }).catch(error =>{
        res.send('An error occurred while getting data from API ' + error);
    });
}

function handleOneCountryRecords(req,res){
    let {countryName, fromDate, toDate} = req.query;
    let url = `https://api.covid19api.com/country/${countryName}/status/confirmed?from=${fromDate}T00:00:00Z&to=${toDate}T00:00:00Z`;
    superAgent.get(url).then(results =>{
        let arrOfOneCountryRecords = results.body.map(oneDay =>{
            return new OneCountryRecords(oneDay);
        });
        res.render('getCountryResult',{data: arrOfOneCountryRecords})
    }).catch(error =>{
        res.status(400).send('An error occurred while getting data from API ' + error);
    });
}

function handleAllCountriesRecords(req,res){
    let url = 'https://api.covid19api.com/summary';
    superAgent.get(url).then(results =>{
        let arrOfAllCountriesRecords = results.body.Countries.map(oneCountry =>{
            return new AllCountriesRecords(oneCountry);
        });
        res.render('allCountries',{data: arrOfAllCountriesRecords});
    }).catch(error =>{
        res.status(400).send('An error occurred while getting data from API ' + error);
    });
}

function handleAddToMyRecords(req,res){
    let {country_name, total_confirmed, total_deaths, total_recovered, date} = req.body;
    let insertQuery = 'INSERT INTO covid(country_name, total_confirmed, total_deaths, total_recovered, date) VALUES ($1,$2,$3,$4,$5);';
    let safeValues = [country_name, total_confirmed, total_deaths, total_recovered, date];
    client.query(insertQuery,safeValues).then(()=>{
        res.redirect('/myRecords');
    }).catch(error =>{
        res.status(500).send('An error occurred while inserting data into database ' + error);
    });
}

function handleMyRecords(req,res){
    let selectQuery = 'SELECT * FROM covid;';
    client.query(selectQuery).then(results =>{
        res.render('myRecords',{data: results.rows});
    }).catch(error =>{
        res.status(500).send('An error occurred while getting data from database ' + error);
    });
}

function handleRecordsDetails(req,res){
    let id = req.params.id;
    let selectQuery = 'SELECT * FROM covid WHERE id = $1;';
    let safeValues = [id];
    client.query(selectQuery,safeValues).then(results =>{
        res.render('myRecordsDetails',{data: results.rows[0]});
    }).catch(error =>{
        res.status(500).send('An error occurred while getting data from database ' + error);
    });
}

function handleDeleteRecords(req,res){
    let id = req.params.id;
    let deleteQuery = 'DELETE FROM covid WHERE id = $1;';
    let safeValues = [id];
    client.query(deleteQuery,safeValues).then(()=>{
        res.redirect('/myRecords');
    }).catch(error =>{
        res.status(500).send('An error occurred while deleting data from database ' + error);
    });
}

//================================CONSTRUCTORS===================================\\

function OneCountryRecords(data){
    this.countryName = data.Country;
    this.cases = data.Cases;
    this.date = data.Date;
}

function AllCountriesRecords(data){
    this.country_name = data.Country;
    this.total_confirmed = data.TotalConfirmed;
    this.total_deaths = data.TotalDeaths;
    this.total_recovered = data.TotalRecovered;
    this.date = data.Date;
}

//===============================CONNECTING DB====================================\\

client.connect().then(()=>{
    app.listen(PORT,()=>{
        console.log('app is listening on port ' + PORT);
    })
});