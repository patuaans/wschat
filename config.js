const { initializeApp } = require('firebase/app')
const { getFirestore, collection } = require('firebase/firestore')

const firebaseConfig = {
    apiKey: "AIzaSyB5iJRbY4P7YwmYHjLi5zuDNgBta3S0FzI",
    authDomain: "midterm-nodejs.firebaseapp.com",
    projectId: "midterm-nodejs",
    storageBucket: "midterm-nodejs.appspot.com",
    messagingSenderId: "174273847580",
    appId: "1:174273847580:web:8517adba8bd3ee93615ad9"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const Users = collection(db, 'Users')

module.exports = { db, Users }