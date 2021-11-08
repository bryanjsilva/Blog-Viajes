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

app.get('/registro', (req, res)=>{
    res.render('registro', {mensaje: req.flash('mensaje')})
})

app.post('/procesar_registro', (req, res)=>{
    pool.getConnection((err,connection)=>{
        const email = req.body.email.toLowerCase().trim()
        const password = req.body.contrasena
        const pseudonimo = req.body.pseudonimo.trim()

        const queryEmail = `SELECT * FROM autores WHERE email = ${connection.escape(email)}`

        connection.query(queryEmail, (error,filas,campos)=>{
            if(filas.length > 0){
                req.flash('mensaje', 'Este email ya se encuentra en uso por otro usuario')
                res.redirect('/registro')
            }else{
                const queryPseudonimo = `SELECT * FROM autores WHERE pseudonimo = ${connection.escape(pseudonimo)}`

                connection.query(queryPseudonimo, (error,filas,campos)=>{
                    if(filas.length > 0){
                        req.flash('mensaje', 'Este pseudónimo ya se encuentra en uso, elige otro')
                        res.redirect('/registro')
                    }else{
                        const query = `INSERT INTO autores 
                        (email, contrasena, pseudonimo) VALUES (
                            ${connection.escape(email)}, 
                            ${connection.escape(password)}, 
                            ${connection.escape(pseudonimo)})`

                        connection.query(query, (error,filas,campos)=>{
                            req.flash('mensaje', 'Se ha registrado correctamente')
                            res.redirect('/registro')
                        })
                    }
                })
            }
        })
        connection.release()
    })
})

app.get('/login', (req, res)=>{
    res.render('login', {mensaje: req.flash('mensaje')})
})

app.listen(8080, ()=>{
    console.log("Servidor iniciado")
})