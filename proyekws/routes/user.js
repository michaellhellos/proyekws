const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../model/user'); // Adjust the path to your User model

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Use the dynamically created directory
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // File name
    }
});

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check file type
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

router.post('/register', upload.single('profile_image'), async (req, res) => {
    const { nama, email, password, nomer_telepon, dob, gender, role, saldoToAdd } = req.body;
    const profileImage = req.file ? req.file.filename : null;

    try {
        // Log the input data for debugging
        console.log('Request Body:', req.body);

        let user = await User.findOne({ where: { email: email } });

        // Log the query result for debugging
        console.log('User Query Result:', user);

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
            saldo: saldoToAdd,
            profile_image: profileImage // Save the file name in the database
        });

        res.json({ message: `Email ${user.email} berhasil terdaftar` });

    } catch (error) {
        // Log the error for debugging
        console.error('Server Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;

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
router.post('/user/saldo', async (req, res) => {
    const { token, saldoToAdd } = req.body;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error(err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            const userId = decoded.id_user; // Mengakses langsung id_user dari decoded

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
router.post('/user/member', async (req, res) => {
    const { token, jumlahApiHit } = req.body;

    try {
        // Verifikasi token
        jwt.verify(token, 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                console.error(err.message);
                return res.status(401).json({ message: 'Token tidak valid' });
            }

            const userId = decoded.id_user; // Mengakses langsung id_user dari decoded

            // Cari pengguna berdasarkan id_user dari token
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
            }

            // Memanggil metode beliApiHit untuk memproses pembelian api_hit
            await User.beliApiHit(userId, jumlahApiHit);

            // Refresh data user setelah pembelian api_hit
            await user.reload();

            res.json({ message: 'Pembelian api_hit berhasil', saldo: user.saldo, api_hit: user.api_hit });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
module.exports = router;
