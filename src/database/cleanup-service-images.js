import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

/**
 * Clean up service images - keep only /uploads/ paths
 */
async function cleanupServiceImages() {
  try {
    console.log('\n🧹 Cleaning up service images...\n');

    // Get all services
    const servicesResult = await pool.query(`
      SELECT service_uuid, nomservice_fr, images
      FROM service
      WHERE images IS NOT NULL
    `);

    const services = servicesResult.rows;
    console.log(`📦 Found ${services.length} services with images\n`);

    let updatedCount = 0;

    for (const service of services) {
      const existingImages = service.images || [];
      
      // Filter to keep only /uploads/ paths
      const cleanedImages = existingImages.filter(img => 
        img && img.startsWith('/uploads/')
      );

      // Remove old paths (/massages/, /hammam/, /facial-care/)
      const oldPathsRemoved = existingImages.filter(img => 
        img && !img.startsWith('/uploads/') && 
        (img.startsWith('/massages/') || img.startsWith('/hammam/') || img.startsWith('/facial-care/') || img.startsWith('/sections/'))
      );

      if (oldPathsRemoved.length > 0 && cleanedImages.length > 0) {
        // Update service to keep only /uploads/ images
        await pool.query(
          `UPDATE service 
           SET images = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE service_uuid = $2`,
          [cleanedImages, service.service_uuid]
        );

        console.log(`✅ Cleaned: ${service.nomservice_fr || service.nomservice || 'Unknown'} - Removed ${oldPathsRemoved.length} old path(s), kept ${cleanedImages.length} image(s)`);
        updatedCount++;
      }
    }

    console.log(`\n✨ Cleanup completed! Updated ${updatedCount} services\n`);
    
  } catch (error) {
    console.error('❌ Error cleaning up service images:', error);
    throw error;
  }
}

// Run cleanup
cleanupServiceImages()
  .then(() => {
    console.log('✅ Cleanup completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });

