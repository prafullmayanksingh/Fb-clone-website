export const currentUser = {
  id: "you",
  name: "Alex Morgan",
  avatar: "https://i.pravatar.cc/160?img=12",
  cover: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85",
  bio: "Making memories, one day at a time ✨",
};

export const people = [
  { id: "maya", name: "Maya Chen", avatar: "https://i.pravatar.cc/160?img=47", mutuals: 12, note: "Works at Studio North" },
  { id: "jordan", name: "Jordan Lee", avatar: "https://i.pravatar.cc/160?img=11", mutuals: 8, note: "Lives in San Francisco" },
  { id: "sofia", name: "Sofia Rivera", avatar: "https://i.pravatar.cc/160?img=44", mutuals: 21, note: "Photographer" },
  { id: "sam", name: "Sam Wilson", avatar: "https://i.pravatar.cc/160?img=13", mutuals: 5, note: "Went to Westview High" },
  { id: "olivia", name: "Olivia Park", avatar: "https://i.pravatar.cc/160?img=49", mutuals: 16, note: "Loves the outdoors" },
  { id: "noah", name: "Noah Bennett", avatar: "https://i.pravatar.cc/160?img=60", mutuals: 3, note: "Product designer" },
];

export const initialPosts = [
  {
    id: "post-1",
    author: "maya",
    text: "A little reminder to slow down and enjoy the view. This weekend was exactly what I needed 🌿",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85",
    time: "2 hrs",
    likes: 128,
    comments: [{ id: "c-1", author: "jordan", text: "This is so beautiful!", time: "1 hr" }],
    shares: 8,
    liked: false,
  },
  {
    id: "post-2",
    author: "jordan",
    text: "Weekend baking experiment: lemon blueberry cake. I think this one is a keeper 🍋🫐",
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=85",
    time: "4 hrs",
    likes: 76,
    comments: [],
    shares: 3,
    liked: false,
  },
  {
    id: "post-3",
    author: "sofia",
    text: "Golden hour never gets old. Found this little spot on my walk home yesterday ✨",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    time: "Yesterday",
    likes: 214,
    comments: [{ id: "c-2", author: "olivia", text: "Adding this to my list!", time: "18 hrs" }],
    shares: 14,
    liked: true,
  },
  {
    id: "post-4",
    author: "olivia",
    text: "Sunday reset: coffee, a good book, and absolutely nowhere to be ☕ What's everyone reading lately?",
    image: "",
    time: "Yesterday",
    likes: 42,
    comments: [],
    shares: 2,
    liked: false,
  },
];

export const initialChats = [
  { id: "maya", unread: 2, messages: [{ from: "maya", text: "Hey! Are we still on for coffee this week?", time: "10:42 AM" }, { from: "you", text: "Absolutely! Thursday works for me ☕", time: "10:45 AM" }, { from: "maya", text: "Perfect, see you then!", time: "10:46 AM" }] },
  { id: "jordan", unread: 0, messages: [{ from: "jordan", text: "Just sent you the recipe!", time: "Yesterday" }] },
  { id: "sofia", unread: 1, messages: [{ from: "sofia", text: "You would love this new photo walk group.", time: "Yesterday" }] },
];

export const groups = [
  { id: "weekend-hikers", name: "Weekend Hikers", members: "12.4K members", category: "Outdoors", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80" },
  { id: "home-cooks", name: "The Home Cooks Club", members: "8.2K members", category: "Food & drink", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80" },
  { id: "creative-people", name: "Creative People", members: "24K members", category: "Arts & culture", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80" },
];

export const products = [
  { id: "camera", title: "Vintage film camera", price: "$85", location: "Brooklyn, NY", category: "Electronics", seller: "maya", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80" },
  { id: "chair", title: "Mid-century accent chair", price: "$120", location: "Queens, NY", category: "Furniture", seller: "jordan", image: "https://images.unsplash.com/photo-1598300056393-4aac492f4344?auto=format&fit=crop&w=800&q=80" },
  { id: "plant", title: "Monstera deliciosa", price: "$25", location: "Brooklyn, NY", category: "Home & garden", seller: "sofia", image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80" },
  { id: "record", title: "Record player + speakers", price: "$160", location: "Jersey City, NJ", category: "Electronics", seller: "olivia", image: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=800&q=80" },
];

export const stories = [
  { id: "maya", name: "Maya", image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=500&q=80", avatar: people[0].avatar },
  { id: "jordan", name: "Jordan", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80", avatar: people[1].avatar },
  { id: "sofia", name: "Sofia", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80", avatar: people[2].avatar },
  { id: "olivia", name: "Olivia", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=500&q=80", avatar: people[4].avatar },
];
