require('dotenv').config()
const express = require('express')
const session = require('express-session')
const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const { query, where, getDocs, addDoc} = require('firebase/firestore');
const { Users } = require('./config')
const socketio = require('socket.io')
const flash = require('connect-flash')
const cors = require('cors')

const { registerValidator, loginValidator } = require('./middlewares/validate')


const app = express()

app.use(flash())
app.use(session({
    secret: 'abc123',
    resave: false,
    saveUninitialized: true
}))
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(cors())

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login')
    }
    const username = req.session.username
    res.render('index', { username })
})

app.get('/login', (req, res) => {
    if (req.session.username) {
        return res.redirect('/')
    }
    const error = req.flash('error')
    const formData = req.session.formData || {}
    delete req.session.formData
    res.render('login', { error, formData })
})

app.post('/login', loginValidator, async (req, res) => {
    let result = validationResult(req)
    if (result.errors.length === 0) {
        const { username, password } = req.body
        try {
            const userQuery = query(Users, where("username", "==", username));
            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/login');
            }

            const userData = querySnapshot.docs[0].data();
            const passwordMatch = bcrypt.compareSync(password, userData.password);

            if (!passwordMatch) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/login');
            }

            req.session.username = username;
            res.redirect('/');

        } catch (error) {
            console.error("Login error: ", error);
            req.flash('error', 'An error occurred during login');
            res.redirect('/login');
        }
    } else {
        let message

        result = result.mapped()
        for (let fields in result) {
            message = result[fields].msg
            break
        }

        req.session.formData = req.body
        req.flash('error', message)
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/')
        }
        res.redirect('/login');
    })
})

app.get('/register', (req, res) => {
    const error = req.flash('error')
    const formData = req.session.formData || {}
    delete req.session.formData
    res.render('register', { error, formData })
})

app.post('/register', registerValidator, async (req, res) => {
    let result = validationResult(req)
    let message

    if (result.errors.length === 0) {
        const { username, password } = req.body
        const hashed = bcrypt.hashSync(password, 10)

        try {
            await addDoc(Users, {
                username: username,
                password: hashed
            });
            res.redirect('/login');
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    } else {
        result = result.mapped()
        for (let fields in result) {
            message = result[fields].msg
            break
        }

        req.session.formData = req.body
        req.flash('error', message)
        res.redirect('/register')
    }
})

PORT = process.env.PORT || 8080
const httpServer = app.listen(PORT, () => console.log('http://localhost:' + PORT))
const io = socketio(httpServer)
let activeUsers = {}
io.on('connection', socket => {
    socket.on('new-user', username => {
        activeUsers[socket.id] = username
        socket.username = username;
        socket.broadcast.emit('update', { username: username, message: username + ' has joined the conversation' })
        updateUsersList();
    });

    socket.on("chat", message => {
        socket.broadcast.emit("chat", message);
    });

    socket.on('disconnect', () => {
        delete activeUsers[socket.id]
        socket.broadcast.emit('update', { username: socket.username, message: socket.username + ' left the conversation' })
        updateUsersList();
    })
})

function updateUsersList() {
    const userList = Array.from(io.sockets.sockets.values())
        .map(s => ({ id: s.id, username: s.username }))

    io.emit('list-users', userList)
}