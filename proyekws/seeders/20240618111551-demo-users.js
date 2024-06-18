"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add seed commands here
    await queryInterface.bulkInsert(
      "user",
      [
        {
          id_user: 1,
          nama: "Admin User",
          email: "admin@example.com",
          password: "adminpassword", // Sebaiknya password di-hash sebelum disimpan
          nomer_telepon: "08123456789",
          dob: "1980-01-01",
          gender: "Laki-laki",
          role: "admin",
          saldo: 1000000.0,
          api_hit: 100,
          profile_image: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id_user: 2,
          nama: "Regular User",
          email: "user@example.com",
          password: "userpassword", // Sebaiknya password di-hash sebelum disimpan
          nomer_telepon: "08987654321",
          dob: "1990-05-15",
          gender: "Perempuan",
          role: "anggota",
          saldo: 50000.0,
          api_hit: 10,
          profile_image: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Add commands to revert seed here
    await queryInterface.bulkDelete("user", null, {});
  },
};
