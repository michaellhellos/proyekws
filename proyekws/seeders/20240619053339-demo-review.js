"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add seed commands here
    await queryInterface.bulkInsert(
      "review_buku",
      [
        {
          id_review: 1,
          id_buku: 19,
          id_anggota: 14,
          rating: 4,
          komentar: "bukunya bagus banget!",
          tanggal_review: new Date(),
        },
        {
          id_review: 2,
          id_buku: 3,
          id_anggota: 6,
          rating: 5,
          komentar: "masterpiece!",
          tanggal_review: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Add commands to revert seed here
    await queryInterface.bulkDelete("review_buku", null, {});
  },
};
