-- Create database schema for Mor Thai application
-- Using lowercase table names for PostgreSQL compatibility

-- Table: categorie
CREATE TABLE IF NOT EXISTS categorie (
    cat_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomcategorie VARCHAR(255) NOT NULL,
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
    description TEXT,
    images TEXT[], -- Array of image URLs
    durée INTEGER NOT NULL, -- Duration in minutes
    prix DECIMAL(10, 2) NOT NULL,
    cat_uuid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cat_uuid) REFERENCES categorie(cat_uuid) ON DELETE CASCADE
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_cat_uuid ON service(cat_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_service_uuid ON reservation(service_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_date ON reservation(dateres);
CREATE INDEX IF NOT EXISTS idx_offre_carte ON offre(cartecadeaux);
CREATE INDEX IF NOT EXISTS idx_offre_service ON offre(service);
CREATE INDEX IF NOT EXISTS idx_offre_code_unique ON offre(codeunique);

