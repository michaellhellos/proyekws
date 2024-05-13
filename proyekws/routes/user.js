const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user'); // Sesuaikan path ke model User Anda

router.get('/', (req, res) => {
    res.render('register'); // Anda dapat mengganti 'register' dengan nama view register Anda
});

router.post('/register', async (req, res) => {
    const { nama, email, password, nomer_telepon, dob, gender, role, saldoToAdd } = req.body;

    try {
        let user = await User.findOne({ where: { email: email } });

        if (user) {
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            nama,
            email,
            password: hashedPassword,
            nomer_telepon,
            dob,
            gender,
            role,
            saldo: saldoToAdd // Menambahkan saldo awal saat pendaftaran
        });

        res.json({ message: `Email ${user.email} berhasil terdaftar` });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

//login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Cari user berdasarkan email
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // Bandingkan password yang dimasukkan dengan yang tersimpan di database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        // Data user yang akan dimasukkan ke dalam token
        const userData = {
            id_user: user.id_user,
            nama: user.nama,
            email: user.email,
            dob: user.dob,
            gender: user.gender,
            role: user.role
        };

        // Buat token JWT
        jwt.sign(userData, 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server Error' });
            }
            res.json({ token, user: userData });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


//tambah saldo
router.post('/user/add-saldo', async (req, res) => {
    const { token, saldoToAdd } = req.body;

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

            // Tambahkan saldo ke saldo pengguna yang ada
            user.saldo += saldoToAdd;
            await user.save();

            res.json({ message: 'Saldo berhasil ditambahkan', saldo: user.saldo });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
router.post('/user/beli-api-hit', async (req, res) => {
    const { token, jumlahApiHit } = req.body;

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

            // Memanggil metode beliApiHit untuk memproses pembelian api_hit
            await User.beliApiHit(userId, jumlahApiHit);

            res.json({ message: 'Pembelian api_hit berhasil', saldo: user.saldo, api_hit: user.api_hit });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
