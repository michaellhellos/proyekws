const express = require('express');
const app = express();
const db = require("./config/sequelize");
const bukuRoutes = require("./routes/book");
// const reviewBukuRoutes = require("./routes/review_buku");
const userRoutes = require("./routes/user");

app.use(express.json());

// Gunakan hanya satu app.use() untuk menggabungkan ketiga router
app.use("/api", bukuRoutes);
// app.use("/api", reviewBukuRoutes);
app.use("/api", userRoutes);

const PORT = process.env.PORT || 3000;

const init = async () => {
    try {
        await db.authenticate();
        console.log("Database successfully connected!");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error connecting to database:", error);
    }
};

init();
