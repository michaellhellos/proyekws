const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../config/sequelize'); // Sesuaikan path ke file db Anda

class User extends Model{}
User.init({
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
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize: db, // Sambungan ke database
    modelName: 'User', // Nama model
    tableName: 'user', // Nama tabel di database
    timestamps: false, // Menghapus otomatis tambah kolom createdAt dan updatedAt oleh Sequelize
    underscored: true, // Menggunakan snake_case untuk nama kolom dan tabel
    freezeTableName: true // Mencegah Sequelize mengubah nama tabel secara otomatis
});

async function checkAdmin(id_user){
    let findUserById = await User.findOne({where:{id_user: id_user}})
    if(findUserById.role == 'admin'){
        return true
    }
    else{
        return false
    }
}

module.exports = User;
