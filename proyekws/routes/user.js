const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../model/user"); // Adjust the path to your User model

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the dynamically created directory
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ); // File name
  },
});

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
});

router.post("/register", upload.single("profile_image"), async (req, res) => {
  const {
    nama,
    email,
    password,
    nomer_telepon,
    dob,
    gender,
  } = req.body;

  // Common validation for all registrations
  if (!nama || !email || !password || !nomer_telepon || !dob || !gender) {
    return res.status(400).json({ message: "Field tidak boleh kosong!" });
  }

  const profileImage = req.file ? req.file.filename : null;

  // Determine role based on profile image presence
  const role = profileImage ? 'anggota' : 'admin';

  try {
    // Log the input data for debugging
    console.log("Request Body:", req.body);

    let user = await User.findOne({ where: { email: email } });

    // Log the query result for debugging
    console.log("User Query Result:", user);

    if (user) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
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
      saldo: 1000, // Set default balance to 1000
      profile_image: profileImage, // Save the file name in the database if it exists
    });

    if (role === 'anggota') {
      res.status(201).json({ message: `Selamat, email ${user.email} terdaftar sebagai anggota!` });
    } else {
      res.status(201).json({ message: `Selamat, email ${user.email} terdaftar dengan role admin!` });
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});
//login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Field tidak boleh kosong!" });
  }

  try {
    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // Bandingkan password yang dimasukkan dengan yang tersimpan di database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

    // Data user yang akan dimasukkan ke dalam token
    const userData = {
      id_user: user.id_user,
      nama: user.nama,
      email: user.email,
      dob: user.dob,
      gender: user.gender,
      role: user.role,
    };

    // Buat token JWT
    jwt.sign(userData, "your_jwt_secret", { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server Error" });
      }
      res.status(200).json({ token, user: userData });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

//tambah saldo
router.post("/user/saldo", async (req, res) => {
  const { token, saldoToAdd } = req.body;

  if (!token || !saldoToAdd) {
    return res.status(400).json({ message: "Field tidak boleh kosong!" });
  }

  try {
    // Verifikasi token
    jwt.verify(token, "your_jwt_secret", async (err, decoded) => {
      if (err) {
        console.error(err.message);
        return res.status(401).json({ message: "Token tidak valid!" });
      }

      const userId = decoded.id_user; // Mengakses langsung id_user dari decoded

      // Cari pengguna berdasarkan id_user dari token
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan!" });
      }

      // Tambahkan saldo ke saldo pengguna yang ada
      user.saldo += saldoToAdd;
      await user.save();

      res.status(200).json({
        message: "Saldo user berhasil ditambahkan",
        saldo: user.saldo,
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/user/member", async (req, res) => {
  const { token, jumlahApiHit } = req.body;

  if (!token || !jumlahApiHit) {
    return res.status(400).json({ message: "Field tidak boleh kosong!" });
  }

  try {
    // Verifikasi token
    jwt.verify(token, "your_jwt_secret", async (err, decoded) => {
      if (err) {
        console.error(err.message);
        return res.status(401).json({ message: "Token tidak valid!" });
      }

      const userId = decoded.id_user; // Mengakses langsung id_user dari decoded

      // Cari pengguna berdasarkan id_user dari token
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan!" });
      }

      // Memanggil metode beliApiHit untuk memproses pembelian api_hit
      await User.beliApiHit(userId, jumlahApiHit);

      // Refresh data user setelah pembelian api_hit
      await user.reload();

      res.status(200).json({
        message: "Pembelian api_hit berhasil",
        saldo: user.saldo,
        api_hit: user.api_hit,
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});
// melihat semua user yang terdaftar
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//bisa hapus user nya
router.delete("/user/:id", async (req, res) => {
  const { token } = req.body;
  const userIdToDelete = req.params.id;

  if (!token || !userIdToDelete) {
    return res.status(400).json({ message: "Field tidak boleh kosong!" });
  }

  try {
    // Verifikasi token
    jwt.verify(token, "your_jwt_secret", async (err, decoded) => {
      if (err) {
        console.error(err.message);
        return res.status(401).json({ message: "Token tidak valid" });
      }

      const userId = decoded.id_user; // Mengakses langsung id_user dari decoded

      // Cari pengguna berdasarkan id_user dari token
      const adminUser = await User.findByPk(userId);

      if (!adminUser) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }

      // Pastikan pengguna yang mencoba menghapus adalah admin
      if (adminUser.role !== "admin") {
        return res.status(403).json({
          message: "Akses ditolak, hanya admin yang dapat menghapus pengguna!",
        });
      }

      // Cari pengguna yang ingin dihapus berdasarkan ID
      const userToDelete = await User.findByPk(userIdToDelete);

      if (!userToDelete) {
        return res
          .status(404)
          .json({ message: "Pengguna yang ingin dihapus tidak ditemukan!" });
      }

      // Hapus pengguna
      await userToDelete.destroy();

      res.json({
        message: `Pengguna dengan ID ${userIdToDelete} berhasil dihapus!`,
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
