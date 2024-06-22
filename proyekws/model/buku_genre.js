const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Buku = require('./buku');
const Genre = require('./genre');

const BukuGenre = sequelize.define('BukuGenre', {
    id_buku: {
        type: DataTypes.INTEGER,
        references: {
            model: Buku,
            key: 'id'
        }
    },
    id_genre: {
        type: DataTypes.INTEGER,
        references: {
            model: Genre,
            key: 'id'
        }
    }
}, {
    tableName: 'buku_genre',
    timestamps: false
});

Buku.belongsToMany(Genre, { through: BukuGenre, foreignKey: 'id_buku' });
Genre.belongsToMany(Buku, { through: BukuGenre, foreignKey: 'id_genre' });

module.exports = BukuGenre;
