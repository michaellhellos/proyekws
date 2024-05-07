const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user')
const Buku = require('../model/buku'); // Sesuaikan path ke model Buku Anda
const ReviewBuku = require('../model/review_buku');
const router = express.Router();
const axios = require('axios')

//Endpoint untuk search buku dari rapid api
router.get('/admin/explore/list', async(req, res)=>{
    let token = req.header('x-auth-token')
    try{
        let dataUser = jwt.verify(token, 'your_jwt_secret')
        let adminChecker = await User.checkAdmin(dataUser.id_user)
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
                'X-RapidAPI-Key': '0a78375602msh1dcf019f6b6df08p1209d1jsneb4ee786ad76',
                'X-RapidAPI-Host': 'mangaverse-api.p.rapidapi.com'
            }
        })
        return res.status(200).json(fetchData.data)
    } catch(err){
        return res.status(400).json(err)
    }
})

//Endpoint untuk import buku
router.post('/admin/explore/add', async(req, res) =>{
    let token = req.header('x-auth-token')
    let id = req.body.id
    try{
        let dataUser = jwt.verify(token, 'your_jwt_secret')
        let adminChecker = await User.checkAdmin(dataUser.id_user)
        if(!adminChecker){
            return res.status(403).json({message: "Access denied!"})
        }

        let findManga = await axios({
            method: 'get',
            url: "https://mangaverse-api.p.rapidapi.com/manga",
            params:{
                id: id
            },
            headers:{
                'X-RapidAPI-Key': '0a78375602msh1dcf019f6b6df08p1209d1jsneb4ee786ad76',
                'X-RapidAPI-Host': 'mangaverse-api.p.rapidapi.com'
            }
        })
        let checkManga = await Buku.findOne({where:{judul: findManga.data.data.title}})
        if(checkManga != null){
            return res.status(400).json({message: `Buku dengan judul ${findManga.data.data.title} sudah ada dalam database!`})
        }
        if(findManga.data.data.authors[0] == ""){
            findManga.data.data.authors[0] = Buku.generateRandomName()
        }
        let newBook = await Buku.create({
            judul: findManga.data.data.title,
            penulis: findManga.data.data.authors[0],
            tahun_terbit: Buku.getYearFromUnixTime(findManga.data.data.create_at)
        })
        return res.status(201).json({message: `Buku dengan judul ${newBook.judul} berhasil ditambahkan kedalam database!`})
    } catch(err){
        console.log(err)
        return res.status(400).json(err)
    }
})

//Endpoint untuk edit buku
router.post('/admin/buku/edit')

// Endpoint untuk menambahkan buku
router.post('/admin/buku/add', async (req, res) => {
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
router.get('/buku/list', async (req, res) => {
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

router.post('/buku/review', async (req, res) => {
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

//pinjam buku
router.post('/buku/pinjam', async (req, res) => {
    const { token, id_buku } = req.body;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error(err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            const userId = decoded.user.id_user;

            // Cari pengguna berdasarkan id_user dari token
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
            }

            // Pastikan pengguna memiliki saldo yang cukup
            const biayaSewa = 50; // Biaya sewa buku
            if (user.saldo < biayaSewa) {
                return res.status(400).json({ message: 'Saldo tidak mencukupi untuk meminjam buku' });
            }

            // Cari buku berdasarkan id_buku yang dimasukkan
            const buku = await Buku.findByPk(id_buku);

            if (!buku) {
                return res.status(404).json({ message: 'Buku tidak ditemukan' });
            }

            // Lakukan pengecekan apakah buku sudah dipinjam sebelumnya atau tidak

            // Kurangi saldo pengguna sesuai biaya sewa buku
            user.saldo -= biayaSewa;
            await user.save();

            res.json({ message: 'Anda berhasil meminjam buku', saldoSekarang: user.saldo });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
//kembalikan buku
router.post('/kembalikan-buku', async (req, res) => {
    const { token, id_buku } = req.body;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error(err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            const userId = decoded.user.id_user;

            // Cari pengguna berdasarkan id_user dari token
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
            }

            // Cari buku berdasarkan id_buku yang dimasukkan
            const buku = await Buku.findByPk(id_buku);

            if (!buku) {
                return res.status(404).json({ message: 'Buku tidak ditemukan' });
            }

            // Lakukan pengecekan apakah pengguna sebenarnya meminjam buku tersebut sebelumnya atau tidak
            // Anda bisa menggunakan relasi atau catatan pinjaman buku di basis data untuk melakukan pengecekan ini

            // Tambahkan saldo pengguna setelah mengembalikan buku
            const biayaSewa = 25; // Biaya sewa buku
            user.saldo += biayaSewa;
            await user.save();

            res.json({ message: 'Anda berhasil mengembalikan buku', saldoSekarang: user.saldo });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

//admin bisa hapus buku
router.delete('/hapus-buku/:id', async (req, res) => {
    const { token } = req.body;
    const bukuId = req.params.id;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error(err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            // Pastikan pengguna memiliki peran admin
            if (decoded.user.role !== 'admin') {
                return res.status(403).json({ message: 'Anda tidak memiliki izin untuk mengakses fitur ini' });
            }

            // Cari buku berdasarkan ID yang dimasukkan
            const buku = await Buku.findByPk(bukuId);

            if (!buku) {
                return res.status(404).json({ message: 'Buku tidak ditemukan' });
            }

            // Hapus buku
            await buku.destroy();

            res.json({ message: 'Buku berhasil dihapus' });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
//update buku 
router.put('/admin/buku/update/:id', async (req, res) => {
    const bukuId = req.params.id;
    const { judul, penulis, penerbit, tahun_terbit, isbn, token } = req.body;
    
    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');
        // Cek role dari token
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang bisa melakukan pembaruan buku.' });
        }

        // Data yang akan diperbarui
        const updatedData = {
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            isbn
        };

        // Melakukan pembaruan buku
        // const result = await Buku.updateBuku(token, bukuId, updatedData); ----> Buat functionnya di Model buku -THIO

        // Menangani respons dari hasil pembaruan buku
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
