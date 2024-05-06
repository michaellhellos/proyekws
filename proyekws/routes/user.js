const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user'); // Sesuaikan path ke model User Anda

router.get('/', (req, res) => {
    res.render('register'); // Anda dapat mengganti 'register' dengan nama view register Anda
});

router.post('/register', async (req, res) => {
  const { nama, email, password, nomer_telepon, dob, gender, role } = req.body;

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
          role
      });

      // Menghilangkan password dari respons
      const userData = {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          nomer_telepon: user.nomer_telepon,
          dob: user.dob,
          gender: user.gender,
          role: user.role
      };

      const payload = {
          user: userData
      };

      jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
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
//login
router.post('/login', async (req, res) => {
  const token = req.body.token; // Ambil token dari body request

  if (!token) {
      return res.status(401).json({ message: 'Token tidak tersedia, silakan login kembali' });
  }

  try {
      const decoded = jwt.verify(token, 'your_jwt_secret'); // Verifikasi token

      const user = await User.findByPk(decoded.user.id_user); // Cari user berdasarkan id_user yang ada di token

      if (!user) {
          return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      // Menghilangkan password dari respons
      console.log("anda berhasil login");
      const userData = {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          dob: user.dob,
          gender: user.gender,
          role: user.role
      };

      res.json(userData);

  } catch (error) {
      console.error(error.message);

      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Token tidak valid, silakan login kembali' });
      }

      res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;
