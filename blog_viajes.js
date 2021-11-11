const express = require('express')
const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const flash = require('express-flash')

const middleware = require('./routes/middleware')
const publicas = require('./routes/publicas')
const privadas = require('./routes/privadas')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(session({secret: 'token-muy-secreto', resave: true, saveUninitialized: true}))
app.use(flash())
app.use(express.static('public'))
app.use(middleware)
app.use(publicas)
app.use(privadas)

app.listen(8080, ()=>{
    console.log("Servidor iniciado")
})