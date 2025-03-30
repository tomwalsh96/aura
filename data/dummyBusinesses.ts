import { Business } from '../types/business';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  specialties: string[];
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffId: string;
}

interface Booking {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string;
  timeSlotId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  staffIds: string[];
}

interface BusinessWithDetails extends Business {
  staff: StaffMember[];
  services: Service[];
  timeSlots: TimeSlot[];
  bookings: Booking[];
  type: string;
}

export const dummyBusinesses: BusinessWithDetails[] = [
  {
    id: 'e8f7d9c2-3a1b-4e5f-8c9d-2b3a4f5e6d7c',
    name: "Shear Madness",
    description: "Traditional salon where we promise not to talk about your receding hairline... unless you bring it up first",
    address: "15 Grafton Street, Dublin 2",
    rating: 4.8,
    reviews: 156,
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70",
    type: "salon",
    staff: [
      {
        id: "staff1",
        name: "John Smith",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        bio: "10 years of experience in modern and classic cuts",
        specialties: ["Fades", "Designs", "Beard Trimming"]
      },
      {
        id: "staff2",
        name: "Mike Johnson",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
        bio: "Specializing in kids cuts and modern styles",
        specialties: ["Kids Cuts", "Modern Styles", "Designs"]
      }
    ],
    services: [
      { 
        id: "service1",
        name: "Women's Cut", 
        price: 65, 
        duration: "45min",
        description: "Professional women's haircut with wash and style",
        staffIds: ["staff1", "staff2"]
      },
      { 
        id: "service2",
        name: "Color", 
        price: 120, 
        duration: "2h",
        description: "Full hair colouring service with premium products",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Blowout", 
        price: 45, 
        duration: "30min",
        description: "Professional blow dry and styling",
        staffIds: ["staff2"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "10:00",
        endTime: "10:45",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "10:45",
        endTime: "11:30",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "11:30",
        endTime: "12:15",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer10",
        staffId: "staff1",
        serviceId: "service2",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    name: "Style & Grace",
    description: "Upscale salon where your hair transformation costs less than a therapy session (but works just as well)",
    address: "42 Henry Street, Dublin 1",
    rating: 4.9,
    reviews: 203,
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035",
    type: "salon",
    services: [
      { 
        id: "service1",
        name: "Curly Cut", 
        price: 75, 
        duration: "1h",
        description: "Specialized cut for curly hair types",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Perm", 
        price: 150, 
        duration: "2h30min",
        description: "Professional perming service with aftercare",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Hair Therapy", 
        price: 90, 
        duration: "1h30min",
        description: "Deep conditioning and treatment",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Sarah Wilson",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        bio: "15 years of experience in curly hair and perming",
        specialties: ["Curly Hair", "Perming", "Colour"]
      },
      {
        id: "staff2",
        name: "Emma Davis",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        bio: "Specialist in hair treatments and styling",
        specialties: ["Hair Treatments", "Styling", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "10:00",
        endTime: "11:00",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "11:00",
        endTime: "12:00",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "12:00",
        endTime: "13:00",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer2",
        staffId: "staff1",
        serviceId: "service2",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "Where we turn 'I just want a trim' into 'Who's that model in the mirror?'",
    address: "28 South William Street, Dublin 2",
    rating: 4.7,
    reviews: 128,
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
    type: "barber",
    services: [
      { 
        id: "service1",
        name: "Full Makeover", 
        price: 200, 
        duration: "3h",
        description: "Complete hair transformation service",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Extensions", 
        price: 300, 
        duration: "4h",
        description: "Professional hair extension application",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Wedding Style", 
        price: 150, 
        duration: "2h",
        description: "Special occasion styling service",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Lisa Anderson",
        role: "Master Stylist",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        bio: "20 years of experience in transformations and extensions",
        specialties: ["Hair Extensions", "Transformations", "Wedding Styling"]
      },
      {
        id: "staff2",
        name: "Rachel Brown",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in wedding and special occasion styling",
        specialties: ["Wedding Styling", "Special Occasions", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "09:00",
        endTime: "12:00",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "12:00",
        endTime: "15:00",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "15:00",
        endTime: "18:00",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer3",
        staffId: "staff1",
        serviceId: "service1",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "The only place where 'I want something different' doesn't end in tears",
    address: "12 Wicklow Street, Dublin 2",
    rating: 4.6,
    reviews: 189,
    imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702",
    type: "salon",
    services: [
      { 
        id: "service1",
        name: "Curly Cut", 
        price: 75, 
        duration: "1h",
        description: "Specialized cut for curly hair types",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Perm", 
        price: 150, 
        duration: "2h30min",
        description: "Professional perming service with aftercare",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Hair Therapy", 
        price: 90, 
        duration: "1h30min",
        description: "Deep conditioning and treatment",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Emma Wilson",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        bio: "15 years of experience in curly hair and perming",
        specialties: ["Curly Hair", "Perming", "Colour"]
      },
      {
        id: "staff2",
        name: "Sophie Davis",
        role: "Stylist",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        bio: "Specialist in hair treatments and styling",
        specialties: ["Hair Treatments", "Styling", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "10:00",
        endTime: "11:00",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "11:00",
        endTime: "12:00",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "12:00",
        endTime: "13:00",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer2",
        staffId: "staff1",
        serviceId: "service2",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "Making bad hair days extinct since 2010 (except during hurricanes, we're not magicians)",
    address: "8 Dawson Street, Dublin 2",
    rating: 4.9,
    reviews: 245,
    imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1",
    type: "salon",
    services: [
      { 
        id: "service1",
        name: "Full Makeover", 
        price: 200, 
        duration: "3h",
        description: "Complete hair transformation service",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Extensions", 
        price: 300, 
        duration: "4h",
        description: "Professional hair extension application",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Wedding Style", 
        price: 150, 
        duration: "2h",
        description: "Special occasion styling service",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Lisa Anderson",
        role: "Master Stylist",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        bio: "20 years of experience in transformations and extensions",
        specialties: ["Hair Extensions", "Transformations", "Wedding Styling"]
      },
      {
        id: "staff2",
        name: "Rachel Brown",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in wedding and special occasion styling",
        specialties: ["Wedding Styling", "Special Occasions", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "09:00",
        endTime: "12:00",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "12:00",
        endTime: "15:00",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "15:00",
        endTime: "18:00",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer3",
        staffId: "staff1",
        serviceId: "service1",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "We're not saying we're better than Einstein, but have you seen his hair?",
    address: "24 Drury Street, Dublin 2",
    rating: 4.8,
    reviews: 167,
    imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6",
    type: "barber",
    services: [
      { 
        id: "service1",
        name: "Smart Cut", 
        price: 40,
        duration: "45min",
        description: "Precision haircut with modern techniques",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Beard Sculpting", 
        price: 30,
        duration: "30min",
        description: "Detailed beard shaping and grooming",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Head Shave", 
        price: 35, 
        duration: "30min",
        description: "Complete head shave with hot towel",
        staffIds: ["staff1"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Michael Brown",
        role: "Master Barber",
        imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6",
        bio: "15 years of experience in modern barbering",
        specialties: ["Precision Cuts", "Beard Grooming", "Head Shaves"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "09:00",
        endTime: "09:45",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "09:45",
        endTime: "10:15",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot3",
        startTime: "10:15",
        endTime: "10:45",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer9",
        staffId: "staff1",
        serviceId: "service1",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "Business in the front, party in the back, laughs all around",
    address: "16 Fade Street, Dublin 2",
    rating: 4.5,
    reviews: 142,
    imageUrl: "https://images.unsplash.com/photo-1584316712724-f5d4b188fee2",
    type: "barber",
    services: [
      { 
        id: "service1",
        name: "The Mullet", 
        price: 45, 
        duration: "45min",
        description: "Classic mullet style with modern touch",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "The Billy Ray", 
        price: 50, 
        duration: "1h",
        description: "Signature mullet style with extra flair",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Modern Mullet", 
        price: 55, 
        duration: "1h",
        description: "Contemporary take on the classic mullet",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Billy Ray Cyrus",
        role: "Master Mullet Specialist",
        imageUrl: "https://images.unsplash.com/photo-1584316712724-f5d4b188fee2",
        bio: "30 years of mullet expertise and innovation",
        specialties: ["Classic Mullets", "Modern Mullets", "Billy Ray Special"]
      },
      {
        id: "staff2",
        name: "Miley Cyrus",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Bringing modern twists to classic styles",
        specialties: ["Modern Mullets", "Styling", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "10:00",
        endTime: "10:45",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "10:45",
        endTime: "11:45",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "11:45",
        endTime: "12:45",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer5",
        staffId: "staff1",
        serviceId: "service2",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "Follow the highlighted road to fabulous hair (No ruby slippers required)",
    address: "33 Clarendon Street, Dublin 2",
    rating: 4.7,
    reviews: 198,
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
    type: "salon",
    services: [
      { 
        id: "service1",
        name: "Rainbow Color", 
        price: 180, 
        duration: "3h",
        description: "Vibrant rainbow hair coloring service",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Fantasy Cut", 
        price: 70, 
        duration: "1h",
        description: "Creative fantasy-inspired haircut",
        staffIds: ["staff2"]
      },
      { 
        id: "service3",
        name: "Emerald Treatment", 
        price: 90, 
        duration: "1h30min",
        description: "Specialized green hair treatment",
        staffIds: ["staff1"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Rainbow Bright",
        role: "Master Colourist",
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
        bio: "15 years of experience in fantasy hair colouring",
        specialties: ["Rainbow Colours", "Fantasy Colours", "Hair Treatments"]
      },
      {
        id: "staff2",
        name: "Pixie Dust",
        role: "Senior Stylist",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        bio: "Specialist in fantasy cuts and styling",
        specialties: ["Fantasy Cuts", "Styling", "Colour"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "10:00",
        endTime: "13:00",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "13:00",
        endTime: "14:00",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "14:00",
        endTime: "15:30",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer6",
        staffId: "staff1",
        serviceId: "service1",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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
    description: "To infinity and beyond... but first, let's fix that bedhead",
    address: "5 Chatham Street, Dublin 2",
    rating: 4.6,
    reviews: 176,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
    type: "barber",
    services: [
      { 
        id: "service1",
        name: "Space Fade", 
        price: 40, 
        duration: "45min",
        description: "Cosmic-inspired fade haircut",
        staffIds: ["staff1"]
      },
      { 
        id: "service2",
        name: "Meteor Mohawk", 
        price: 50, 
        duration: "1h",
        description: "Space-themed mohawk style",
        staffIds: ["staff1"]
      },
      { 
        id: "service3",
        name: "Buzz Cut", 
        price: 30, 
        duration: "30min",
        description: "Classic buzz cut with precision",
        staffIds: ["staff2"]
      }
    ],
    staff: [
      {
        id: "staff1",
        name: "Neil Armstrong",
        role: "Space Barber",
        imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
        bio: "20 years of experience in cosmic hair styling",
        specialties: ["Space Fades", "Meteor Mohawks", "Precision Cuts"]
      },
      {
        id: "staff2",
        name: "Buzz Aldrin",
        role: "Senior Space Barber",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        bio: "Specialist in space-themed cuts and styles",
        specialties: ["Buzz Cuts", "Space Styles", "Precision"]
      }
    ],
    timeSlots: [
      {
        id: "slot1",
        startTime: "09:00",
        endTime: "09:45",
        isAvailable: true,
        staffId: "staff1"
      },
      {
        id: "slot2",
        startTime: "09:45",
        endTime: "10:45",
        isAvailable: true,
        staffId: "staff2"
      },
      {
        id: "slot3",
        startTime: "10:45",
        endTime: "11:15",
        isAvailable: false,
        staffId: "staff1"
      }
    ],
    bookings: [
      {
        id: "booking1",
        customerId: "customer7",
        staffId: "staff1",
        serviceId: "service2",
        date: "2024-03-30",
        timeSlotId: "slot3",
        status: "CONFIRMED"
      }
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

export async function getAllBusinesses(): Promise<BusinessWithDetails[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dummyBusinesses;
}

export async function getBusinessData(businessId: string): Promise<BusinessWithDetails | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return dummyBusinesses.find(b => b.id === businessId) || null;
}

export async function getAvailableTimeSlots(businessId: string, date: string): Promise<TimeSlot[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) return [];
  
  const bookedSlotIds = business.bookings
    .filter(booking => booking.date === date && booking.status === "CONFIRMED")
    .map(booking => booking.timeSlotId);
    
  return business.timeSlots.filter(slot => 
    !bookedSlotIds.includes(slot.id) && slot.isAvailable
  );
}

export async function getStaffMembers(businessId: string): Promise<StaffMember[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  return business?.staff || [];
}

export async function getServices(businessId: string): Promise<Service[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  return business?.services || [];
}

export async function createBooking(
  businessId: string,
  customerId: string,
  staffId: string,
  serviceId: string,
  date: string,
  timeSlotId: string
): Promise<Booking> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) throw new Error("Business not found");
  
  const isSlotAvailable = business.timeSlots.some(slot => 
    slot.id === timeSlotId && slot.isAvailable
  );
  
  if (!isSlotAvailable) {
    throw new Error("Time slot is not available");
  }
  
  const newBooking: Booking = {
    id: `booking${Date.now()}`,
    customerId,
    staffId,
    serviceId,
    date,
    timeSlotId,
    status: "CONFIRMED"
  };
  
  business.bookings.push(newBooking);
  return newBooking;
}

export async function cancelBooking(businessId: string, bookingId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const business = dummyBusinesses.find(b => b.id === businessId);
  if (!business) return false;
  
  const booking = business.bookings.find(b => b.id === bookingId);
  if (!booking) return false;
  
  booking.status = "CANCELLED";
  return true;
}