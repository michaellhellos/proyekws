const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../config/sequelize');

class User extends Model {
    static async addSaldo(id_user, saldoToAdd) {
        try {
            const user = await this.findByPk(id_user);
            if (!user) {
                throw new Error('User not found');
            }
            user.saldo += saldoToAdd;
            await user.save();
            return user;
        } catch (error) {
            console.error('Error adding saldo:', error);
            throw error;
        }
    }

    static async checkAdmin(id_user) {
        try {
            const user = await User.findOne({ where: { id_user } });
            if (!user) {
                throw new Error('User not found');
            }
            return user.role === 'admin';
        } catch (error) {
            console.error('Error checking admin:', error);
            throw error;
        }
    }

    static async beliApiHit(id_user, jumlahApiHit) {
        try {
            const user = await this.findByPk(id_user);
            if (!user) {
                throw new Error('User not found');
            }
            const hargaApiHit = 10; // Harga satu api_hit dalam satuan saldo
            const totalHarga = jumlahApiHit * hargaApiHit;
            if (user.saldo < totalHarga) {
                throw new Error('Saldo tidak mencukupi');
            }
            user.saldo -= totalHarga;
            user.api_hit += jumlahApiHit;
            await user.save();
            return user;
        } catch (error) {
            console.error('Error buying API hits:', error);
            throw error;
        }
    }
}
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
        allowNull: false
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
    saldo: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    api_hit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        onUpdate: Sequelize.NOW
    }
}, {
    sequelize: db,
    modelName: 'User',
    tableName: 'user',
    timestamps: false,
    underscored: true,
    freezeTableName: true
});

module.exports = User;
