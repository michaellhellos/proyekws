CREATE DATABASE proyekws2024;

USE proyekws2024;
-- buat table anggota nya
CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nomer_telepon VARCHAR(15),
    dob DATE,
    gender ENUM('Laki-laki', 'Perempuan', 'Lainnya') NOT NULL,
    role ENUM('admin', 'anggota') NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00 -- Tambah kolom saldo dengan default 0.00
);


-- tabel buku nya
CREATE TABLE buku (
    id_buku INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    penulis VARCHAR(255) NOT NULL,
    penerbit VARCHAR(255),
    tahun_terbit YEAR,
    isbn VARCHAR(20) UNIQUE
);
-- buat table riview buku nya 
CREATE TABLE review_buku (
    id_review INT AUTO_INCREMENT PRIMARY KEY,
    id_buku INT NOT NULL,
    id_anggota INT NOT NULL,
    rating INT NOT NULL,
    komentar TEXT,
    tanggal_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_buku) REFERENCES buku(id_buku),
    FOREIGN KEY (id_anggota) REFERENCES user(id_user)
);

ALTER TABLE user
ADD password VARCHAR(255) NOT NULL;
ALTER TABLE user
   ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


ALTER TABLE user
ADD COLUMN api_hit INT NOT NULL DEFAULT 0;
ALTER TABLE `user` ADD COLUMN `profile_image` VARCHAR(255);

INSERT INTO buku (judul, penulis, penerbit, tahun_terbit, isbn) VALUES
('Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Bloomsbury Publishing', 1997, '9780747532743'),
('To Kill a Mockingbird', 'Harper Lee', 'J.B. Lippincott & Co.', 1960, '9780061120084'),
('The Great Gatsby', 'F. Scott Fitzgerald', 'Charles Scribner''s Sons', 1925, '9780743273565'),
('1984', 'George Orwell', 'Secker & Warburg', 1949, '9780451524935'),
('The Catcher in the Rye', 'J.D. Salinger', 'Little, Brown and Company', 1951, '9780316769488');
ALTER TABLE buku ADD COLUMN gambar VARCHAR(255);
ALTER TABLE buku ADD COLUMN fotobuku VARCHAR(255);
