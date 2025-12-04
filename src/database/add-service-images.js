import dotenv from 'dotenv';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend public folder
const FRONTEND_PUBLIC_PATH = path.join(__dirname, '../../../morthai/public');
// Path to backend uploads folder (should match app.js static path)
// app.js serves from '../uploads' relative to src/, so it's morthai-backend/uploads/
const BACKEND_UPLOADS_PATH = path.join(__dirname, '../../uploads');

/**
 * Get service image mapping based on exact service names in database
 * Maps service titles to image paths from services-data.ts
 */
function getServiceImageMap() {
  // Complete mapping of all services in database to their images
  return {
    // Massages
    "Thaï Ancestral en Kimono": "/massages/1.webp",
    "Ancestral Thai in Kimono": "/massages/1.webp",
    "Harmonie Énergétique Thaï": "/massages/2.jpg",
    "Thai Energy Harmony": "/massages/2.jpg",
    "Toucher Anti-Stress Curatif | Signature MorThai": "/massages/3.jpg",
    "Healing Anti-Stress Touch | MorThai Signature": "/massages/3.jpg",
    "Berceau des Paumes": "/massages/4.jpg",
    "Cradle of Palms": "/massages/4.jpg",
    "Secret des Herbes Médicinales de Kalasin": "/massages/5.jpg",
    "Secret of Medicinal Herbs from Kalasin": "/massages/5.jpg",
    "Moment Sacré Maman à Venir": "/massages/6.jpg",
    "Mum to be Sacred Moment": "/massages/6.jpg",
    "Échappée Balinaise": "/massages/7.jpg",
    "Balinese Escape": "/massages/7.jpg",
    "Silhouette Sculptée": "/massages/8.jpg",
    "Sculpted Silhouette": "/massages/8.jpg",
    "Revitalisation Musculaire Sportive": "/massages/9.jpg",
    "Sports Muscle Revival": "/massages/9.jpg",
    "Symphonie Thaï à Quatre Mains": "/massages/10.jpg",
    "Thai Four Hands Symphony": "/massages/10.jpg",
    "Réflexologie Plantaire": "/massages/11.jpg",
    "Foot Reflexology": "/massages/11.jpg",
    "Libération des Tensions Tête & Cou": "/massages/12.jpg",
    "Head & Neck Tension Release": "/massages/12.jpg",
    "Thérapie Dos & Épaules": "/massages/13.jpg",
    "Back & Shoulders Therapy": "/massages/13.jpg",
    "Petit Ange (2-10 ans)": "/massages/14.jpg",
    "Little Angel (2-10 years)": "/massages/14.jpg",
    
    // Hammam
    "Hammam Secret Ghassoul": "/hammam/1.webp",
    "Hammam Atlas Majesty": "/hammam/2.jpg",
    
    // Facial Care
    "Facial Pureté Éclat": "/facial-care/1.jpg",
    "Purity Radiance Facial": "/facial-care/1.jpg",
    "Facial Anti-Âge Prestige": "/facial-care/2.jpg",
    "Anti-Aging Prestige Facial": "/facial-care/2.jpg",
    
    // Packages (Rituels)
    "Evasion - Rituel du Voyage des Sens": "/sections/e1.webp",
    "Evasion - Journey of the Senses Ritual": "/sections/e1.webp",
    "Rituel Au-Delà du Temps": "/sections/e2.jpg",
    "Beyond Time Ritual": "/sections/e2.jpg",
    "Rituel L'Éternité en Soi": "/sections/e3.jpg",
    "Ritual Eternity Within": "/sections/e3.jpg",
    "Rituel de la Renaissance Majestueuse": "/sections/e4.webp",
    "Majestic Rebirth Ritual": "/sections/e4.webp",
  };
}

/**
 * Copy image file from frontend public to backend uploads
 */
async function copyImageToUploads(imagePath) {
  try {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const sourcePath = path.join(FRONTEND_PUBLIC_PATH, cleanPath);
    
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Image not found: ${sourcePath}`);
      return null;
    }

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(BACKEND_UPLOADS_PATH)) {
      fs.mkdirSync(BACKEND_UPLOADS_PATH, { recursive: true });
    }

    // Get filename from path
    const filename = path.basename(cleanPath);
    const extension = path.extname(filename);
    const baseName = path.basename(filename, extension);
    
    // Create unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFilename = `service-${timestamp}-${baseName}${extension}`;
    const destPath = path.join(BACKEND_UPLOADS_PATH, uniqueFilename);

    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    
    console.log(`✅ Copied: ${imagePath} → /uploads/${uniqueFilename}`);
    
    // Return path relative to uploads folder (for API access)
    return `/uploads/${uniqueFilename}`;
  } catch (error) {
    console.error(`❌ Error copying image ${imagePath}:`, error.message);
    return null;
  }
}

/**
 * Update service images in database
 */
async function updateServiceImages() {
  try {
    console.log('\n🚀 Starting service images update...\n');

    // Get all services from database
    const servicesResult = await pool.query(`
      SELECT service_uuid, nomservice, nomservice_fr, nomservice_en, images
      FROM service
      ORDER BY created_at
    `);

    const services = servicesResult.rows;
    console.log(`📦 Found ${services.length} services in database\n`);

    const imageMap = getServiceImageMap();
    let updatedCount = 0;
    let skippedCount = 0;

    for (const service of services) {
      // Try to find image by service name (FR or EN)
      const serviceNameFr = service.nomservice_fr || service.nomservice || '';
      const serviceNameEn = service.nomservice_en || service.nomservice || '';
      
      let imagePath = imageMap[serviceNameFr] || imageMap[serviceNameEn];

      if (!imagePath) {
        console.log(`⏭️  Skipped: ${serviceNameFr || serviceNameEn} (no image mapping found)`);
        skippedCount++;
        continue;
      }

      // Check if image already exists in database and points to /uploads
      const existingImages = service.images || [];
      const uploadImages = existingImages.filter(img => img && img.startsWith('/uploads/'));
      
      // Check if the referenced file actually exists on disk
      let imageFileExists = false;
      if (uploadImages.length > 0) {
        for (const imgPath of uploadImages) {
          const filename = path.basename(imgPath);
          const filePath = path.join(BACKEND_UPLOADS_PATH, filename);
          if (fs.existsSync(filePath)) {
            imageFileExists = true;
            break;
          }
        }
      }
      
      // If service already has an image in /uploads AND the file exists on disk, skip
      if (uploadImages.length > 0 && imageFileExists) {
        console.log(`⏭️  Skipped: ${serviceNameFr || serviceNameEn} (already has image in /uploads and file exists)`);
        skippedCount++;
        continue;
      }
      
      // If image path exists in DB but file is missing, we'll recreate it
      if (uploadImages.length > 0 && !imageFileExists) {
        console.log(`⚠️  Image file missing for ${serviceNameFr || serviceNameEn} (path: ${uploadImages[0]}), will recreate...`);
      }

      // Copy image to uploads folder
      const uploadedImagePath = await copyImageToUploads(imagePath);
      
      if (!uploadedImagePath) {
        console.log(`⏭️  Skipped: ${serviceNameFr || serviceNameEn} (failed to copy image)`);
        skippedCount++;
        continue;
      }

      // Update service in database
      const newImages = existingImages.length > 0 
        ? [...existingImages, uploadedImagePath]
        : [uploadedImagePath];

      await pool.query(
        `UPDATE service 
         SET images = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE service_uuid = $2`,
        [newImages, service.service_uuid]
      );

      console.log(`✅ Updated: ${serviceNameFr || serviceNameEn} with image: ${uploadedImagePath}\n`);
      updatedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✨ Process completed!`);
    console.log(`   - Updated: ${updatedCount} services`);
    console.log(`   - Skipped: ${skippedCount} services`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error updating service images:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL database\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Please make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database credentials are correct in .env file');
    console.error('3. Database exists and is accessible');
    console.error('\nError details:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Service Images Migration Script');
  console.log('=====================================\n');

  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Check if frontend public folder exists
  if (!fs.existsSync(FRONTEND_PUBLIC_PATH)) {
    console.error(`❌ Frontend public folder not found: ${FRONTEND_PUBLIC_PATH}`);
    console.error('Please make sure the frontend folder exists and contains the images.');
    process.exit(1);
  }

  // Check if uploads folder exists, create if not
  if (!fs.existsSync(BACKEND_UPLOADS_PATH)) {
    fs.mkdirSync(BACKEND_UPLOADS_PATH, { recursive: true });
    console.log(`📁 Created uploads directory: ${BACKEND_UPLOADS_PATH}\n`);
  }

  try {
    await updateServiceImages();
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the script
main();

