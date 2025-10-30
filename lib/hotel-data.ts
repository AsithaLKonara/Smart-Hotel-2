// Grand Palace Hotel - Real Hotel Data
export const hotelData = {
  // Hotel Information
  hotel: {
    name: "Grand Palace Hotel",
    tagline: "Luxury 5-Star Accommodation",
    description: "Experience unparalleled luxury at Grand Palace Hotel, where world-class amenities meet exceptional service in the heart of downtown. Our 5-star hotel offers elegant accommodations, award-winning dining, and unforgettable experiences.",
    established: "1985",
    rooms: 150,
    floors: 25,
    rating: 4.8,
    
    // Real Contact Information
    contact: {
      phone: "+1 (212) 555-0123",
      email: "reservations@grandpalacehotel.com",
      address: "1235 Park Avenue, New York, NY 10029",
      coordinates: {
        lat: 40.7589,
        lng: -73.9851
      }
    },
    
    // Social Media
    social: {
      facebook: "https://facebook.com/grandpalacehotel",
      instagram: "https://instagram.com/grandpalacehotel",
      twitter: "https://twitter.com/grandpalacehotel",
      linkedin: "https://linkedin.com/company/grandpalacehotel"
    },
    
    // Amenities
    amenities: [
      "24/7 Concierge Service",
      "Valet Parking",
      "Business Center",
      "Fitness Center",
      "Spa & Wellness Center",
      "Rooftop Pool",
      "Fine Dining Restaurant",
      "Lobby Bar",
      "Room Service",
      "High-Speed WiFi",
      "Pet-Friendly",
      "Airport Shuttle"
    ]
  },

  // Room Types with Real Data
  rooms: [
    {
      id: "deluxe-king",
      type: "Deluxe King",
      description: "Spacious 450 sq ft room featuring a king-size bed, marble bathroom, and stunning city views. Includes premium amenities and 24/7 room service.",
      size: 450,
      capacity: 2,
      price: 299,
      amenities: [
        "King-size bed",
        "Marble bathroom",
        "City views",
        "Mini-bar",
        "Nespresso machine",
        "42-inch Smart TV",
        "High-speed WiFi",
        "24/7 Room service"
      ],
      images: [
        "/images/hotel/room-deluxe.jpg"
      ]
    },
    {
      id: "executive-suite",
      type: "Executive Suite",
      description: "Luxurious 650 sq ft suite with separate living area, premium furnishings, and panoramic city views. Perfect for business travelers and extended stays.",
      size: 650,
      capacity: 3,
      price: 499,
      amenities: [
        "Separate living area",
        "King-size bed",
        "Marble bathroom with jacuzzi",
        "Panoramic city views",
        "Premium mini-bar",
        "Nespresso machine",
        "55-inch Smart TV",
        "Executive lounge access",
        "Complimentary breakfast",
        "24/7 Concierge"
      ],
      images: [
        "/images/hotel/room-suite.jpg"
      ]
    },
    {
      id: "presidential-suite",
      type: "Presidential Suite",
      description: "Exclusive 1,200 sq ft suite featuring multiple rooms, private terrace, and butler service. The ultimate in luxury accommodation.",
      size: 1200,
      capacity: 4,
      price: 999,
      amenities: [
        "Multiple rooms",
        "Private terrace",
        "Butler service",
        "Marble bathroom with steam shower",
        "Premium mini-bar",
        "Nespresso machine",
        "65-inch Smart TV",
        "Private dining area",
        "Complimentary champagne",
        "24/7 Concierge",
        "Airport transfer"
      ],
      images: [
        "/images/hotel/room-luxury.jpg"
      ]
    }
  ],

  // Restaurant Menu with Real Data
  restaurant: {
    name: "The Grand Dining Room",
    description: "Award-winning restaurant featuring contemporary American cuisine with international influences. Our Executive Chef creates seasonal menus using locally sourced ingredients.",
    hours: {
      breakfast: "7:00 AM - 11:00 AM",
      lunch: "12:00 PM - 3:00 PM",
      dinner: "6:00 PM - 11:00 PM"
    },
    
    menu: {
      breakfast: [
        {
          name: "Grand Palace Breakfast",
          description: "Three eggs any style, artisanal toast, house-made jam, fresh fruit, and your choice of bacon or sausage",
          price: 24,
          category: "main",
          image: "/images/hotel/food-breakfast.jpg"
        },
        {
          name: "Avocado Toast Deluxe",
          description: "Smashed avocado on sourdough, heirloom tomatoes, microgreens, and poached egg",
          price: 18,
          category: "main"
        },
        {
          name: "Belgian Waffles",
          description: "House-made waffles with fresh berries, whipped cream, and maple syrup",
          price: 16,
          category: "main"
        }
      ],
      lunch: [
        {
          name: "Lobster Roll",
          description: "Fresh Maine lobster on brioche roll with house-made mayo and crispy fries",
          price: 32,
          category: "main",
          image: "/images/hotel/food-lunch.jpg"
        },
        {
          name: "Wagyu Burger",
          description: "Premium wagyu beef with aged cheddar, truffle aioli, and truffle fries",
          price: 28,
          category: "main"
        },
        {
          name: "Caesar Salad",
          description: "Romaine lettuce, parmesan, croutons, and house-made Caesar dressing",
          price: 16,
          category: "salad"
        }
      ],
      dinner: [
        {
          name: "Dry-Aged Ribeye",
          description: "28-day dry-aged ribeye with roasted vegetables and red wine reduction",
          price: 65,
          category: "main",
          image: "/images/hotel/food-dinner.jpg"
        },
        {
          name: "Pan-Seared Halibut",
          description: "Fresh halibut with lemon butter sauce, quinoa, and seasonal vegetables",
          price: 42,
          category: "main"
        },
        {
          name: "Truffle Pasta",
          description: "House-made pasta with black truffle, parmesan, and white wine cream sauce",
          price: 38,
          category: "main"
        }
      ],
      dessert: [
        {
          name: "Chocolate Soufflé",
          description: "Warm chocolate soufflé with vanilla ice cream and berry coulis",
          price: 16,
          category: "dessert",
          image: "/images/hotel/food-dessert.jpg"
        },
        {
          name: "Tiramisu",
          description: "Classic tiramisu with espresso and mascarpone",
          price: 14,
          category: "dessert"
        }
      ]
    }
  },

  // Staff Information
  staff: [
    {
      name: "Sarah Mitchell",
      position: "General Manager",
      bio: "With over 15 years in luxury hospitality, Sarah ensures every guest receives exceptional service.",
      image: "/images/hotel/staff-general-manager.jpg"
    },
    {
      name: "Chef Michael Rodriguez",
      position: "Executive Chef",
      bio: "Award-winning chef with experience in Michelin-starred restaurants, creating innovative culinary experiences.",
      image: "/images/hotel/staff-executive-chef.jpg"
    },
    {
      name: "David Chen",
      position: "Concierge Manager",
      bio: "Expert in NYC attractions and services, helping guests create unforgettable experiences.",
      image: "/images/hotel/staff-concierge.jpg"
    }
  ],

  // Hotel History
  history: {
    founded: "1985",
    story: "Grand Palace Hotel opened its doors in 1985 as a beacon of luxury in the heart of Manhattan. Originally built as a grand residence for a prominent New York family, the building was transformed into a world-class hotel while preserving its historic charm and architectural beauty.",
    milestones: [
      "1985 - Grand Palace Hotel opens",
      "1992 - First AAA Five Diamond Award",
      "2001 - Major renovation and expansion",
      "2010 - Green certification",
      "2015 - 30th anniversary celebration",
      "2020 - Digital transformation initiative"
    ]
  },

  // Local Attractions
  attractions: [
    {
      name: "Central Park",
      distance: "0.3 miles",
      description: "World-famous urban park perfect for morning runs or leisurely strolls"
    },
    {
      name: "Metropolitan Museum of Art",
      distance: "0.5 miles",
      description: "One of the world's largest and finest art museums"
    },
    {
      name: "Times Square",
      distance: "1.2 miles",
      description: "The heart of Broadway and entertainment district"
    },
    {
      name: "High Line",
      distance: "2.1 miles",
      description: "Elevated park built on historic freight rail line"
    }
  ],

  // Guest Reviews
  reviews: [
    {
      name: "Jennifer Walsh",
      rating: 5,
      comment: "Absolutely stunning hotel with impeccable service. The executive suite was beyond expectations, and the staff went above and beyond to make our anniversary special.",
      date: "2024-01-15",
      room: "Executive Suite"
    },
    {
      name: "Robert Kim",
      rating: 5,
      comment: "The Grand Palace Hotel exceeded all our expectations. The location is perfect, the rooms are luxurious, and the dining experience was exceptional.",
      date: "2024-01-10",
      room: "Deluxe King"
    },
    {
      name: "Maria Santos",
      rating: 4,
      comment: "Beautiful hotel with great amenities. The spa services were wonderful, and the rooftop pool has amazing city views.",
      date: "2024-01-08",
      room: "Presidential Suite"
    }
  ]
};

export default hotelData;





