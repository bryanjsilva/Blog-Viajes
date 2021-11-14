const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const path = require('path')

const pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user: 'root',
    password: 'rukulo',
    database: 'blog_viajes'
})

router.get('/', (req, res)=>{
    pool.getConnection((err,connection)=>{
        let query
        let searchQuery = ""
        let modificadorPagina = ""
        let pagina = 0
        const search = (req.query.search) ? req.query.search : ""
        if(search != ""){
            searchQuery = `WHERE titulo LIKE '%${search}%' OR resumen LIKE '%${search}%' OR contenido LIKE '%${search}%'`
            modificadorPagina = ""
        }else{
            pagina = req.query.pagina ? parseInt(req.query.pagina) : 0
            if(pagina < 0){
                pagina = 0
            }
            modificadorPagina = `
            LIMIT 5 OFFSET ${pagina*5}`
        }
        query = `
        SELECT * FROM publicaciones INNER JOIN autores ON publicaciones.autor_id = autores.id ${searchQuery} ORDER BY fecha_hora DESC ${modificadorPagina}
        `
        connection.query(query, (error, filas, campos)=>{
            let maxPaginas = 0
            if(filas.length < 5 ){
                maxPaginas = pagina
            }
            pagina = maxPaginas == filas.length ? maxPaginas-1 : pagina
            res.render('index', {publicaciones: filas, busqueda: search, pagina: pagina, mensaje: req.flash('mensaje')})
        })
        connection.release()
    })
})

router.get('/registro', (req, res)=>{
    res.render('registro', {mensaje: req.flash('mensaje')})
})

router.post('/procesar_registro', (req, res)=>{
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
                            if(req.files && req.files.avatar){
                                const archivoAvatar = req.files.avatar
                                const id = filas.insertId
                                const nombreArchivo = `${id}${path.extname(archivoAvatar.name)}`
                                archivoAvatar.mv(`./public/avatars/${nombreArchivo}`,(error)=>{
                                    const consultaAvatar = `
                                    UPDATE autores SET avatar = ${connection.escape(nombreArchivo)}
                                    WHERE id = ${connection.escape(id)}
                                    `
                                connection.query(consultaAvatar, (error,filas,campos)=>{
                                    req.flash('mensaje','Usuario registrado con avatar')
                                    console.log('id: ', id)
                                    console.log('query: ', consultaAvatar)
                                    res.redirect('/registro')
                                })
                                })

                            }else{
                                req.flash('mensaje', 'Se ha registrado correctamente')
                                res.redirect('/registro')
                            }
                        })
                    }
                })
            }
        })
        connection.release()
    })
})

router.get('/login', (req, res)=>{
    res.render('login', {mensaje: req.flash('mensaje')})
})

router.post('/procesar_login', (req, res)=>{
    pool.getConnection((err,connection)=>{
        const email = req.body.email.toLowerCase().trim()
        const password = req.body.contrasena

        const query = `SELECT * FROM autores WHERE email = ${connection.escape(email)} AND contrasena = ${connection.escape(password)}`

        connection.query(query, (error,filas,campos)=>{
            if(filas.length > 0){
                req.session.usuario = filas[0]
                res.redirect('/admin/index')
            }else{
                req.flash('mensaje', 'El email o la contraseña son incorrectos')
                res.redirect('/login')
            }
        })
        connection.release()
    })
})

router.get('/publicacion/:id',(req,res)=>{
    pool.getConnection((err,connection)=>{
        const query = `SELECT * FROM publicaciones WHERE publicacionid = ${connection.escape(req.params.id)}`
        connection.query(query, (error,filas,campos)=>{
            if(filas.length > 0){
                res.render('publicacion', {publicacion: filas[0], mensaje: req.flash('mensaje')})
            }else{
                req.flash('mensaje','La publicación no existe')
                res.redirect('/')
            }
        })
    })
})

router.get('/autores', (req,res)=>{
    pool.getConnection((err,connection)=>{
        const query = `SELECT * FROM autores INNER JOIN publicaciones
        ON autores.id = publicaciones.autor_id 
        ORDER BY id DESC, publicaciones.fecha_hora DESC`
        connection.query(query, (error,filas,campos)=>{
            autores = []
            ultimoAutorId = undefined
            filas.forEach(element => {
                if(element.id != ultimoAutorId){
                    ultimoAutorId = element.id
                    autores.push({
                        id: element.id,
                        email: element.email,
                        pseudonimo: element.pseudonimo,
                        avatar: element.avatar,
                        publicaciones: []
                    })
                }
                autores[autores.length-1].publicaciones.push({
                    id: element.publicacionid,
                    titulo: element.titulo
                })
            });
            res.render('autores', {autores: autores})
        })
        connection.release()
    })
})

router.get('/publicacion/:id/votar',(req,res)=>{
    pool.getConnection((err,connection)=>{
        const query = `SELECT * FROM publicaciones WHERE publicacionid = ${connection.escape(req.params.id)}`
        connection.query(query,(error,filas,campos)=>{
            if(filas.length>0){
                const votar = `UPDATE publicaciones SET votos = votos + 1 WHERE publicacionid = ${connection.escape(req.params.id)}`
                connection.query(votar, (error,filas,campos)=>{
                    res.redirect(`/publicacion/${req.params.id}`)
                })
            }else{
                req.flash('mensaje', 'Publicación no válida')
                res.redirect('/')
            }
        })
        connection.release()
    })
})

module.exports = router