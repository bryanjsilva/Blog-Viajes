const express = require('express')
const app = express()
const session = require('express-session')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const flash = require('express-flash')

const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'rukulo',
    database: 'ejemplo_backend'
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(session({secret: 'token-muy-secreto', resave: true, saveUninitialized: true}))
app.use(flash())
app.use(express.static('public'))

app.get('/', (req, res)=>{
    pool.getConnection((err,connection)=>{
        res.render('index')
    })
})

app.listen(8080, ()=>{
    console.log("Servidor iniciado")
})