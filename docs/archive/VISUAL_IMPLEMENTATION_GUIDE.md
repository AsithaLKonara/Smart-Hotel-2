# 🎨 Visual Implementation Guide
*Step-by-Step Enhancement of SmartHotel Components*

## 📱 **COMPONENT TRANSFORMATION EXAMPLES**

### **1. Hero Section Transformation**

#### **Before (Current)**
```tsx
// Basic gradient background
<section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-5xl font-bold mb-4">Welcome to SmartHotel</h1>
    <p className="text-xl mb-8">Experience luxury and comfort...</p>
  </div>
</section>
```

#### **After (Enhanced)**
```tsx
// Inspired by Hotel Booking App by Rakib Kowshar
<section className="relative h-screen overflow-hidden">
  {/* Background Image Carousel */}
  <div className="absolute inset-0">
    <Image
      src="/images/hotel-hero-1.jpg"
      alt="Luxury Hotel"
      fill
      className="object-cover"
      priority
    />
    <div className="absolute inset-0 bg-black/40" />
  </div>
  
  {/* Glassmorphism Search Overlay */}
  <div className="relative z-10 flex items-center justify-center h-full">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full mx-4"
    >
      <PremiumSearch className="bg-white/90" />
    </motion.div>
  </div>
  
  {/* Trust Indicators */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
    <TrustBadges />
  </div>
</section>
```

### **2. Room Card Enhancement**

#### **Before (Current)**
```tsx
// Basic room card
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="text-lg font-semibold">{room.name}</h3>
    <p className="text-gray-600">${room.price} per night</p>
    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
      Book Now
    </button>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern booking apps
<motion.div
  whileHover={{ scale: 1.02, y: -8 }}
  className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
>
  {/* Image with Hover Effects */}
  <div className="relative h-64 overflow-hidden">
    <Image
      src={room.images[0]}
      alt={room.name}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-110"
    />
    
    {/* Badges */}
    <div className="absolute top-4 left-4 flex gap-2">
      {room.isPopular && <Badge variant="popular">Popular</Badge>}
      {room.limitedOffer && <Badge variant="offer">Limited Offer</Badge>}
    </div>
    
    {/* Quick Actions */}
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 bg-white/90 rounded-full shadow-md">
        <Heart className="w-5 h-5" />
      </button>
    </div>
    
    {/* 360° Tour Button */}
    <div className="absolute bottom-4 right-4">
      <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
        360° Tour
      </button>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-6">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xl font-semibold">{room.name}</h3>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8</span>
      </div>
    </div>
    
    {/* Amenities */}
    <div className="flex gap-2 mb-4">
      {room.amenities.slice(0, 4).map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} />
      ))}
    </div>
    
    {/* Pricing */}
    <div className="flex justify-between items-center">
      <div>
        <span className="text-2xl font-bold text-gray-900">
          ${room.price}
        </span>
        <span className="text-gray-600">/night</span>
      </div>
      <PremiumButton variant="primary" size="sm">
        Book Now
      </PremiumButton>
    </div>
  </div>
</motion.div>
```

### **3. Menu Item Enhancement**

#### **Before (Current)**
```tsx
// Basic menu item
<div className="bg-white rounded-lg p-4 flex gap-4">
  <img src={item.image} alt={item.name} className="w-20 h-20 rounded" />
  <div className="flex-1">
    <h3 className="font-medium">{item.name}</h3>
    <p className="text-sm text-gray-500">{item.description}</p>
    <div className="flex justify-between items-center mt-2">
      <span className="font-bold">${item.price}</span>
      <button className="bg-blue-600 text-white px-3 py-1 rounded">
        Add
      </button>
    </div>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by food delivery apps
<motion.div
  whileHover={{ scale: 1.02 }}
  className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300"
>
  <div className="flex gap-4">
    {/* Enhanced Image */}
    <div className="relative">
      <div className="w-24 h-24 rounded-xl overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={96}
          height={96}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      
      {/* Dietary Tags */}
      {item.dietaryTags && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {item.dietaryTags.map(tag => (
            <DietaryTag key={tag} tag={tag} />
          ))}
        </div>
      )}
      
      {/* Popular Badge */}
      {item.isPopular && (
        <div className="absolute top-1 left-1">
          <Badge variant="popular" size="sm">Chef's Choice</Badge>
        </div>
      )}
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{item.rating}</span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {item.description}
      </p>
      
      {/* Preparation Time */}
      {item.preparationTime && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>{item.preparationTime} min</span>
        </div>
      )}
      
      {/* Price and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xl font-bold text-gray-900">
            ${item.price}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <QuantityControls 
            quantity={cartQuantity}
            onIncrease={() => handleAddToCart(item)}
            onDecrease={() => handleRemoveFromCart(item.id)}
          />
          
          {/* Add to Cart with Animation */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddToCart(item)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add
          </motion.button>
        </div>
      </div>
    </div>
  </div>
</motion.div>
```

### **4. Dashboard KPI Card Enhancement**

#### **Before (Current)**
```tsx
// Basic KPI card
<div className="bg-white rounded-lg p-6 shadow-sm">
  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
  <div className="text-3xl font-bold">$12,345</div>
  <div className="text-sm text-green-600">+12% from last month</div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern dashboard designs
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
  onClick={() => onNavigate('revenue')}
>
  {/* Header with Icon */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
        <DollarSign className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Total Revenue
      </h3>
    </div>
    
    <TrendIndicator trend={trend} change={change} />
  </div>
  
  {/* Main Value */}
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="mb-3"
  >
    <div className="text-3xl font-bold text-gray-900">
      ${formatNumber(value)}
    </div>
    {subtitle && (
      <div className="text-sm text-gray-600 mt-1">
        {subtitle}
      </div>
    )}
  </motion.div>
  
  {/* Trend and Change */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        change >= 0 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {change >= 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{Math.abs(change)}%</span>
      </div>
      <span className="text-xs text-gray-500">vs last month</span>
    </div>
    
    {/* Action Arrow */}
    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
  </div>
  
  {/* Progress Bar */}
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
      />
    </div>
    <div className="text-xs text-gray-500 mt-1">
      {percentage}% of monthly target
    </div>
  </div>
</motion.div>
```

## 🎨 **DESIGN TOKENS IMPLEMENTATION**

### **Color System Enhancement**
```typescript
// Enhanced color palette inspired by luxury hotels
export const colors = {
  primary: {
    50: '#fef7ee',
    100: '#fdedd3',
    200: '#fbd9a5',
    300: '#f8c06d',
    400: '#f5a33f',
    500: '#f28c1f', // Main amber
    600: '#e37216',
    700: '#c45a12',
    800: '#9d4818',
    900: '#7e3d16',
  },
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Main teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
}
```

### **Typography System**
```typescript
// Luxury typography inspired by premium hotels
export const typography = {
  fonts: {
    heading: 'Playfair Display, serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
}
```

### **Spacing System**
```typescript
// Consistent spacing inspired by modern design systems
export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}
```

## 🔧 **IMPLEMENTATION COMPONENTS**

### **Trust Badges Component**
```tsx
// components/ui/trust-badges.tsx
export function TrustBadges() {
  return (
    <div className="flex items-center gap-6 text-white/90">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8/5 Rating</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <span className="text-sm font-medium">Secure Booking</span>
      </div>
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5" />
        <span className="text-sm font-medium">Award Winning</span>
      </div>
    </div>
  )
}
```

### **Amenity Icon Component**
```tsx
// components/ui/amenity-icon.tsx
export function AmenityIcon({ amenity }: { amenity: string }) {
  const iconMap = {
    wifi: Wifi,
    parking: Car,
    pool: Waves,
    spa: Sparkles,
    restaurant: Utensils,
    gym: Dumbbell,
  }
  
  const Icon = iconMap[amenity] || HelpCircle
  
  return (
    <Tooltip content={amenity}>
      <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
    </Tooltip>
  )
}
```

### **Dietary Tag Component**
```tsx
// components/ui/dietary-tag.tsx
export function DietaryTag({ tag }: { tag: string }) {
  const tagStyles = {
    vegan: 'bg-green-100 text-green-800',
    vegetarian: 'bg-green-50 text-green-700',
    glutenFree: 'bg-blue-100 text-blue-800',
    spicy: 'bg-red-100 text-red-800',
    healthy: 'bg-emerald-100 text-emerald-800',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${tagStyles[tag] || 'bg-gray-100 text-gray-800'}`}>
      {tag}
    </span>
  )
}
```

### **Trend Indicator Component**
```tsx
// components/ui/trend-indicator.tsx
export function TrendIndicator({ trend, change }: { trend: 'up' | 'down' | 'stable', change: number }) {
  const config = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    stable: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100' },
  }
  
  const { icon: Icon, color, bg } = config[trend]
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>
        {Math.abs(change)}%
      </span>
    </div>
  )
}
```

### **Quantity Controls Component**
```tsx
// components/ui/quantity-controls.tsx
export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease 
}: { 
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  if (quantity === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
```

## 🎯 **ANIMATION PATTERNS**

### **Page Transitions**
```tsx
// Framer Motion page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}
```

### **Stagger Animations**
```tsx
// Staggered list animations
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}
```

### **Hover Animations**
```tsx
// Card hover animations
export const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
}
```

This implementation guide provides concrete examples of how to transform SmartHotel's existing components into modern, engaging interfaces inspired by the best hotel booking and food ordering applications. Each enhancement is designed to improve user experience while maintaining the existing functionality and performance standards.
*Step-by-Step Enhancement of SmartHotel Components*

## 📱 **COMPONENT TRANSFORMATION EXAMPLES**

### **1. Hero Section Transformation**

#### **Before (Current)**
```tsx
// Basic gradient background
<section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-5xl font-bold mb-4">Welcome to SmartHotel</h1>
    <p className="text-xl mb-8">Experience luxury and comfort...</p>
  </div>
</section>
```

#### **After (Enhanced)**
```tsx
// Inspired by Hotel Booking App by Rakib Kowshar
<section className="relative h-screen overflow-hidden">
  {/* Background Image Carousel */}
  <div className="absolute inset-0">
    <Image
      src="/images/hotel-hero-1.jpg"
      alt="Luxury Hotel"
      fill
      className="object-cover"
      priority
    />
    <div className="absolute inset-0 bg-black/40" />
  </div>
  
  {/* Glassmorphism Search Overlay */}
  <div className="relative z-10 flex items-center justify-center h-full">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full mx-4"
    >
      <PremiumSearch className="bg-white/90" />
    </motion.div>
  </div>
  
  {/* Trust Indicators */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
    <TrustBadges />
  </div>
</section>
```

### **2. Room Card Enhancement**

#### **Before (Current)**
```tsx
// Basic room card
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="text-lg font-semibold">{room.name}</h3>
    <p className="text-gray-600">${room.price} per night</p>
    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
      Book Now
    </button>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern booking apps
<motion.div
  whileHover={{ scale: 1.02, y: -8 }}
  className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
>
  {/* Image with Hover Effects */}
  <div className="relative h-64 overflow-hidden">
    <Image
      src={room.images[0]}
      alt={room.name}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-110"
    />
    
    {/* Badges */}
    <div className="absolute top-4 left-4 flex gap-2">
      {room.isPopular && <Badge variant="popular">Popular</Badge>}
      {room.limitedOffer && <Badge variant="offer">Limited Offer</Badge>}
    </div>
    
    {/* Quick Actions */}
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 bg-white/90 rounded-full shadow-md">
        <Heart className="w-5 h-5" />
      </button>
    </div>
    
    {/* 360° Tour Button */}
    <div className="absolute bottom-4 right-4">
      <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
        360° Tour
      </button>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-6">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xl font-semibold">{room.name}</h3>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8</span>
      </div>
    </div>
    
    {/* Amenities */}
    <div className="flex gap-2 mb-4">
      {room.amenities.slice(0, 4).map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} />
      ))}
    </div>
    
    {/* Pricing */}
    <div className="flex justify-between items-center">
      <div>
        <span className="text-2xl font-bold text-gray-900">
          ${room.price}
        </span>
        <span className="text-gray-600">/night</span>
      </div>
      <PremiumButton variant="primary" size="sm">
        Book Now
      </PremiumButton>
    </div>
  </div>
</motion.div>
```

### **3. Menu Item Enhancement**

#### **Before (Current)**
```tsx
// Basic menu item
<div className="bg-white rounded-lg p-4 flex gap-4">
  <img src={item.image} alt={item.name} className="w-20 h-20 rounded" />
  <div className="flex-1">
    <h3 className="font-medium">{item.name}</h3>
    <p className="text-sm text-gray-500">{item.description}</p>
    <div className="flex justify-between items-center mt-2">
      <span className="font-bold">${item.price}</span>
      <button className="bg-blue-600 text-white px-3 py-1 rounded">
        Add
      </button>
    </div>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by food delivery apps
<motion.div
  whileHover={{ scale: 1.02 }}
  className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300"
>
  <div className="flex gap-4">
    {/* Enhanced Image */}
    <div className="relative">
      <div className="w-24 h-24 rounded-xl overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={96}
          height={96}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      
      {/* Dietary Tags */}
      {item.dietaryTags && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {item.dietaryTags.map(tag => (
            <DietaryTag key={tag} tag={tag} />
          ))}
        </div>
      )}
      
      {/* Popular Badge */}
      {item.isPopular && (
        <div className="absolute top-1 left-1">
          <Badge variant="popular" size="sm">Chef's Choice</Badge>
        </div>
      )}
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{item.rating}</span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {item.description}
      </p>
      
      {/* Preparation Time */}
      {item.preparationTime && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>{item.preparationTime} min</span>
        </div>
      )}
      
      {/* Price and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xl font-bold text-gray-900">
            ${item.price}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <QuantityControls 
            quantity={cartQuantity}
            onIncrease={() => handleAddToCart(item)}
            onDecrease={() => handleRemoveFromCart(item.id)}
          />
          
          {/* Add to Cart with Animation */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddToCart(item)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add
          </motion.button>
        </div>
      </div>
    </div>
  </div>
</motion.div>
```

### **4. Dashboard KPI Card Enhancement**

#### **Before (Current)**
```tsx
// Basic KPI card
<div className="bg-white rounded-lg p-6 shadow-sm">
  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
  <div className="text-3xl font-bold">$12,345</div>
  <div className="text-sm text-green-600">+12% from last month</div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern dashboard designs
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
  onClick={() => onNavigate('revenue')}
>
  {/* Header with Icon */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
        <DollarSign className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Total Revenue
      </h3>
    </div>
    
    <TrendIndicator trend={trend} change={change} />
  </div>
  
  {/* Main Value */}
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="mb-3"
  >
    <div className="text-3xl font-bold text-gray-900">
      ${formatNumber(value)}
    </div>
    {subtitle && (
      <div className="text-sm text-gray-600 mt-1">
        {subtitle}
      </div>
    )}
  </motion.div>
  
  {/* Trend and Change */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        change >= 0 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {change >= 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{Math.abs(change)}%</span>
      </div>
      <span className="text-xs text-gray-500">vs last month</span>
    </div>
    
    {/* Action Arrow */}
    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
  </div>
  
  {/* Progress Bar */}
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
      />
    </div>
    <div className="text-xs text-gray-500 mt-1">
      {percentage}% of monthly target
    </div>
  </div>
</motion.div>
```

## 🎨 **DESIGN TOKENS IMPLEMENTATION**

### **Color System Enhancement**
```typescript
// Enhanced color palette inspired by luxury hotels
export const colors = {
  primary: {
    50: '#fef7ee',
    100: '#fdedd3',
    200: '#fbd9a5',
    300: '#f8c06d',
    400: '#f5a33f',
    500: '#f28c1f', // Main amber
    600: '#e37216',
    700: '#c45a12',
    800: '#9d4818',
    900: '#7e3d16',
  },
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Main teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
}
```

### **Typography System**
```typescript
// Luxury typography inspired by premium hotels
export const typography = {
  fonts: {
    heading: 'Playfair Display, serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
}
```

### **Spacing System**
```typescript
// Consistent spacing inspired by modern design systems
export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}
```

## 🔧 **IMPLEMENTATION COMPONENTS**

### **Trust Badges Component**
```tsx
// components/ui/trust-badges.tsx
export function TrustBadges() {
  return (
    <div className="flex items-center gap-6 text-white/90">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8/5 Rating</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <span className="text-sm font-medium">Secure Booking</span>
      </div>
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5" />
        <span className="text-sm font-medium">Award Winning</span>
      </div>
    </div>
  )
}
```

### **Amenity Icon Component**
```tsx
// components/ui/amenity-icon.tsx
export function AmenityIcon({ amenity }: { amenity: string }) {
  const iconMap = {
    wifi: Wifi,
    parking: Car,
    pool: Waves,
    spa: Sparkles,
    restaurant: Utensils,
    gym: Dumbbell,
  }
  
  const Icon = iconMap[amenity] || HelpCircle
  
  return (
    <Tooltip content={amenity}>
      <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
    </Tooltip>
  )
}
```

### **Dietary Tag Component**
```tsx
// components/ui/dietary-tag.tsx
export function DietaryTag({ tag }: { tag: string }) {
  const tagStyles = {
    vegan: 'bg-green-100 text-green-800',
    vegetarian: 'bg-green-50 text-green-700',
    glutenFree: 'bg-blue-100 text-blue-800',
    spicy: 'bg-red-100 text-red-800',
    healthy: 'bg-emerald-100 text-emerald-800',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${tagStyles[tag] || 'bg-gray-100 text-gray-800'}`}>
      {tag}
    </span>
  )
}
```

### **Trend Indicator Component**
```tsx
// components/ui/trend-indicator.tsx
export function TrendIndicator({ trend, change }: { trend: 'up' | 'down' | 'stable', change: number }) {
  const config = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    stable: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100' },
  }
  
  const { icon: Icon, color, bg } = config[trend]
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>
        {Math.abs(change)}%
      </span>
    </div>
  )
}
```

### **Quantity Controls Component**
```tsx
// components/ui/quantity-controls.tsx
export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease 
}: { 
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  if (quantity === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
```

## 🎯 **ANIMATION PATTERNS**

### **Page Transitions**
```tsx
// Framer Motion page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}
```

### **Stagger Animations**
```tsx
// Staggered list animations
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}
```

### **Hover Animations**
```tsx
// Card hover animations
export const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
}
```

This implementation guide provides concrete examples of how to transform SmartHotel's existing components into modern, engaging interfaces inspired by the best hotel booking and food ordering applications. Each enhancement is designed to improve user experience while maintaining the existing functionality and performance standards.
*Step-by-Step Enhancement of SmartHotel Components*

## 📱 **COMPONENT TRANSFORMATION EXAMPLES**

### **1. Hero Section Transformation**

#### **Before (Current)**
```tsx
// Basic gradient background
<section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-5xl font-bold mb-4">Welcome to SmartHotel</h1>
    <p className="text-xl mb-8">Experience luxury and comfort...</p>
  </div>
</section>
```

#### **After (Enhanced)**
```tsx
// Inspired by Hotel Booking App by Rakib Kowshar
<section className="relative h-screen overflow-hidden">
  {/* Background Image Carousel */}
  <div className="absolute inset-0">
    <Image
      src="/images/hotel-hero-1.jpg"
      alt="Luxury Hotel"
      fill
      className="object-cover"
      priority
    />
    <div className="absolute inset-0 bg-black/40" />
  </div>
  
  {/* Glassmorphism Search Overlay */}
  <div className="relative z-10 flex items-center justify-center h-full">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full mx-4"
    >
      <PremiumSearch className="bg-white/90" />
    </motion.div>
  </div>
  
  {/* Trust Indicators */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
    <TrustBadges />
  </div>
</section>
```

### **2. Room Card Enhancement**

#### **Before (Current)**
```tsx
// Basic room card
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3 className="text-lg font-semibold">{room.name}</h3>
    <p className="text-gray-600">${room.price} per night</p>
    <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
      Book Now
    </button>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern booking apps
<motion.div
  whileHover={{ scale: 1.02, y: -8 }}
  className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
>
  {/* Image with Hover Effects */}
  <div className="relative h-64 overflow-hidden">
    <Image
      src={room.images[0]}
      alt={room.name}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-110"
    />
    
    {/* Badges */}
    <div className="absolute top-4 left-4 flex gap-2">
      {room.isPopular && <Badge variant="popular">Popular</Badge>}
      {room.limitedOffer && <Badge variant="offer">Limited Offer</Badge>}
    </div>
    
    {/* Quick Actions */}
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 bg-white/90 rounded-full shadow-md">
        <Heart className="w-5 h-5" />
      </button>
    </div>
    
    {/* 360° Tour Button */}
    <div className="absolute bottom-4 right-4">
      <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
        360° Tour
      </button>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-6">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xl font-semibold">{room.name}</h3>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8</span>
      </div>
    </div>
    
    {/* Amenities */}
    <div className="flex gap-2 mb-4">
      {room.amenities.slice(0, 4).map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} />
      ))}
    </div>
    
    {/* Pricing */}
    <div className="flex justify-between items-center">
      <div>
        <span className="text-2xl font-bold text-gray-900">
          ${room.price}
        </span>
        <span className="text-gray-600">/night</span>
      </div>
      <PremiumButton variant="primary" size="sm">
        Book Now
      </PremiumButton>
    </div>
  </div>
</motion.div>
```

### **3. Menu Item Enhancement**

#### **Before (Current)**
```tsx
// Basic menu item
<div className="bg-white rounded-lg p-4 flex gap-4">
  <img src={item.image} alt={item.name} className="w-20 h-20 rounded" />
  <div className="flex-1">
    <h3 className="font-medium">{item.name}</h3>
    <p className="text-sm text-gray-500">{item.description}</p>
    <div className="flex justify-between items-center mt-2">
      <span className="font-bold">${item.price}</span>
      <button className="bg-blue-600 text-white px-3 py-1 rounded">
        Add
      </button>
    </div>
  </div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by food delivery apps
<motion.div
  whileHover={{ scale: 1.02 }}
  className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300"
>
  <div className="flex gap-4">
    {/* Enhanced Image */}
    <div className="relative">
      <div className="w-24 h-24 rounded-xl overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={96}
          height={96}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      
      {/* Dietary Tags */}
      {item.dietaryTags && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {item.dietaryTags.map(tag => (
            <DietaryTag key={tag} tag={tag} />
          ))}
        </div>
      )}
      
      {/* Popular Badge */}
      {item.isPopular && (
        <div className="absolute top-1 left-1">
          <Badge variant="popular" size="sm">Chef's Choice</Badge>
        </div>
      )}
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg group-hover:text-amber-600 transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{item.rating}</span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {item.description}
      </p>
      
      {/* Preparation Time */}
      {item.preparationTime && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>{item.preparationTime} min</span>
        </div>
      )}
      
      {/* Price and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xl font-bold text-gray-900">
            ${item.price}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quantity Controls */}
          <QuantityControls 
            quantity={cartQuantity}
            onIncrease={() => handleAddToCart(item)}
            onDecrease={() => handleRemoveFromCart(item.id)}
          />
          
          {/* Add to Cart with Animation */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddToCart(item)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add
          </motion.button>
        </div>
      </div>
    </div>
  </div>
</motion.div>
```

### **4. Dashboard KPI Card Enhancement**

#### **Before (Current)**
```tsx
// Basic KPI card
<div className="bg-white rounded-lg p-6 shadow-sm">
  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
  <div className="text-3xl font-bold">$12,345</div>
  <div className="text-sm text-green-600">+12% from last month</div>
</div>
```

#### **After (Enhanced)**
```tsx
// Inspired by modern dashboard designs
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
  onClick={() => onNavigate('revenue')}
>
  {/* Header with Icon */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
        <DollarSign className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Total Revenue
      </h3>
    </div>
    
    <TrendIndicator trend={trend} change={change} />
  </div>
  
  {/* Main Value */}
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="mb-3"
  >
    <div className="text-3xl font-bold text-gray-900">
      ${formatNumber(value)}
    </div>
    {subtitle && (
      <div className="text-sm text-gray-600 mt-1">
        {subtitle}
      </div>
    )}
  </motion.div>
  
  {/* Trend and Change */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        change >= 0 
          ? 'bg-emerald-100 text-emerald-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {change >= 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{Math.abs(change)}%</span>
      </div>
      <span className="text-xs text-gray-500">vs last month</span>
    </div>
    
    {/* Action Arrow */}
    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
  </div>
  
  {/* Progress Bar */}
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full"
      />
    </div>
    <div className="text-xs text-gray-500 mt-1">
      {percentage}% of monthly target
    </div>
  </div>
</motion.div>
```

## 🎨 **DESIGN TOKENS IMPLEMENTATION**

### **Color System Enhancement**
```typescript
// Enhanced color palette inspired by luxury hotels
export const colors = {
  primary: {
    50: '#fef7ee',
    100: '#fdedd3',
    200: '#fbd9a5',
    300: '#f8c06d',
    400: '#f5a33f',
    500: '#f28c1f', // Main amber
    600: '#e37216',
    700: '#c45a12',
    800: '#9d4818',
    900: '#7e3d16',
  },
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Main teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
}
```

### **Typography System**
```typescript
// Luxury typography inspired by premium hotels
export const typography = {
  fonts: {
    heading: 'Playfair Display, serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
}
```

### **Spacing System**
```typescript
// Consistent spacing inspired by modern design systems
export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}
```

## 🔧 **IMPLEMENTATION COMPONENTS**

### **Trust Badges Component**
```tsx
// components/ui/trust-badges.tsx
export function TrustBadges() {
  return (
    <div className="flex items-center gap-6 text-white/90">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">4.8/5 Rating</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <span className="text-sm font-medium">Secure Booking</span>
      </div>
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5" />
        <span className="text-sm font-medium">Award Winning</span>
      </div>
    </div>
  )
}
```

### **Amenity Icon Component**
```tsx
// components/ui/amenity-icon.tsx
export function AmenityIcon({ amenity }: { amenity: string }) {
  const iconMap = {
    wifi: Wifi,
    parking: Car,
    pool: Waves,
    spa: Sparkles,
    restaurant: Utensils,
    gym: Dumbbell,
  }
  
  const Icon = iconMap[amenity] || HelpCircle
  
  return (
    <Tooltip content={amenity}>
      <div className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
    </Tooltip>
  )
}
```

### **Dietary Tag Component**
```tsx
// components/ui/dietary-tag.tsx
export function DietaryTag({ tag }: { tag: string }) {
  const tagStyles = {
    vegan: 'bg-green-100 text-green-800',
    vegetarian: 'bg-green-50 text-green-700',
    glutenFree: 'bg-blue-100 text-blue-800',
    spicy: 'bg-red-100 text-red-800',
    healthy: 'bg-emerald-100 text-emerald-800',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${tagStyles[tag] || 'bg-gray-100 text-gray-800'}`}>
      {tag}
    </span>
  )
}
```

### **Trend Indicator Component**
```tsx
// components/ui/trend-indicator.tsx
export function TrendIndicator({ trend, change }: { trend: 'up' | 'down' | 'stable', change: number }) {
  const config = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    stable: { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100' },
  }
  
  const { icon: Icon, color, bg } = config[trend]
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3 h-3 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>
        {Math.abs(change)}%
      </span>
    </div>
  )
}
```

### **Quantity Controls Component**
```tsx
// components/ui/quantity-controls.tsx
export function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease 
}: { 
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  if (quantity === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
```

## 🎯 **ANIMATION PATTERNS**

### **Page Transitions**
```tsx
// Framer Motion page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}
```

### **Stagger Animations**
```tsx
// Staggered list animations
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}
```

### **Hover Animations**
```tsx
// Card hover animations
export const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
}
```

This implementation guide provides concrete examples of how to transform SmartHotel's existing components into modern, engaging interfaces inspired by the best hotel booking and food ordering applications. Each enhancement is designed to improve user experience while maintaining the existing functionality and performance standards.
