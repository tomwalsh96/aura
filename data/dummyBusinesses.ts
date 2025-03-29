import { Business, BusinessType } from '../types/business';

export const dummyBusinesses: Business[] = [
  {
    id: 'e8f7d9c2-3a1b-4e5f-8c9d-2b3a4f5e6d7c',
    name: "Shear Madness & Hair-esy",
    type: BusinessType.BARBERSHOP,
    description: "Traditional barbershop where we promise not to talk about your receding hairline... unless you bring it up first",
    address: "123 Main St, Downtown",
    rating: 4.8,
    reviews: 156,
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    services: [
      { name: "Haircut", price: 30, duration: "30min" },
      { name: "Beard Trim", price: 20, duration: "20min" },
      { name: "Hot Shave", price: 35, duration: "45min" }
    ],
    openingHours: {
      "Monday": "9:00 AM - 6:00 PM",
      "Tuesday": "9:00 AM - 6:00 PM",
      "Wednesday": "9:00 AM - 6:00 PM",
      "Thursday": "9:00 AM - 6:00 PM",
      "Friday": "9:00 AM - 7:00 PM",
      "Saturday": "10:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
    name: "Style & Grace Hair Studio",
    type: BusinessType.HAIR_SALON,
    description: "Upscale salon where your hair transformation costs less than a therapy session (but works just as well)",
    address: "456 Fashion Ave",
    rating: 4.9,
    reviews: 203,
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035",
    services: [
      { name: "Women's Cut", price: 65, duration: "45min" },
      { name: "Color", price: 120, duration: "2h" },
      { name: "Blowout", price: 45, duration: "30min" }
    ],
    openingHours: {
      "Monday": "10:00 AM - 7:00 PM",
      "Tuesday": "10:00 AM - 7:00 PM",
      "Wednesday": "10:00 AM - 7:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7',
    name: "Urban Edge Barbers",
    type: BusinessType.BARBERSHOP,
    description: "Where we turn 'I just want a trim' into 'Who's that model in the mirror?'",
    address: "789 Hip Street",
    rating: 4.7,
    reviews: 128,
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    services: [
      { name: "Fade", price: 35, duration: "45min" },
      { name: "Design", price: 45, duration: "1h" },
      { name: "Kids Cut", price: 25, duration: "30min" }
    ],
    openingHours: {
      "Monday": "11:00 AM - 8:00 PM",
      "Tuesday": "11:00 AM - 8:00 PM",
      "Wednesday": "11:00 AM - 8:00 PM",
      "Thursday": "11:00 AM - 8:00 PM",
      "Friday": "11:00 AM - 9:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "12:00 PM - 5:00 PM"
    }
  },
  {
    id: 'c3d4e5f6-7g8h-9i0j-1k2l-m3n4o5p6q7r8',
    name: "Curl Up & Dye",
    type: BusinessType.HAIR_SALON,
    description: "The only place where 'I want something different' doesn't end in tears",
    address: "101 Pun Lane",
    rating: 4.6,
    reviews: 189,
    imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
    services: [
      { name: "Curly Cut", price: 75, duration: "1h" },
      { name: "Perm", price: 150, duration: "2h30min" },
      { name: "Hair Therapy", price: 90, duration: "1h30min" }
    ],
    openingHours: {
      "Monday": "9:00 AM - 7:00 PM",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 8:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'd4e5f6g7-8h9i-0j1k-2l3m-n4o5p6q7r8s9',
    name: "The Mane Event",
    type: BusinessType.HAIR_SALON,
    description: "Making bad hair days extinct since 2010 (except during hurricanes, we're not magicians)",
    address: "202 Neigh Street",
    rating: 4.9,
    reviews: 245,
    imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1",
    services: [
      { name: "Full Makeover", price: 200, duration: "3h" },
      { name: "Extensions", price: 300, duration: "4h" },
      { name: "Wedding Style", price: 150, duration: "2h" }
    ],
    openingHours: {
      "Monday": "10:00 AM - 8:00 PM",
      "Tuesday": "10:00 AM - 8:00 PM",
      "Wednesday": "10:00 AM - 8:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 9:00 PM",
      "Saturday": "9:00 AM - 7:00 PM",
      "Sunday": "10:00 AM - 4:00 PM"
    }
  },
  {
    id: 'e5f6g7h8-9i0j-1k2l-3m4n-o5p6q7r8s9t0',
    name: "Shear Genius",
    type: BusinessType.BARBERSHOP,
    description: "We're not saying we're better than Einstein, but have you seen his hair?",
    address: "303 Clever Court",
    rating: 4.8,
    reviews: 167,
    imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6",
    services: [
      { name: "Smart Cut", price: 40, duration: "45min" },
      { name: "Beard Sculpting", price: 30, duration: "30min" },
      { name: "Head Shave", price: 35, duration: "30min" }
    ],
    openingHours: {
      "Monday": "8:00 AM - 6:00 PM",
      "Tuesday": "8:00 AM - 6:00 PM",
      "Wednesday": "8:00 AM - 6:00 PM",
      "Thursday": "8:00 AM - 7:00 PM",
      "Friday": "8:00 AM - 7:00 PM",
      "Saturday": "9:00 AM - 5:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'f6g7h8i9-0j1k-2l3m-4n5o-p6q7r8s9t0u1',
    name: "Mullet Over",
    type: BusinessType.BARBERSHOP,
    description: "Business in the front, party in the back, laughs all around",
    address: "404 Retro Road",
    rating: 4.5,
    reviews: 142,
    imageUrl: "https://images.unsplash.com/photo-1584316712724-f5d4b188fee2",
    services: [
      { name: "The Mullet", price: 45, duration: "45min" },
      { name: "The Billy Ray", price: 50, duration: "1h" },
      { name: "Modern Mullet", price: 55, duration: "1h" }
    ],
    openingHours: {
      "Monday": "11:00 AM - 7:00 PM",
      "Tuesday": "11:00 AM - 7:00 PM",
      "Wednesday": "11:00 AM - 7:00 PM",
      "Thursday": "11:00 AM - 7:00 PM",
      "Friday": "11:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'g7h8i9j0-1k2l-3m4n-5o6p-q7r8s9t0u1v2',
    name: "Scissors of Oz",
    type: BusinessType.HAIR_SALON,
    description: "Follow the highlighted road to fabulous hair (No ruby slippers required)",
    address: "505 Yellow Brick Way",
    rating: 4.7,
    reviews: 198,
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
    services: [
      { name: "Rainbow Color", price: 180, duration: "3h" },
      { name: "Fantasy Cut", price: 70, duration: "1h" },
      { name: "Emerald Treatment", price: 90, duration: "1h30min" }
    ],
    openingHours: {
      "Monday": "10:00 AM - 7:00 PM",
      "Tuesday": "10:00 AM - 7:00 PM",
      "Wednesday": "10:00 AM - 7:00 PM",
      "Thursday": "10:00 AM - 8:00 PM",
      "Friday": "10:00 AM - 8:00 PM",
      "Saturday": "9:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  },
  {
    id: 'h8i9j0k1-2l3m-4n5o-6p7q-r8s9t0u1v2w3',
    name: "The Buzz Lightyear",
    type: BusinessType.BARBERSHOP,
    description: "To infinity and beyond... but first, let's fix that bedhead",
    address: "606 Space Station Strip",
    rating: 4.6,
    reviews: 176,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    services: [
      { name: "Space Fade", price: 40, duration: "45min" },
      { name: "Meteor Mohawk", price: 50, duration: "1h" },
      { name: "Buzz Cut", price: 30, duration: "30min" }
    ],
    openingHours: {
      "Monday": "9:00 AM - 7:00 PM",
      "Tuesday": "9:00 AM - 7:00 PM",
      "Wednesday": "9:00 AM - 7:00 PM",
      "Thursday": "9:00 AM - 7:00 PM",
      "Friday": "9:00 AM - 8:00 PM",
      "Saturday": "10:00 AM - 6:00 PM",
      "Sunday": "Closed"
    }
  }
];