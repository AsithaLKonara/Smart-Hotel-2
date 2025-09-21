const fs = require('fs');
const path = require('path');

// Beautiful hotel images from Unsplash
const imageUrls = {
  // Hero backgrounds
  'hotel-hero-1.jpg': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop&crop=center',
  'hotel-hero-2.jpg': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop&crop=center',
  'hotel-hero-3.jpg': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop&crop=center',
  
  // Room images
  'room-deluxe.jpg': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&crop=center',
  'room-suite.jpg': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop&crop=center',
  'room-standard.jpg': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
  'room-luxury.jpg': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&crop=center',
  
  // Hotel facilities
  'hotel-lobby.jpg': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&crop=center',
  'hotel-pool.jpg': 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop&crop=center',
  'hotel-restaurant.jpg': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&crop=center',
  'hotel-spa.jpg': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop&crop=center',
  'hotel-gym.jpg': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center',
  'hotel-bar.jpg': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop&crop=center',
  
  // Exterior and surroundings
  'hotel-exterior.jpg': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center',
  'hotel-garden.jpg': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
  'hotel-view.jpg': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop&crop=center',
  
  // Food images
  'food-breakfast.jpg': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&crop=center',
  'food-lunch.jpg': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&crop=center',
  'food-dinner.jpg': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&crop=center',
  'food-dessert.jpg': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop&crop=center'
};

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const filePath = path.join('public/images/hotel', filename);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ Downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${filename}:`, error.message);
    return false;
  }
}

async function downloadAllImages() {
  console.log('🎨 Starting to download beautiful hotel images...');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync('public/images/hotel')) {
    fs.mkdirSync('public/images/hotel', { recursive: true });
  }
  
  let successCount = 0;
  let totalCount = Object.keys(imageUrls).length;
  
  for (const [filename, url] of Object.entries(imageUrls)) {
    const success = await downloadImage(url, filename);
    if (success) successCount++;
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n🎉 Download complete: ${successCount}/${totalCount} images downloaded successfully!`);
  
  if (successCount === totalCount) {
    console.log('✅ All hotel images are ready for use!');
  } else {
    console.log('⚠️  Some images failed to download. Check your internet connection and try again.');
  }
}

// Run the download
downloadAllImages().catch(console.error);
