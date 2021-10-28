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
    database: 'blog_viajes'
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(session({secret: 'token-muy-secreto', resave: true, saveUninitialized: true}))
app.use(flash())
app.use(express.static('public'))

app.get('/', (req, res)=>{
    pool.getConnection((err,connection)=>{
        const query = 'SELECT titulo, resumen, fecha_hora, pseudonimo, votos FROM publicaciones INNER JOIN autores ON publicaciones.autor_id = autores.id ORDER BY fecha_hora DESC LIMIT 5'
        connection.query(query, (error, filas, campos)=>{
            res.render('index', {publicaciones: filas})
        })
        connection.release()
    })
})

app.listen(8080, ()=>{
    console.log("Servidor iniciado")
})