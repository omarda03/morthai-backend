-- Create database schema for Mor Thai application
-- Using lowercase table names for PostgreSQL compatibility

-- Table: categorie
CREATE TABLE IF NOT EXISTS categorie (
    cat_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomcategorie VARCHAR(255) NOT NULL,
    nomcategorie_fr VARCHAR(255),
    nomcategorie_en VARCHAR(255),
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cartecadeaux
CREATE TABLE IF NOT EXISTS cartecadeaux (
    carteid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme VARCHAR(255) NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: service
CREATE TABLE IF NOT EXISTS service (
    service_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomservice VARCHAR(255) NOT NULL,
    nomservice_fr VARCHAR(255),
    nomservice_en VARCHAR(255),
    description TEXT,
    description_fr TEXT,
    description_en TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    reference VARCHAR(50) UNIQUE,
    images TEXT[], -- Array of image URLs
    cat_uuid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cat_uuid) REFERENCES categorie(cat_uuid) ON DELETE CASCADE
);

-- Table: service_offers (multiple offers per service)
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

CREATE INDEX IF NOT EXISTS idx_service_offers_service ON service_offers(service_uuid);
CREATE INDEX IF NOT EXISTS idx_service_offers_order ON service_offers(service_uuid, display_order);

-- Table: reservation
CREATE TABLE IF NOT EXISTS reservation (
    reservation_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomclient VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    numerotelephone VARCHAR(20) NOT NULL,
    dateres DATE NOT NULL,
    heureres TIME NOT NULL,
    service_uuid UUID NOT NULL,
    modepaiement VARCHAR(50),
    prixtotal DECIMAL(10, 2) NOT NULL,
    nbrpersonne INTEGER DEFAULT 1,
    statusres VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_uuid) REFERENCES service(service_uuid) ON DELETE CASCADE
);

-- Table: offre
CREATE TABLE IF NOT EXISTS offre (
    offre_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombeneficiaire VARCHAR(255) NOT NULL,
    emailbeneficiaire VARCHAR(255) NOT NULL,
    numtelephonebeneficiaire VARCHAR(20) NOT NULL,
    nomenvoyeur VARCHAR(255) NOT NULL,
    note TEXT,
    cartecadeaux UUID NOT NULL,
    service UUID NOT NULL,
    durée INTEGER NOT NULL,
    codeunique VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cartecadeaux) REFERENCES cartecadeaux(carteid) ON DELETE CASCADE,
    FOREIGN KEY (service) REFERENCES service(service_uuid) ON DELETE CASCADE
);

-- Table: users (Admin users)
CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_cat_uuid ON service(cat_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_service_uuid ON reservation(service_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_date ON reservation(dateres);
CREATE INDEX IF NOT EXISTS idx_offre_carte ON offre(cartecadeaux);
CREATE INDEX IF NOT EXISTS idx_offre_service ON offre(service);
CREATE INDEX IF NOT EXISTS idx_offre_code_unique ON offre(codeunique);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

