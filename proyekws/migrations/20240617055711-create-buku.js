"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("buku", {
      id_buku: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      judul: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penulis: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      penerbit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tahun_terbit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          isInt: true,
          min: 1000,
          max: new Date().getFullYear(),
        },
      },
      isbn: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      gambar: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fotobuku: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("buku");
  },
};
