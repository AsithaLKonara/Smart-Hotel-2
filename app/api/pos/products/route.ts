import { NextResponse } from 'next/server'
import prisma from '@/lib/db' // Make sure it uses @/lib/db which seems to be the standard

export async function GET() {
  try {
    const [posProducts, foodMenuItems] = await Promise.all([
      prisma.pOSProduct.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
        include: {
          outlet: true
        }
      }),
      prisma.foodMenu.findMany({
        where: { available: true },
        orderBy: { category: 'asc' }
      })
    ]);

    // Map food menu items to match POS product structure
    const mappedFoodItems = foodMenuItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: 'Food', // Or map it more specifically based on FoodMenu category
      subCategory: item.category,
      isActive: item.available,
      imageUrls: item.images,
      type: 'KITCHEN_MENU'
    }));

    // Combine them
    const products = [...posProducts, ...mappedFoodItems];

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch POS products:', error);
    return NextResponse.json({ error: 'Failed to fetch POS products' }, { status: 500 });
  }
}
