const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user')
const fs = require('fs');
const Buku = require('../model/buku.js'); // Sesuaikan path ke model Buku Anda
const ReviewBuku = require('../model/review_buku');
const router = express.Router();
const axios = require('axios')
const path = require('path');
const upload = require('../config/multer.js');
const Pinjaman = require('../model/pinjaman');
const BukuGenre = require('../model/buku_genre');
const Genre = require('../model/genre');


router.post('/genre', async (req, res) => {
    const { tipe_genre } = req.body;

    try {
        // Buat genre baru menggunakan model Genre
        const genre = await Genre.create({ tipe_genre });

        res.status(201).json({ message: 'Tipe genre berhasil ditambahkan', genre });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Gagal menambahkan tipe genre' });
    }
});
//delete
router.delete('/genre/:id_genre', async (req, res) => {
    const { id_genre } = req.params;

    try {
        // Cari genre berdasarkan id_genre
        const genre = await Genre.findByPk(id_genre);
        if (!genre) {
            return res.status(404).json({ message: 'Genre tidak ditemukan' });
        }

        // Hapus genre
        await genre.destroy();

        res.status(200).json({ message: 'Genre berhasil dihapus' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Gagal menghapus genre' });
    }
});
//update
router.put('/genre/:id_genre', async (req, res) => {
    const { id_genre } = req.params;
    const { tipe_genre } = req.body;

    try {
        // Cari genre berdasarkan id_genre
        let genre = await Genre.findByPk(id_genre);
        if (!genre) {
            return res.status(404).json({ message: 'Genre tidak ditemukan' });
        }

        // Lakukan pembaruan data genre
        genre.tipe_genre = tipe_genre; // Update field tipe_genre

        // Simpan perubahan ke database
        await genre.save();

        res.status(200).json({ message: 'Genre berhasil diperbarui', genre });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Gagal memperbarui genre' });
    }
});

//nambah genre
router.post('/admin/tambah-genre', async (req, res) => {
    const { id_buku, id_genre } = req.body;

    try {
        // Cari buku berdasarkan id_buku
        const buku = await Buku.findByPk(id_buku);
        if (!buku) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        // Cari genre berdasarkan id_genre
        const genre = await Genre.findByPk(id_genre);
        if (!genre) {
            return res.status(404).json({ message: 'Genre tidak ditemukan' });
        }

        // Tambahkan genre ke buku menggunakan tabel buku_genre
        await BukuGenre.create({
            id_buku: id_buku,
            id_genre: id_genre
        });

        res.status(201).json({ message: 'Genre berhasil ditambahkan ke buku' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
//update
router.put('/admin/update-genre', async (req, res) => {
    const { id_buku, id_genre } = req.body;

    try {
        // Cari buku berdasarkan id_buku
        const buku = await Buku.findByPk(id_buku);
        if (!buku) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        // Cari genre berdasarkan id_genre
        const genre = await Genre.findByPk(id_genre);
        if (!genre) {
            return res.status(404).json({ message: 'Genre tidak ditemukan' });
        }

        // Perbarui atau tambahkan genre ke buku menggunakan tabel buku_genre
        const [updated, updatedRows] = await BukuGenre.upsert({
            id_buku: id_buku,
            id_genre: id_genre
        });

        if (updatedRows === 0) {
            return res.status(200).json({ message: 'Genre sudah ada pada buku' });
        }

        res.status(200).json({ message: 'Genre berhasil diperbarui pada buku' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});




//Endpoint untuk search buku dari rapid api
router.get('/admin/explore/list', async(req, res)=>{
    let token = req.header('x-auth-token')
    try{
        let dataUser = jwt.verify(token, 'your_jwt_secret')
        let adminChecker = await User.checkAdmin(dataUser.user.id_user)
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
        let adminChecker = await User.checkAdmin(dataUser.user.id_user)
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
            tahun_terbit: Buku.getYearFromUnixTime(findManga.data.data.create_at),
            gambar: findManga.data.data.thumb
        })
        return res.status(201).json({message: `Buku dengan judul ${newBook.judul} berhasil ditambahkan kedalam database!`})
    } catch(err){
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

// router.post('/buku/review', async (req, res) => {
//     const { id_buku, id_anggota, rating, komentar, token } = req.body;

//     try {
//         // Verifikasi token
//         const decoded = jwt.verify(token, 'your_jwt_secret');

//         // Buat review baru menggunakan model ReviewBuku
//         const review = await ReviewBuku.create({
//             id_buku,
//             id_anggota,
//             rating,
//             komentar
//         });

//         res.status(201).json({ message: 'Review buku berhasil ditambahkan', review });
//     } catch (error) {
//         console.error(error.message);
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(401).json({ message: 'Token tidak valid' });
//         }
//         res.status(500).json({ message: 'Server Error' });
//     }
// });
router.delete('/buku/review/:id_review', async (req, res) => {
    const { id_review } = req.params;
    const { token } = req.body;

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');

        // Cari review berdasarkan id_review
        const review = await ReviewBuku.findByPk(id_review);
        if (!review) {
            return res.status(404).json({ message: 'Review tidak ditemukan' });
        }

        // Hapus review
        await review.destroy();

        res.status(200).json({ message: 'Review buku berhasil dihapus' });
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/buku/listriview', async (req, res) => {
    try {
        // Mengambil semua buku dari database menggunakan model Buku
        const reviewBuku = await ReviewBuku.findAll();

        // Mengembalikan data buku dalam respons
        res.status(200).json({ reviewBuku });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
router.put('/buku/review/:id_review', async (req, res) => {
    const { id_review } = req.params;
    const { id_buku, id_anggota, rating, komentar, token } = req.body;

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');

        // Cari review berdasarkan id_review
        const review = await ReviewBuku.findByPk(id_review);
        if (!review) {
            return res.status(404).json({ message: 'Review tidak ditemukan' });
        }

        // Update review dengan data yang baru
        review.id_buku = id_buku !== undefined ? id_buku : review.id_buku;
        review.id_anggota = id_anggota !== undefined ? id_anggota : review.id_anggota;
        review.rating = rating !== undefined ? rating : review.rating;
        review.komentar = komentar !== undefined ? komentar : review.komentar;

        // Simpan perubahan
        await review.save();

        res.status(200).json({ message: 'Review buku berhasil diupdate', review });
    } catch (error) {
        console.error(error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});
router.post('/buku/review', async (req, res) => {
    const { id_buku, id_anggota, rating, komentar, tanggal_review, token } = req.body;

    // Debugging: Log request body
    console.log(req.body);

    // Validasi input
    if (!id_buku || !id_anggota || rating === undefined || rating === null || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Data review tidak lengkap atau tidak valid' });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');

        // Format tanggal_review
        let formattedTanggalReview;
        if (tanggal_review) {
            const parts = tanggal_review.split('/'); // Format DD/MM/YYYY
            formattedTanggalReview = new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM, DD
        } else {
            formattedTanggalReview = new Date();
        }

        // Buat review baru menggunakan model ReviewBuku
        const review = await ReviewBuku.create({
            id_buku,
            id_anggota,
            rating,
            komentar,
            tanggal_review: formattedTanggalReview // Pastikan format tanggal sesuai dengan yang diharapkan oleh Sequelize
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
router.post('/buku/beli', async (req, res) => {
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
                // Insert data peminjaman buku
                await Pinjaman.create({
                    user_id: userId,
                    buku_id: id_buku
                });
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

            // Insert data peminjaman buku
            await Pinjaman.create({
                user_id: userId,
                buku_id: id_buku
            });

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
router.post('/download-buku/:id', async (req, res) => {
    const bukuId = req.params.id;
    const { token } = req.body; // Get the token from the request body

    if (!token) {
        return res.status(401).json({ message: 'Token tidak diberikan' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret'); // Verify the JWT token

        if (!decoded || !decoded.user) {
            return res.status(401).json({ message: 'Token tidak valid' });
        }

        const userId = decoded.user.id_user;
        console.log(`User ID from token: ${userId}`);

        // Fetch user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }

        // Fetch book by ID
        const buku = await Buku.findByPk(bukuId);
        if (!buku) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        // Check if the book has an associated file
        if (!buku.fotobuku) {
            return res.status(404).json({ message: 'Buku tidak memiliki file fotobuku' });
        }

        // Check if the user has borrowed the book
        const pinjaman = await Pinjaman.findOne({ where: { user_id: userId, buku_id: bukuId } });
        if (!pinjaman) {
            return res.status(403).json({ message: 'Anda belum meminjam buku ini' });
        }

        // Construct the file path
        const filePath = path.join(__dirname, '../uploads', buku.fotobuku);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).json({ message: 'File fotobuku tidak ditemukan' });
        }

        console.log(`Sending file: ${filePath}`);

        // Send the file as a response with the appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename=${buku.fotobuku}`);
        res.sendFile(filePath);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});
//ini punya admin bert ini bisa kamu utek utek wes an 
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

//admin bisa hapus buku
router.delete('/hapus-buku/:id', async (req, res) => {
    const { token } = req.body;
    const bukuId = req.params.id;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error('JWT Error:', err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            console.log('Decoded token:', decoded);

            // Pastikan payload token memiliki struktur yang diharapkan
            if (!decoded || !decoded.user || !decoded.user.role) {
                return res.status(403).json({ message: 'Token tidak valid atau tidak memiliki akses.' });
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
        console.error('Server Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
//update buku 
router.put('/admin/buku/update/:id', upload.fields([{ name: 'gambar', maxCount: 1 }, { name: 'fotobuku', maxCount: 1 }]), async (req, res) => {
    const bukuId = req.params.id;
    const { judul, penulis, penerbit, tahun_terbit, isbn, token } = req.body;
    const gambar = req.files['gambar'] ? req.files['gambar'][0].filename : null;
    const fotobuku = req.files['fotobuku'] ? req.files['fotobuku'][0].filename : null;

    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, 'your_jwt_secret');
        console.log('Decoded token:', decoded);

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

        // Validasi input
        if (judul && typeof judul !== 'string') return res.status(400).json({ message: 'Judul tidak valid' });
        if (penulis && typeof penulis !== 'string') return res.status(400).json({ message: 'Penulis tidak valid' });
        if (penerbit && typeof penerbit !== 'string') return res.status(400).json({ message: 'Penerbit tidak valid' });
        if (tahun_terbit && isNaN(Number(tahun_terbit))) return res.status(400).json({ message: 'Tahun terbit tidak valid' });
        if (isbn && typeof isbn !== 'string') return res.status(400).json({ message: 'ISBN tidak valid' });

        // Jika ada gambar baru, tambahkan ke data yang akan diperbarui
        if (gambar) {
            updatedData.gambar = gambar;
        }

        // Jika ada fotobuku baru, tambahkan ke data yang akan diperbarui
        if (fotobuku) {
            updatedData.fotobuku = fotobuku;
        }

        // Logging data yang akan diperbarui
        console.log('Updated data:', updatedData);

        // Melakukan pembaruan buku
        await buku.update(updatedData);

        // Menangani respons dari hasil pembaruan buku
        res.status(200).json({ message: 'Buku berhasil diperbarui' });
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token tidak valid' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// Endpoint untuk menambahkan buku

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
