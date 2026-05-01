# Placeholder Images Update

## Summary
Updated all placeholder images to use matching, context-specific images from the hotel's existing image library. This improves visual consistency and provides better fallbacks when specific images are missing.

## Changes Made

### 1. Room Placeholder Images
**Updated Files:**
- `app/rooms/page.tsx` - Enhanced `getRoomImage()` function
- `app/rooms/[id]/page.tsx` - Added `getDefaultRoomImage()` function
- `public/images/room-placeholder.jpg` - Replaced with `room-standard.jpg`

**Type-Specific Placeholders:**
- **Standard Room** → `/images/hotel/room-standard.jpg`
- **Deluxe Room** → `/images/hotel/room-deluxe.jpg`
- **Suite/Presidential** → `/images/hotel/room-suite.jpg`
- **Luxury** → `/images/hotel/room-luxury.jpg`
- **Default Fallback** → `/images/room-placeholder.jpg` (now uses standard room image)

**Benefits:**
- Rooms now show type-appropriate images even when no specific images are uploaded
- Better visual representation of room types
- More professional appearance

### 2. Menu Item Placeholder Images
**Updated Files:**
- `components/ui/menu-item.tsx` - Added `getCategoryPlaceholder()` function
- `public/images/menu-placeholder.jpg` - Replaced with `food-lunch.jpg`

**Category-Specific Placeholders:**
- **Breakfast** → `/images/hotel/food-breakfast.jpg`
- **Lunch** → `/images/hotel/food-lunch.jpg`
- **Dinner/Main Course** → `/images/hotel/food-dinner.jpg`
- **Desserts** → `/images/hotel/food-dessert.jpg`
- **Beverages/Drinks** → `/images/hotel/hotel-bar.jpg`
- **Default Fallback** → `/images/menu-placeholder.jpg` (now uses lunch food image)

**Benefits:**
- Menu items show category-appropriate images automatically
- Better visual context for food categories
- Improved user experience when browsing menu

### 3. Image Error Handling
**Enhanced:**
- All image components now have `onError` handlers
- Fallback to category/type-specific placeholders on image load failure
- Prevents broken image icons from appearing

## Implementation Details

### Room Images
The `getRoomImage()` and `getDefaultRoomImage()` functions now check room type and automatically select an appropriate placeholder image based on keywords in the room type name.

```typescript
const getDefaultRoomImage = (roomType: string): string => {
  const typeLower = roomType.toLowerCase()
  if (typeLower.includes('standard')) {
    return '/images/hotel/room-standard.jpg'
  } else if (typeLower.includes('deluxe')) {
    return '/images/hotel/room-deluxe.jpg'
  } else if (typeLower.includes('suite') || typeLower.includes('presidential')) {
    return '/images/hotel/room-suite.jpg'
  } else if (typeLower.includes('luxury')) {
    return '/images/hotel/room-luxury.jpg'
  }
  return '/images/room-placeholder.jpg'
}
```

### Menu Item Images
The `getCategoryPlaceholder()` function maps food categories to appropriate food images.

```typescript
const getCategoryPlaceholder = (category: string): string => {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('breakfast')) {
    return '/images/hotel/food-breakfast.jpg'
  } else if (categoryLower.includes('lunch')) {
    return '/images/hotel/food-lunch.jpg'
  } else if (categoryLower.includes('dinner') || categoryLower.includes('main')) {
    return '/images/hotel/food-dinner.jpg'
  } else if (categoryLower.includes('dessert')) {
    return '/images/hotel/food-dessert.jpg'
  } else if (categoryLower.includes('beverage') || categoryLower.includes('drink')) {
    return '/images/hotel/hotel-bar.jpg'
  }
  return '/images/menu-placeholder.jpg'
}
```

## Files Modified

1. ✅ `app/rooms/page.tsx` - Enhanced room image fallback logic
2. ✅ `app/rooms/[id]/page.tsx` - Added type-specific placeholder function
3. ✅ `components/ui/menu-item.tsx` - Added category-specific placeholder function
4. ✅ `public/images/room-placeholder.jpg` - Replaced with standard room image
5. ✅ `public/images/menu-placeholder.jpg` - Replaced with lunch food image

## Testing Recommendations

After deployment, verify:
1. ✅ Rooms without images show type-appropriate placeholders
2. ✅ Menu items without images show category-appropriate placeholders
3. ✅ Image errors fallback correctly to placeholders
4. ✅ All room types (Standard, Deluxe, Suite, Luxury) show correct images
5. ✅ All menu categories (Breakfast, Lunch, Dinner, Desserts, Beverages) show correct images

## Benefits

- **Visual Consistency**: All placeholders now match the hotel's image style
- **Better UX**: Users see context-appropriate images instead of generic placeholders
- **Professional Appearance**: The application looks more polished and complete
- **Smart Fallbacks**: Images automatically match content type
- **Error Resilience**: Broken images gracefully fallback to appropriate placeholders

