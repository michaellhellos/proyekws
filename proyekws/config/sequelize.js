const Sequelize = require("sequelize");

const db = new Sequelize(
    "proyekws2024",
    "root",
    "", {
        host: "localhost",
        port: 3306,
        dialect: "mysql",
        logging: true,
        timezone: "+07:00",
        define: {
            timestamps: true, // Menambahkan createdAt dan updatedAt
            underscored: true, // Menggunakan snake_case untuk nama kolom dan tabel
            freezeTableName: true // Mencegah Sequelize mengubah nama tabel secara otomatis
        }
    }
);

module.exports = db;
