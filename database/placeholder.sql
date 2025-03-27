-- Create a simple placeholder database
CREATE DATABASE PlaceholderDB;

-- Use the created database
USE PlaceholderDB;

-- Create a sample table for users
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a sample table for products
CREATE TABLE Products (
    ProductID INT PRIMARY KEY AUTO_INCREMENT,
    ProductName VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    Stock INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some placeholder data into Users
INSERT INTO Users (Username, Email) VALUES
('JohnDoe', 'john.doe@example.com'),
('JaneSmith', 'jane.smith@example.com'),
('AliceBrown', 'alice.brown@example.com');

-- Insert some placeholder data into Products
INSERT INTO Products (ProductName, Price, Stock) VALUES
('Laptop', 999.99, 10),
('Smartphone', 499.99, 25),
('Headphones', 49.99, 50);

-- Query to verify the data
SELECT * FROM Users;
SELECT * FROM Products;