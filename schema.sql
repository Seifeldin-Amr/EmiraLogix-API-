-- Create customers table
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  chat_id BIGINT, -- Telegram chat_id
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop and recreate orders (linked to customers, not chat_id directly)
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  driver_id BIGINT REFERENCES drivers(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Keep existing drivers table (if it exists)
CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_location_update TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_chat_id ON customers(chat_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_id ON orders(order_id);

-- Insert sample customers
INSERT INTO customers (customer_name, phone, chat_id, address) VALUES
('John Doe', '+1234567890', 123456789, '123 Main St, New York, NY'),
('Jane Smith', '+0987654321', 987654321, '456 Oak Ave, Los Angeles, CA'),
('Bob Johnson', '+1122334455', 555666777, '789 Pine Rd, Chicago, IL');

-- Insert sample orders
INSERT INTO orders (order_id, customer_id, address, lat, lng, status) VALUES
('ORD-001', 1, '123 Main St, New York, NY', 40.7128, -74.0060, 'pending'),
('ORD-002', 2, '456 Oak Ave, Los Angeles, CA', 34.0522, -118.2437, 'assigned'),
('ORD-003', 3, '789 Pine Rd, Chicago, IL', 41.8781, -87.6298, 'delivered');

-- Insert sample drivers
INSERT INTO drivers (name, phone, vehicle_type, license_plate, lat, lng, status) VALUES
('Mike Wilson', '+1555123456', 'car', 'ABC123', 40.7500, -74.0000, 'available'),
('Sarah Johnson', '+1555987654', 'motorcycle', 'XYZ789', 34.0600, -118.2500, 'busy'),
('David Brown', '+1555456789', 'van', 'DEF456', 41.8800, -87.6400, 'available');

-- Enable Row Level Security (optional, for production)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (optional, customize based on your authentication needs)
-- CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
