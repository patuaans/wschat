const express = require('express')
const router = express.Router()
const { handleLogin, handleRegister } = require('../controllers/authController')
const { loginValidator, registerValidator } = require('../middlewares/validate')

router.get('/', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login')
    }
    const username = req.session.username
    res.render('index', { username })
})

router.get('/login', (req, res) => {
    if (req.session.username) {
        return res.redirect('/')
    }
    const error = req.flash('error')
    const formData = req.session.formData || {}
    delete req.session.formData
    res.render('login', { error, formData })
})

router.post('/login', loginValidator, handleLogin)

router.get('/register', (req, res) => {
    if (req.session.username) {
        return res.redirect('/')
    }
    const error = req.flash('error')
    const formData = req.session.formData || {}
    delete req.session.formData
    res.render('register', { error, formData })
})

router.post('/register', registerValidator, handleRegister)

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/')
        }
        res.redirect('/login')
    })
})

module.exports = router