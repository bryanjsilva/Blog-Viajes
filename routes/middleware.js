const express = require('express')
const router = express.Router()
const mysql = require('mysql')

const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'rukulo',
    database: 'blog_viajes'
})

router.use('/admin/', (req, res, then)=>{
    if(!req.session.usuario){
        req.flash('mensaje', 'Aún no ha iniciado sesión')
        res.redirect('/login')
    }else{
        then()
    }
})

module.exports = router