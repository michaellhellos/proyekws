const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');
const Buku = require('./buku');
const Anggota = require('./user');

class ReviewBuku extends Model {}

ReviewBuku.init({
  id_review: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_buku: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Buku,
      key: 'id_buku'
    }
  },
  id_anggota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Anggota,
      key: 'id_anggota'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'Rating harus lebih besar dari atau sama dengan 1'
      },
      max: {
        args: 5,
        msg: 'Rating harus kurang dari atau sama dengan 5'
      }
    }
  },
  komentar: {
    type: DataTypes.TEXT
  },
  tanggal_review: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ReviewBuku',
  tableName: 'review_buku',
  timestamps: true // Menggunakan timestamps
});

module.exports = ReviewBuku;
