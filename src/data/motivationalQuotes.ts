
export interface Quote {
  text: string;
  author: string;
  category: string;
}

export const motivationalQuotes: Quote[] = [
  // Classical Wisdom & Philosophy
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "Wisdom" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Hope" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "Self-Reflection" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Self-Knowledge" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Authenticity" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein", category: "Humor" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Change" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Opportunity" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life" },

  // Success & Achievement
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Perseverance" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Beginning" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill", category: "Resilience" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Passion" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Innovation" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "Authenticity" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", category: "Growth" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", category: "Resilience" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "Education" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Possibility" },
  { text: "Warriors don't wait for motivation - they create it!", author: "Unknown", category: "Motivation" },
  { text: "Every setback is a setup for a greater comeback!", author: "Unknown", category: "Resilience" },
  { text: "The eagle soars alone while chickens flock together!", author: "Unknown", category: "Independence" },
  { text: "Your past does not define you - your actions do!", author: "Unknown", category: "Action" },
  { text: "Success is not for the timid - claim it with fury!", author: "Unknown", category: "Success" },
  { text: "The anvil of adversity forges the strongest steel!", author: "Unknown", category: "Strength" },
  { text: "Doubt kills more dreams than failure ever will!", author: "Unknown", category: "Confidence" },
  { text: "Be the storm they never saw coming!", author: "Unknown", category: "Power" },
  { text: "Excellence is not an act but a habit - forge it daily!", author: "Unknown", category: "Excellence" },
  { text: "The warrior's greatest enemy is his own comfort!", author: "Unknown", category: "Growth" }
];

export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};

export const getShuffledQuotes = (): Quote[] => {
  const shuffled = [...motivationalQuotes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
