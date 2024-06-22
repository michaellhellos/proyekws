const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../config/sequelize');

class Buku extends Model {
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

    static getYearFromUnixTime(timestamp) {
        const date = new Date(timestamp);
        return date.getFullYear();
    }
}

Buku.init({
    id_buku: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        allowNull: false
    },
    tahun_terbit: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gambar: {
        type: DataTypes.STRING
    },
    fotobuku: {
        type: DataTypes.STRING
    }
}, {
    sequelize: db,
    modelName: 'Buku', // Nama model harus sesuai dengan nama yang Anda gunakan di aplikasi Anda
    tableName: 'buku',
    timestamps: false // Jika Anda tidak menggunakan timestamps createdAt dan updatedAt
});

Buku.updateBuku = async (bukuId, updatedData) => {
    try {
        const buku = await Buku.findByPk(bukuId);
        if (!buku) {
            return { success: false, message: 'Buku tidak ditemukan' };
        }

        // Melakukan pembaruan buku
        await buku.update(updatedData);

        // Menangani respons dari hasil pembaruan buku
        return { success: true, message: 'Buku berhasil diperbarui' };
    } catch (error) {
        console.error('Error saat memperbarui buku:', error);

        // Tambahkan penanganan khusus untuk error validasi
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => ({
                field: err.path,
                message: err.message
            }));
            console.error('Errors:', errors);
            return { success: false, message: 'Validasi gagal saat memperbarui buku', errors };
        }

        return { success: false, message: 'Terjadi kesalahan saat memperbarui buku' };
    }
};

module.exports = Buku;
