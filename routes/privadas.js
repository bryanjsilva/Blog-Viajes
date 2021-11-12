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

router.get('/admin/index', (req,res)=>{
    pool.getConnection((err,connection)=>{
        const query = `SELECT * FROM publicaciones WHERE autor_id = ${connection.escape(req.session.usuario.id)}`
        connection.query(query,(error,filas,campos)=>{
            res.render('admin/index', {usuario: req.session.usuario, mensaje: req.flash('mensaje'), publicaciones: filas})
        })
        connection.release()
    })
})

router.get('/admin/logout', (req, res)=>{
    req.session.destroy()
    res.redirect('/')
})

router.get('/admin/agregar', (req,res)=>{
    res.render('admin/agregar', {mensaje: req.flash('mensaje'), usuario: req.session.usuario})
})

router.post('/admin/procesar_agregar',(req,res)=>{
    pool.getConnection((err,connection)=>{
        const date = new Date()
        const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
        const query = `INSERT INTO publicaciones (titulo, resumen, contenido, fecha_hora, autor_id) VALUES (
          ${connection.escape(req.body.titulo)},
          ${connection.escape(req.body.resumen)},
          ${connection.escape(req.body.contenido)},
          ${connection.escape(fecha)},
          ${connection.escape(req.session.usuario.id)}
        )
      `
        connection.query(query, (error,filas,campos)=>{
            req.flash('mensaje', 'Publicación agregada')
            res.redirect('/admin/index')
        })
        connection.release()
    })
})

router.get('/admin/actualizar/:id', (req,res)=>{
    pool.getConnection((err, connection)=>{
        const query = `SELECT * FROM publicaciones WHERE publicacionid = ${connection.escape(req.params.id)} AND autor_id = ${connection.escape(req.session.usuario.id)}`
        connection.query(query,(error,filas,campos)=>{
            if(filas.length > 0){
                res.render('admin/actualizar', {publicacion: filas[0],mensaje: req.flash('mensaje'), usuario: req.session.usuario})
            }else{
                req.flash('mensaje', 'La publicación no se encuentra disponible')
                res.redirect('/admin/index')
            }
        })
        connection.release()
    })
})

router.post('/admin/procesar_actualizar', (req, res) => {
    pool.getConnection((err, connection) => {
      const query = `
        UPDATE publicaciones
        SET
        titulo = ${connection.escape(req.body.titulo)},
        resumen = ${connection.escape(req.body.resumen)},
        contenido = ${connection.escape(req.body.contenido)}
        WHERE
        publicacionid = ${connection.escape(req.body.id)}
        AND
        autor_id = ${connection.escape(req.session.usuario.id)}
      `
      console.log(req.body.id)
      connection.query(query, (error, filas, campos) => {
        if (filas && filas.changedRows > 0){
            req.flash('mensaje', 'La publicación se modificó con éxito')
        }
        else{
            req.flash('mensaje', 'No se pudo modificar la publicación')
        }
        res.redirect("/admin/index")
      })
      connection.release()
    })
  })

  router.get('/admin/procesar_eliminar/:id', (req, res) => {
    pool.getConnection((err, connection) => {
      const query = `
        DELETE
        FROM
        publicaciones
        WHERE
        publicacionid = ${connection.escape(req.params.id)}
        AND
        autor_id = ${connection.escape(req.session.usuario.id)}
      `
      connection.query(query, (error, filas, campos) => {
        if (filas && filas.affectedRows > 0){
            req.flash('mensaje', 'La publicación eliminó con éxito')
        }
        else{
            req.flash('mensaje', 'La publicación no pudo eliminarse')
            console.log(error)
        }
        res.redirect("/admin/index")
      })
      connection.release()
    })
  })

  module.exports = router