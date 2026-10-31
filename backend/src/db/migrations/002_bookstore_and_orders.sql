-- InspireUp Migration 002: Bookstore and Orders Schema
-- Non-destructive, idempotent DDL for Online Book Purchase Feature

-- 1. Books Catalogue Table
CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_tamil VARCHAR(255),
  author VARCHAR(255) NOT NULL DEFAULT 'Madurai V Ramakrishnan (MVR)',
  category VARCHAR(128) NOT NULL,
  price INTEGER NOT NULL, -- Stored in INR (₹)
  mrp INTEGER NOT NULL,   -- Original MRP for discount display
  stock_quantity INTEGER NOT NULL DEFAULT 50,
  description TEXT NOT NULL,
  full_synopsis TEXT,
  format VARCHAR(128) DEFAULT 'Paperback',
  pages INTEGER DEFAULT 240,
  language VARCHAR(64) DEFAULT 'English',
  badge VARCHAR(64),
  isbn VARCHAR(32),
  cover_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_category ON books (category);
CREATE INDEX IF NOT EXISTS idx_books_stock ON books (stock_quantity);

-- 2. Book Orders Table
CREATE TABLE IF NOT EXISTS book_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  shipping_address TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  pincode VARCHAR(32) NOT NULL,
  delivery_notes TEXT,
  items JSONB NOT NULL,
  subtotal_amount INTEGER NOT NULL,
  shipping_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method VARCHAR(64) NOT NULL DEFAULT 'razorpay',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  payment_id VARCHAR(128),
  razorpay_order_id VARCHAR(128),
  razorpay_signature VARCHAR(255),
  fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'placed', -- 'placed' | 'processing' | 'shipped' | 'delivered'
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_orders_order_number ON book_orders (order_number);
CREATE INDEX IF NOT EXISTS idx_book_orders_email ON book_orders (email);
CREATE INDEX IF NOT EXISTS idx_book_orders_idempotency ON book_orders (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_book_orders_status ON book_orders (payment_status, fulfillment_status);
