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
            throw error;
        }
    }
    static async checkAdmin(id_user){
        let findUserById = await User.findOne({where:{id_user: id_user}})
        console.log(findUserById);
        if(findUserById.role == 'admin'){
            return true
        }
        else{
            return false
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
    saldo: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00 // Kolom saldo dengan default 0.00
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
    sequelize: db,
    modelName: 'User',
    tableName: 'user',
    timestamps: false,
    underscored: true,
    freezeTableName: true
});

module.exports = User;
