const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user')
const Buku = require('../model/buku'); // Sesuaikan path ke model Buku Anda
const ReviewBuku = require('../model/review_buku');
const router = express.Router();
const axios = require('axios')

//Endpoint untuk search buku dari rapid api
router.get('/buku/explore/list', async(req, res)=>{
    let token = req.header
    try{
        let dataUser = jwt.verify(token, 'your_jwt_secret');
        let adminChecker = await User.checkAdmin(dataUser.user.role) 
        if(!adminChecker){
            return res.status(403).json({message: "Access denied!"})
        }
        let fetchData = await axios({
            method: 'get',
            url: "https://mangaverse-api.p.rapidapi.com/manga/fetch",
            params:{
                page: '1',
                nsfw: 'true',
                type: 'all'
            }, //tolong key e garapen ya meeee, aku ga subscription mangaverse soale :v --Thio
            headers:{
                'X-RapidAPI-Key': 'SIGN-UP-FOR-KEY',
                'X-RapidAPI-Host': 'mangaverse-api.p.rapidapi.com'
            }
        })
        return res.status(200).json(fetchData.data)
    } catch(err){
        console.log(err)
        return err
    }
})

//Endpoint untuk import buku
router.post('/buku/explore/add')

// Endpoint untuk menambahkan buku
router.post('/', async (req, res) => {
    const { judul, penulis, penerbit, tahun_terbit, isbn, token } = req.body;
    
    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');
        
        // Cek role dari token
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang bisa menambahkan buku.' });
        }

        const buku = await Buku.create({
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            isbn
        });

        res.status(201).json({ message: 'Buku berhasil ditambahkan', buku });
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});
router.get('/liatbuku', async (req, res) => {
    try {
        // Mengambil semua buku dari database menggunakan model Buku
        const books = await Buku.findAll();

        // Mengembalikan data buku dalam respons
        res.status(200).json({ books });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/review', async (req, res) => {
    const { id_buku, id_anggota, rating, komentar, token } = req.body;

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');

        // Buat review baru menggunakan model ReviewBuku
        const review = await ReviewBuku.create({
            id_buku,
            id_anggota,
            rating,
            komentar
        });

        res.status(201).json({ message: 'Review buku berhasil ditambahkan', review });
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
