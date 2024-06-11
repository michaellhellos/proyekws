// models/pinjaman.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Sesuaikan path ke file konfigurasi database Anda

const Pinjaman = sequelize.define('Pinjaman', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User',
            key: 'id_user'
        }
    },
    buku_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Buku',
            key: 'id_buku'
        }
    },
    tanggal_pinjam: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    tanggal_kembali: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'pinjaman', // Sesuaikan dengan nama tabel Anda
    timestamps: false
});

module.exports = Pinjaman;
