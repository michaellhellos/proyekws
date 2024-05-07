const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../config/sequelize');

class Buku extends Model{
    static generateRandomName() {
        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        const nameLength = Math.floor(Math.random() * 3) + 3; // Panjang nama antara 3 hingga 5 huruf
        let randomName = '';
    
        for (let i = 0; i < nameLength; i++) {
            if (i % 2 === 0) { // Huruf pertama dan ketiga adalah konsonan
                randomName += consonants.charAt(Math.floor(Math.random() * consonants.length));
            } else { // Huruf kedua dan keempat adalah vokal
                randomName += vowels.charAt(Math.floor(Math.random() * vowels.length));
            }
        }
    
        return randomName.charAt(0).toUpperCase() + randomName.slice(1); // Awal nama diubah menjadi huruf besar
    }
}

Buku.init({
    id_buku: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    judul: {
        type: DataTypes.STRING,
        allowNull: false
    },
    penulis: {
        type: DataTypes.STRING,
        allowNull: false
    },
    penerbit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tahun_terbit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
}, {
    sequelize: db,
    tableName: 'buku',
    timestamps: false
});

module.exports = Buku;
