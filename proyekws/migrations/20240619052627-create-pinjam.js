"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pinjaman", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      buku_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tanggal_pinjam: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      tanggal_kembali: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pinjaman");
  },
};
