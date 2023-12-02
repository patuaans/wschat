const { validationResult } = require('express-validator')
const { Users } = require('../config')
const bcrypt = require('bcrypt')
const { query, where, getDocs, addDoc } = require('firebase/firestore')

async function handleLogin(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg)
        req.session.formData = req.body
        return res.redirect('/login')
    }

    const { username, password } = req.body
    try {
        const userQuery = query(Users, where("username", "==", username))
        const querySnapshot = await getDocs(userQuery)

        if (querySnapshot.empty) {
            req.flash('error', 'Invalid username or password')
            return res.redirect('/login')
        }

        const userData = querySnapshot.docs[0].data()
        const passwordMatch = await bcrypt.compare(password, userData.password)

        if (!passwordMatch) {
            req.flash('error', 'Invalid username or password')
            return res.redirect('/login')
        }

        req.session.username = username
        res.redirect('/')
    } catch (error) {
        console.error("Login error: ", error)
        req.flash('error', 'An error occurred during login')
        res.redirect('/login')
    }
}

async function handleRegister(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg)
        req.session.formData = req.body
        return res.redirect('/register')
    }

    const { username, password } = req.body
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await addDoc(Users, {
            username: username,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch (error) {
        console.error("Error registering new user: ", error)
        req.flash('error', 'An error occurred during registration')
        res.redirect('/register')
    }
}

module.exports = { handleLogin, handleRegister }