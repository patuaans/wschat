require('dotenv').config()
const express = require('express')
const session = require('express-session')
const flash = require('connect-flash')
const socketio = require('socket.io')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(flash())
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))
app.set('view engine', 'ejs')

app.use(require('./routes/authRoutes'))

PORT = process.env.PORT || 8080
const httpServer = app.listen(PORT, () => console.log('http://localhost:' + PORT))
const io = socketio(httpServer)
let activeUsers = {}

io.on('connection', socket => {
    socket.on('new-user', username => {
        activeUsers[socket.id] = username
        socket.username = username
        socket.broadcast.emit('update', { username: username, message: username + ' has joined the conversation' })
        updateUsersList()
    })

    socket.on("chat", message => {
        socket.broadcast.emit("chat", message)
    })

    socket.on('disconnect', () => {
        delete activeUsers[socket.id]
        socket.broadcast.emit('update', { username: socket.username, message: socket.username + ' left the conversation' })
        updateUsersList()
    })
})

function updateUsersList() {
    const userList = Array.from(io.sockets.sockets.values())
        .map(s => ({ id: s.id, username: s.username }))

    io.emit('list-users', userList)
}