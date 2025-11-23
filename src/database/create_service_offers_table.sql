-- Migration script to create service_offers table
-- This table stores multiple offers (duration + prices) for each service

-- Create service_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_offers (
    offer_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_uuid UUID NOT NULL,
    durée INTEGER NOT NULL, -- Duration in minutes
    prix_mad DECIMAL(10, 2) NOT NULL, -- Price in Moroccan Dirham
    prix_eur DECIMAL(10, 2) NOT NULL, -- Price in Euro
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_uuid) REFERENCES service(service_uuid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_offers_service ON service_offers(service_uuid);
CREATE INDEX IF NOT EXISTS idx_service_offers_order ON service_offers(service_uuid, display_order);

