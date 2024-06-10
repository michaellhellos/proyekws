const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user')
const fs = require('fs');
const Buku = require('../model/buku.js'); // Sesuaikan path ke model Buku Anda
const ReviewBuku = require('../model/review_buku');
const router = express.Router();
const axios = require('axios')
const upload = require('../config/multer.js');
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
        // Verify token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error('Token verification error:', err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            console.log('Decoded token:', decoded); // Log the decoded token

            // Ensure the decoded token contains the expected structure
            const userId = decoded?.user?.id_user;
            if (!userId) {
                return res.status(400).json({ message: 'Token tidak mengandung informasi pengguna yang valid' });
            }

            // Find user by id_user from token
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
            }

            // Check if user has api_hit
            if (user.api_hit > 0) {
                // Decrease user's api_hit
                user.api_hit--;
                await user.save();
                return res.json({ message: 'Anda berhasil meminjam buku dengan menggunakan api_hit', api_hitSekarang: user.api_hit });
            }

            // Ensure user has enough saldo
            const biayaSewa = 50; // Book rental fee
            if (user.saldo < biayaSewa) {
                return res.status(400).json({ message: 'Saldo tidak mencukupi untuk meminjam buku' });
            }

            // Find book by id_buku
            const buku = await Buku.findByPk(id_buku);

            if (!buku) {
                return res.status(404).json({ message: 'Buku tidak ditemukan' });
            }

            // Perform check to see if book is already borrowed (implement as needed)

            // Deduct user's saldo according to book rental fee
            user.saldo -= biayaSewa;
            await user.save();

            res.json({ message: 'Anda berhasil meminjam buku', saldoSekarang: user.saldo });
        });
    } catch (error) {
        console.error('Server error:', error.message);
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
//ini punya admin bert ini bisa kamu utek utek wes an 
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

            // Pastikan payload token memiliki struktur yang diharapkan
            if (!decoded || !decoded.role) {
                return res.status(403).json({ message: 'Token tidak valid atau tidak memiliki akses.' });
            }

            // Pastikan pengguna memiliki peran admin
            if (decoded.role !== 'admin') {
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
router.put('/admin/buku/update/:id', upload.fields([{ name: 'gambar', maxCount: 1 }, { name: 'fotobuku', maxCount: 1 }]), async (req, res) => {
    const bukuId = req.params.id;
    const { judul, penulis, penerbit, tahun_terbit, isbn, token } = req.body;
    const gambar = req.files['gambar'] ? req.files['gambar'][0].filename : null;
    const fotobuku = req.files['fotobuku'] ? req.files['fotobuku'][0].filename : null;

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');
        console.log('Decoded token:', decoded); // Tambahkan logging untuk payload token

        // Cek role dari token
        if (!decoded || !decoded.user || decoded.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang bisa melakukan pembaruan buku.' });
        }

        // Ambil data buku berdasarkan ID
        let buku = await Buku.findByPk(bukuId);
        if (!buku) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        // Data yang akan diperbarui
        const updatedData = {
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            isbn
        };

        // Jika ada gambar baru, tambahkan ke data yang akan diperbarui
        if (gambar) {
            updatedData.gambar = gambar;
        }

        // Jika ada fotobuku baru, tambahkan ke data yang akan diperbarui
        if (fotobuku) {
            updatedData.fotobuku = fotobuku;
        }

        // Melakukan pembaruan buku
        await buku.update(updatedData);

        // Menangani respons dari hasil pembaruan buku
        res.status(200).json({ message: 'Buku berhasil diperbarui' });
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});
// Endpoint untuk menambahkan buku
function validateBukuData(req, res, next) {
    const { judul, penulis, tahun_terbit } = req.body;

    if (!judul || !penulis) {
        return res.status(400).json({ message: 'Judul dan penulis harus diisi' });
    }

    if (tahun_terbit && (isNaN(tahun_terbit) || tahun_terbit < 1000 || tahun_terbit > new Date().getFullYear())) {
        return res.status(400).json({ message: 'Tahun terbit tidak valid' });
    }

    next();
}

//ngide
router.post('/admin/buku/add', upload.fields([{ name: 'gambar', maxCount: 1 }, { name: 'fotobuku', maxCount: 1 }]), async (req, res) => {
    const { judul, penulis, penerbit, tahun_terbit, isbn, token } = req.body;
    const gambar = req.files['gambar'] ? req.files['gambar'][0].filename : null;
    const fotobuku = req.files['fotobuku'] ? req.files['fotobuku'][0].filename : null;

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');

        // Pemeriksaan kembali apakah decoded memiliki properti user dan role
        if (!decoded || !decoded.user || decoded.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang bisa menambahkan buku.' });
        }

        // Data yang akan ditambahkan
        const newBook = {
            judul,
            penulis,
            penerbit,
            tahun_terbit,
            isbn,
            gambar,
            fotobuku
        };

        // Melakukan penambahan buku
        const buku = await Buku.create(newBook);

        // Menangani respons dari hasil penambahan buku
        res.status(201).json({ message: 'Buku berhasil ditambahkan', buku });
    } catch (error) {
        console.error('Error saat menambahkan buku:', error);

        // Handle Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => ({
                field: err.path,
                message: err.message
            }));
            console.log('Detail error:', errors); // Log detail error
            return res.status(400).json({ message: 'Validasi gagal', errors });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
