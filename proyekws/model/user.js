const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/sequelize'); // Sesuaikan path ke file db Anda

const User = db.define('User', {
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false // Password harus ada dan tidak boleh null
    },
    nomer_telepon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan', 'Lainnya'),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'anggota'),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
}, {
    tableName: 'user', // Nama tabel di database
    timestamps: false, // Menghapus otomatis tambah kolom createdAt dan updatedAt oleh Sequelize
    underscored: true, // Menggunakan snake_case untuk nama kolom dan tabel
    freezeTableName: true // Mencegah Sequelize mengubah nama tabel secara otomatis
});

module.exports = User;
