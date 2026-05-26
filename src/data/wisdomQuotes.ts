export interface WisdomQuote {
  text: string;
  author: string;
  category: string;
}

export const wisdomQuotes: WisdomQuote[] = [
  // Ancient Greek Philosophy
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "Wisdom" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Hope" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "Self-Reflection" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Self-Knowledge" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "Excellence" },
  { text: "The way to gain a good reputation is to endeavor to be what you desire to appear.", author: "Socrates", category: "Character" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle", category: "Happiness" },
  { text: "No man ever steps in the same river twice.", author: "Heraclitus", category: "Change" },
  { text: "The only constant in life is change.", author: "Heraclitus", category: "Change" },
  { text: "He who is not contented with what he has, would not be contented with what he would like to have.", author: "Socrates", category: "Contentment" },

  // Roman Stoicism
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "Inner Strength" },
  { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius", category: "Character" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", category: "Happiness" },
  { text: "What we do now echoes in eternity.", author: "Marcus Aurelius", category: "Legacy" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", category: "Mindset" },
  { text: "It is not what happens to you, but how you react to it that matters.", author: "Epictetus", category: "Response" },
  { text: "No one can hurt you without your permission.", author: "Epictetus", category: "Personal Power" },
  { text: "Wealth consists in not having great possessions, but in having few wants.", author: "Epictetus", category: "Contentment" },
  { text: "Every new beginning comes from some other beginning's end.", author: "Seneca", category: "New Beginnings" },
  { text: "Life is long enough if you know how to use it.", author: "Seneca", category: "Time" },

  // Eastern Philosophy
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", category: "Beginning" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", category: "Persistence" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Perseverance" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius", category: "Resilience" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius", category: "Simplicity" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "Action" },
  { text: "When the winds of change blow, some people build walls and others build windmills.", author: "Chinese Proverb", category: "Adaptation" },
  { text: "The person who says it cannot be done should not interrupt the person who is doing it.", author: "Chinese Proverb", category: "Possibility" },
  { text: "If you want happiness for an hour, take a nap. If you want happiness for a day, go fishing. If you want happiness for a year, inherit a fortune. If you want happiness for a lifetime, help somebody.", author: "Chinese Proverb", category: "Service" },
  { text: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", author: "Eleanor Roosevelt", category: "Present Moment" },

  // Modern Wisdom
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt", category: "Courage" },
  { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt", category: "Self-Worth" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt", category: "Intellectual Growth" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "Purpose" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", category: "Happiness" },
  { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama", category: "Kindness" },
  { text: "If you want others to be happy, practice compassion. If you want to be happy, practice compassion.", author: "Dalai Lama", category: "Compassion" },
  { text: "The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.", author: "Martin Luther King Jr.", category: "Character" },
  { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr.", category: "Love" },

  // Literary Wisdom
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Authenticity" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde", category: "Hope" },
  { text: "I can resist everything except temptation.", author: "Oscar Wilde", category: "Human Nature" },
  { text: "The only way out of the labyrinth of suffering is to forgive.", author: "John Green", category: "Forgiveness" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein", category: "Humor" },
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein", category: "Creativity" },
  { text: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein", category: "Values" },
  { text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein", category: "Imagination" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein", category: "Curiosity" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein", category: "Progress" },

  // Leadership & Character
  { text: "Character is like a tree and reputation like a shadow. The shadow is what we think of it; the tree is the real thing.", author: "Abraham Lincoln", category: "Character" },
  { text: "Nearly all men can stand adversity, but if you want to test a man's character, give him power.", author: "Abraham Lincoln", category: "Power" },
  { text: "The best way to find out if you can trust somebody is to trust them.", author: "Ernest Hemingway", category: "Trust" },
  { text: "Courage is grace under pressure.", author: "Ernest Hemingway", category: "Courage" },
  { text: "The time is always right to do what is right.", author: "Martin Luther King Jr.", category: "Justice" },
  { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr.", category: "Friendship" },
  { text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr.", category: "Justice" },
  { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr.", category: "Faith" },
  { text: "The arc of the moral universe is long, but it bends toward justice.", author: "Martin Luther King Jr.", category: "Justice" },
  { text: "A man who stands for nothing will fall for anything.", author: "Malcolm X", category: "Principles" },

  // Life & Meaning
  { text: "The meaning of life is to find your gift. The purpose of life is to give it away.", author: "Pablo Picasso", category: "Purpose" },
  { text: "Everything you can imagine is real.", author: "Pablo Picasso", category: "Imagination" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action" },
  { text: "The chief enemy of creativity is good sense.", author: "Pablo Picasso", category: "Creativity" },
  { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw", category: "Self-Creation" },
  { text: "The single biggest problem in communication is the illusion that it has taken place.", author: "George Bernard Shaw", category: "Communication" },
  { text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw", category: "Change" },
  { text: "We don't stop playing because we grow old; we grow old because we stop playing.", author: "George Bernard Shaw", category: "Youth" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou", category: "Life" },
  { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou", category: "Attitude" },

  // Wisdom from Various Cultures
  { text: "The best revenge is massive success.", author: "Frank Sinatra", category: "Success" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", category: "Persistence" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", category: "Hard Work" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas Edison", category: "Perseverance" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action" },
  { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney", category: "Dreams" },
  { text: "It's kind of fun to do the impossible.", author: "Walt Disney", category: "Possibility" },
  { text: "The difference between winning and losing is most often not quitting.", author: "Walt Disney", category: "Persistence" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers", category: "Present" },
  { text: "Even if you're on the right track, you'll get run over if you just sit there.", author: "Will Rogers", category: "Action" },

  // Spiritual & Philosophical Wisdom
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Inner Strength" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "Self-Determination" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "Innovation" },
  { text: "What you do speaks so loudly that I cannot hear what you say.", author: "Ralph Waldo Emerson", category: "Actions" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", category: "Authenticity" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", category: "Learning" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Change" },
  { text: "The weak can never forgive. Forgiveness is the attribute of the strong.", author: "Mahatma Gandhi", category: "Forgiveness" },
  { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi", category: "Integrity" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi", category: "Gentle Power" },

  // Modern Thinkers
  { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts", category: "Change" },
  { text: "You are an aperture through which the universe is looking at and exploring itself.", author: "Alan Watts", category: "Consciousness" },
  { text: "The meaning of life is just to be alive. It is so plain and so obvious and so simple.", author: "Alan Watts", category: "Life" },
  { text: "Trying to define yourself is like trying to bite your own teeth.", author: "Alan Watts", category: "Self-Definition" },
  { text: "We seldom realize, for example, that our most private thoughts and emotions are not actually our own.", author: "Alan Watts", category: "Consciousness" },
  { text: "Man suffers only because he takes seriously what the gods made for fun.", author: "Alan Watts", category: "Perspective" },
  { text: "The art of living is neither careless drifting on the one hand nor fearful clinging to the past on the other.", author: "Alan Watts", category: "Balance" },
  { text: "You don't look out there for God, something in the sky, you look in you.", author: "Alan Watts", category: "Spirituality" },
  { text: "This is the real secret of life -- to be completely engaged with what you are doing in the here and now.", author: "Alan Watts", category: "Presence" },
  { text: "The more a thing tends to be permanent, the more it tends to be lifeless.", author: "Alan Watts", category: "Impermanence" },

  // Success & Achievement Wisdom
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Courage" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill", category: "Resilience" },
  { text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill", category: "Optimism" },
  { text: "Courage is what it takes to stand up and speak; courage is also what it takes to sit down and listen.", author: "Winston Churchill", category: "Courage" },
  { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill", category: "Service" },
  { text: "The empires of the future are the empires of the mind.", author: "Winston Churchill", category: "Knowledge" },
  { text: "Attitude is a little thing that makes a big difference.", author: "Winston Churchill", category: "Attitude" },
  { text: "Never give in, never give in, never, never, never, never.", author: "Winston Churchill", category: "Persistence" },
  { text: "Kites rise highest against the wind, not with it.", author: "Winston Churchill", category: "Adversity" },
  { text: "The price of greatness is responsibility.", author: "Winston Churchill", category: "Responsibility" },

  // Time & Life Management
  { text: "Time is more valuable than money. You can get more money, but you cannot get more time.", author: "Jim Rohn", category: "Time" },
  { text: "You are the average of the five people you spend the most time with.", author: "Jim Rohn", category: "Influence" },
  { text: "Don't wish it were easier; wish you were better.", author: "Jim Rohn", category: "Self-Improvement" },
  { text: "Success is nothing more than a few simple disciplines, practiced every day.", author: "Jim Rohn", category: "Discipline" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain", category: "Purpose" },
  { text: "Courage is not the absence of fear, but action in spite of it.", author: "Mark Twain", category: "Courage" },
  { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain", category: "Kindness" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Beginning" },
  { text: "Age is an issue of mind over matter. If you don't mind, it doesn't matter.", author: "Mark Twain", category: "Age" },
  { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain", category: "Simple Life" },

  // Learning & Growth
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss", category: "Learning" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss", category: "Self-Direction" },
  { text: "Don't cry because it's over, smile because it happened.", author: "Dr. Seuss", category: "Gratitude" },
  { text: "Today you are you! That is truer than true! There is no one alive who is you-er than you!", author: "Dr. Seuss", category: "Uniqueness" },
  { text: "A person's a person, no matter how small.", author: "Dr. Seuss", category: "Equality" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "Education" },
  { text: "Tell me and I forget, teach me and I may remember, involve me and I learn.", author: "Benjamin Franklin", category: "Learning" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", category: "Action" },
  { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin", category: "Preparation" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", category: "Persistence" },

  // Creativity & Innovation
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "Creativity" },
  { text: "The secret to creativity is knowing how to hide your sources.", author: "Einstein", category: "Creativity" },
  { text: "Creativity takes courage.", author: "Henri Matisse", category: "Courage" },
  { text: "The creative adult is the child who survived.", author: "Ursula K. Le Guin", category: "Creativity" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou", category: "Creativity" },
  { text: "Creativity is contagious, pass it on.", author: "Albert Einstein", category: "Inspiration" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action" },
  { text: "All great achievements require time.", author: "Maya Angelou", category: "Patience" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "Expression" },
  { text: "A wise man can learn more from a foolish question than a fool can learn from a wise answer.", author: "Bruce Lee", category: "Learning" },

  // Relationships & Love
  { text: "The best way to find out if you can trust somebody is to trust them.", author: "Ernest Hemingway", category: "Trust" },
  { text: "We accept the love we think we deserve.", author: "Stephen Chbosky", category: "Self-Worth" },
  { text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu", category: "Love" },
  { text: "The greatest thing you'll ever learn is just to love and be loved in return.", author: "Eden Ahbez", category: "Love" },
  { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle", category: "Love" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi", category: "Love" },
  { text: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller", category: "Beauty" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman", category: "Optimism" },
  { text: "Life is a succession of lessons which must be lived to be understood.", author: "Helen Keller", category: "Experience" },
  { text: "The only way to have a friend is to be one.", author: "Ralph Waldo Emerson", category: "Friendship" },

  // Inner Peace & Mindfulness
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "Inner Peace" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "Mindset" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "Mindfulness" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "Truth" },
  { text: "Hatred does not cease by hatred, but only by love; this is the eternal rule.", author: "Buddha", category: "Love" },
  { text: "Better than a thousand hollow words, is one word that brings peace.", author: "Buddha", category: "Peace" },
  { text: "The trouble is, you think you have time.", author: "Buddha", category: "Time" },
  { text: "If you want to know your past, look at your present condition. If you want to know your future, look at your present actions.", author: "Padmasambhava", category: "Karma" },
  { text: "Wherever you are, be there totally.", author: "Eckhart Tolle", category: "Presence" },
  { text: "The power of now can only be realized now. It requires no time and effort. Effort means you're trying hard to get somewhere, and so you are not present, not here.", author: "Eckhart Tolle", category: "Present Moment" },

  // Wisdom from Various Traditions
  { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell", category: "Good Life" },
  { text: "The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.", author: "Bertrand Russell", category: "Wisdom" },
  { text: "Do not believe in anything simply because you have heard it. Do not believe in anything simply because it is spoken and rumored by many.", author: "Buddha", category: "Critical Thinking" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "Humility" },
  { text: "I know that I am intelligent, because I know that I know nothing.", author: "Socrates", category: "Intelligence" },
  { text: "The greatest remedy for anger is delay.", author: "Seneca", category: "Anger Management" },
  { text: "Every man is guilty of all the good he did not do.", author: "Voltaire", category: "Responsibility" },
  { text: "Judge a man by his questions rather than his answers.", author: "Voltaire", category: "Judgment" },
  { text: "Common sense is not so common.", author: "Voltaire", category: "Common Sense" },
  { text: "I disapprove of what you say, but I will defend to the death your right to say it.", author: "Voltaire", category: "Freedom" },

  // Modern Wisdom & Psychology
  { text: "Everything can be taken from a man but one thing: the last of human freedoms - to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl", category: "Freedom" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", category: "Adaptation" },
  { text: "Those who have a 'why' to live, can bear with almost any 'how'.", author: "Viktor Frankl", category: "Purpose" },
  { text: "What is to give light must endure burning.", author: "Viktor Frankl", category: "Sacrifice" },
  { text: "The one thing you can't take away from me is the way I choose to respond to what you do to me.", author: "Viktor Frankl", category: "Response" },
  { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius", category: "Perspective" },
  { text: "You are not stuck where you are unless you decide to be.", author: "Wayne Dyer", category: "Choice" },
  { text: "Change the way you look at things and the things you look at change.", author: "Wayne Dyer", category: "Perspective" },
  { text: "How people treat you is their karma; how you react is yours.", author: "Wayne Dyer", category: "Karma" },
  { text: "When you judge another, you do not define them, you define yourself.", author: "Wayne Dyer", category: "Judgment" },

  // Additional Wisdom from Great Minds
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Beginning" },
  { text: "If you do what you've always done, you'll get what you've always gotten.", author: "Tony Robbins", category: "Change" },
  { text: "The quality of your life is the quality of your relationships.", author: "Tony Robbins", category: "Relationships" },
  { text: "Progress equals happiness.", author: "Tony Robbins", category: "Progress" },
  { text: "The way we communicate with others and with ourselves ultimately determines the quality of our lives.", author: "Tony Robbins", category: "Communication" },
  { text: "It is in your moments of decision that your destiny is shaped.", author: "Tony Robbins", category: "Decision" },
  { text: "The path to success is to take massive, determined actions.", author: "Tony Robbins", category: "Action" },
  { text: "Beliefs have the power to create and the power to destroy.", author: "Tony Robbins", category: "Beliefs" },
  { text: "The secret of success is learning how to use pain and pleasure instead of having pain and pleasure use you.", author: "Tony Robbins", category: "Success" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins", category: "Focus" },

  // Philosophical Insights
  { text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", author: "Jean-Paul Sartre", category: "Freedom" },
  { text: "Hell is other people.", author: "Jean-Paul Sartre", category: "Relationships" },
  { text: "Freedom is what you do with what's been done to you.", author: "Jean-Paul Sartre", category: "Freedom" },
  { text: "In anguish man becomes aware of his freedom.", author: "Jean-Paul Sartre", category: "Awareness" },
  { text: "Life has no meaning a priori... It is up to you to give it a meaning, and value is nothing but the meaning that you choose.", author: "Jean-Paul Sartre", category: "Meaning" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell", category: "Fear" },
  { text: "Follow your bliss and the universe will open doors where there were only walls.", author: "Joseph Campbell", category: "Purpose" },
  { text: "We must let go of the life we have planned, so as to accept the one that is waiting for us.", author: "Joseph Campbell", category: "Acceptance" },
  { text: "A hero is someone who has given his or her life to something bigger than oneself.", author: "Joseph Campbell", category: "Heroism" },
  { text: "The privilege of a lifetime is being who you are.", author: "Joseph Campbell", category: "Authenticity" },

  // Scientific Wisdom
  { text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", category: "Curiosity" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", category: "Mistakes" },
  { text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.", author: "Albert Einstein", category: "Change" },
  { text: "Great spirits have always encountered violent opposition from mediocre minds.", author: "Albert Einstein", category: "Greatness" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein", category: "Intelligence" },
  { text: "Peace cannot be kept by force; it can only be achieved by understanding.", author: "Albert Einstein", category: "Peace" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein", category: "Value" },
  { text: "The most beautiful thing we can experience is the mysterious.", author: "Albert Einstein", category: "Mystery" },
  { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein", category: "Reality" },
  { text: "The only source of knowledge is experience.", author: "Albert Einstein", category: "Knowledge" },

  // Literary & Artistic Wisdom
  { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus", category: "Freedom" },
  { text: "In the depth of winter, I finally learned that there was in me an invincible summer.", author: "Albert Camus", category: "Resilience" },
  { text: "Don't walk behind me; I may not lead. Don't walk in front of me; I may not follow. Just walk beside me and be my friend.", author: "Albert Camus", category: "Friendship" },
  { text: "The struggle itself toward the heights is enough to fill a man's heart.", author: "Albert Camus", category: "Struggle" },
  { text: "There is but one truly serious philosophical problem, and that is suicide.", author: "Albert Camus", category: "Philosophy" },
  { text: "What doesn't kill you, makes you stronger.", author: "Friedrich Nietzsche", category: "Strength" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "Purpose" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "Music" },
  { text: "And those who were seen dancing were thought to be insane by those who could not hear the music.", author: "Friedrich Nietzsche", category: "Understanding" },
  { text: "Become who you are.", author: "Friedrich Nietzsche", category: "Self-Actualization" },

  // Wisdom from Women Leaders
  { text: "A woman is like a tea bag; you never know how strong it is until it's in hot water.", author: "Eleanor Roosevelt", category: "Strength" },
  { text: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt", category: "Courage" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
  { text: "It is better to light a candle than curse the darkness.", author: "Eleanor Roosevelt", category: "Action" },
  { text: "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt", category: "Growth" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou", category: "Impact" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "Expression" },
  { text: "If you don't like something, change it. If you can't change it, change your attitude.", author: "Maya Angelou", category: "Attitude" },
  { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou", category: "Kindness" },
  { text: "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.", author: "Maya Angelou", category: "Transformation" },

  // Business & Leadership Wisdom
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action" },
  { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney", category: "Dreams" },
  { text: "It's kind of fun to do the impossible.", author: "Walt Disney", category: "Possibility" },
  { text: "The difference between winning and losing is most often not quitting.", author: "Walt Disney", category: "Persistence" },
  { text: "Disneyland is a work of love.", author: "Walt Disney", category: "Love" },
  { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs", category: "Work" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Innovation" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", category: "Ambition" },
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs", category: "Design" },
  { text: "Sometimes life hits you in the head with a brick. Don't lose faith.", author: "Steve Jobs", category: "Faith" },

  // Spiritual & Mystical Wisdom
  { text: "The wound is the place where the Light enters you.", author: "Rumi", category: "Healing" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "Wisdom" },
  { text: "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.", author: "Rumi", category: "Love" },
  { text: "The breeze at dawn has secrets to tell you. Don't go back to sleep!", author: "Rumi", category: "Awakening" },
  { text: "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.", author: "Rumi", category: "Individuality" },
  { text: "Raise your words, not voice. It is rain that grows flowers, not thunder.", author: "Rumi", category: "Communication" },
  { text: "What you seek is seeking you.", author: "Rumi", category: "Destiny" },
  { text: "Be like melting snow — wash yourself of yourself.", author: "Rumi", category: "Humility" },
  { text: "In your light I learn how to love. In your beauty, how to make poems.", author: "Rumi", category: "Inspiration" },
  { text: "Sell your cleverness and buy bewilderment.", author: "Rumi", category: "Wonder" },

  // Contemporary Wisdom
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "Action" },
  { text: "A society grows great when old men plant trees whose shade they know they shall never sit in.", author: "Greek Proverb", category: "Legacy" },
  { text: "Fall seven times, rise eight.", author: "Japanese Proverb", category: "Resilience" },
  { text: "The nail that sticks out gets hammered down.", author: "Japanese Proverb", category: "Conformity" },
  { text: "Vision without action is merely a dream. Action without vision just passes the time. Vision with action can change the world.", author: "Joel A. Barker", category: "Vision" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb", category: "Teamwork" },
  { text: "When the roots of a tree begin to decay, it spreads death to the branches.", author: "Aeschylus", category: "Foundation" },
  { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius", category: "Character" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "Action" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius", category: "Present Moment" },

  // Final Wisdom Quotes
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "Humility" },
  { text: "An unexamined life is not worth living.", author: "Socrates", category: "Self-Examination" },
  { text: "The only good is knowledge and the only evil is ignorance.", author: "Socrates", category: "Knowledge" },
  { text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates", category: "Teaching" },
  { text: "Wonder is the beginning of wisdom.", author: "Socrates", category: "Wonder" },
  { text: "To find yourself, think for yourself.", author: "Socrates", category: "Self-Discovery" },
  { text: "The hour of departure has arrived, and we go our ways — I to die, and you to live. Which is better God only knows.", author: "Socrates", category: "Death" },
  { text: "There is only one good, knowledge, and one evil, ignorance.", author: "Socrates", category: "Good and Evil" },
  { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus", category: "Rebellion" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius", category: "Simplicity" },

  // Additional Wisdom to Reach 400 Quotes
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "Journey" },
  { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu", category: "Transformation" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "Patience" },
  { text: "He who knows others is wise; he who knows himself is enlightened.", author: "Lao Tzu", category: "Self-Knowledge" },
  { text: "At the center of your being you have the answer; you know who you are and you know what you want.", author: "Lao Tzu", category: "Inner Wisdom" },
  { text: "If you correct your mind, the rest of your life will fall into place.", author: "Lao Tzu", category: "Mindset" },
  { text: "New beginnings are often disguised as painful endings.", author: "Lao Tzu", category: "Change" },
  { text: "The wise find pleasure in water; the virtuous find pleasure in hills.", author: "Confucius", category: "Nature" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius", category: "Beauty" },
  { text: "The man who asks a question is a fool for five minutes; the man who does not ask a question remains a fool forever.", author: "Confucius", category: "Learning" },

  // More Modern Wisdom
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "Future" },
  { text: "Culture eats strategy for breakfast.", author: "Peter Drucker", category: "Culture" },
  { text: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker", category: "Leadership" },
  { text: "The most important thing in communication is hearing what isn't said.", author: "Peter Drucker", category: "Communication" },
  { text: "Knowledge has to be improved, challenged, and increased constantly, or it vanishes.", author: "Peter Drucker", category: "Knowledge" },
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker", category: "Effectiveness" },
  { text: "The purpose of a business is to create a customer.", author: "Peter Drucker", category: "Business" },
  { text: "Innovation is the specific instrument of entrepreneurship.", author: "Peter Drucker", category: "Innovation" },
  { text: "Time is the scarcest resource and unless it is managed nothing else can be managed.", author: "Peter Drucker", category: "Time Management" },
  { text: "Results are gained by exploiting opportunities, not by solving problems.", author: "Peter Drucker", category: "Opportunity" },

  // Spiritual and Philosophical Wisdom
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell", category: "Fear" },
  { text: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.", author: "Joseph Campbell", category: "Acceptance" },
  { text: "Find a place inside where there's joy, and the joy will burn out the pain.", author: "Joseph Campbell", category: "Joy" },
  { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung", category: "Authenticity" },
  { text: "Everything that irritates us about others can lead us to an understanding of ourselves.", author: "Carl Jung", category: "Self-Understanding" },
  { text: "Your vision becomes clear when you look into your heart. Who looks outside, dreams. Who looks inside, awakens.", author: "Carl Jung", category: "Vision" },
  { text: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.", author: "Carl Jung", category: "Relationships" },
  { text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung", category: "Choice" },
  { text: "The most terrifying thing is to accept oneself completely.", author: "Carl Jung", category: "Self-Acceptance" },
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung", category: "Consciousness" },

  // Scientific and Rational Wisdom
  { text: "Science is not only compatible with spirituality; it is a profound source of spirituality.", author: "Carl Sagan", category: "Science" },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan", category: "Discovery" },
  { text: "The cosmos is within us. We are made of star-stuff.", author: "Carl Sagan", category: "Universe" },
  { text: "Extraordinary claims require extraordinary evidence.", author: "Carl Sagan", category: "Evidence" },
  { text: "We are a way for the cosmos to know itself.", author: "Carl Sagan", category: "Consciousness" },
  { text: "The absence of evidence is not the evidence of absence.", author: "Carl Sagan", category: "Logic" },
  { text: "For small creatures such as we the vastness is bearable only through love.", author: "Carl Sagan", category: "Love" },
  { text: "If you wish to make an apple pie from scratch, you must first invent the universe.", author: "Carl Sagan", category: "Creation" },
  { text: "Books are proof that humans are capable of working magic.", author: "Carl Sagan", category: "Books" },
  { text: "The beauty of a living thing is not the atoms that go into it, but the way those atoms are put together.", author: "Carl Sagan", category: "Beauty" },

  // Wisdom from Various Cultures and Times
  { text: "A bird sitting on a tree is never afraid of the branch breaking, because her trust is not on the branch but on her own wings.", author: "Unknown", category: "Trust" },
  { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese Proverb", category: "Flexibility" },
  { text: "When the student is ready, the teacher appears.", author: "Buddhist Proverb", category: "Learning" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", category: "Dreams" },
  { text: "Integrity is doing the right thing, even when no one is watching.", author: "C.S. Lewis", category: "Integrity" },
  { text: "You can't go back and change the beginning, but you can start where you are and change the ending.", author: "C.S. Lewis", category: "Change" },
  { text: "We read to know we're not alone.", author: "C.S. Lewis", category: "Reading" },
  { text: "Courage, dear heart.", author: "C.S. Lewis", category: "Courage" },
  { text: "Some day you will be old enough to start reading fairy tales again.", author: "C.S. Lewis", category: "Wonder" },
  { text: "Friendship is born at that moment when one person says to another, 'What! You too? I thought I was the only one.'", author: "C.S. Lewis", category: "Friendship" },

  // Contemporary Wisdom
  { text: "Your limitation—it's only your imagination.", author: "Unknown", category: "Limitation" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", category: "Self-Motivation" },
  { text: "Great things never come from comfort zones.", author: "Unknown", category: "Growth" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown", category: "Action" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown", category: "Success" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown", category: "Achievement" },
  { text: "Dream bigger. Do bigger.", author: "Unknown", category: "Ambition" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown", category: "Perseverance" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown", category: "Daily Life" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown", category: "Future Self" },

  // Wisdom from Literature and Arts
  { text: "It is never too late to be what you might have been.", author: "George Eliot", category: "Potential" },
  { text: "What do we live for, if it is not to make life less difficult for each other?", author: "George Eliot", category: "Service" },
  { text: "It will never rain roses: when we want to have more roses, we must plant more roses.", author: "George Eliot", category: "Effort" },
  { text: "The strongest principle of growth lies in human choice.", author: "George Eliot", category: "Growth" },
  { text: "Adventure is not outside man; it is within.", author: "George Eliot", category: "Adventure" },
  { text: "Blessed is the influence of one true, loving human soul on another.", author: "George Eliot", category: "Influence" },
  { text: "Our deeds determine us, as much as we determine our deeds.", author: "George Eliot", category: "Actions" },
  { text: "It's never too late to be who you were meant to be.", author: "George Eliot", category: "Destiny" },
  { text: "The golden moments in the stream of life rush past us, and we see nothing but sand; the angels come to visit us, and we only know them when they are gone.", author: "George Eliot", category: "Awareness" },
  { text: "What makes life dreary is the want of motive.", author: "George Eliot", category: "Purpose" },

  // Final Wisdom Quotes to Complete 400
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "Self-Determination" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Inner Strength" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "Innovation" },
  { text: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.", author: "Ralph Waldo Emerson", category: "Purpose" },
  { text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson", category: "Enthusiasm" },
  { text: "A foolish consistency is the hobgoblin of little minds.", author: "Ralph Waldo Emerson", category: "Consistency" },
  { text: "The mind, once stretched by a new idea, never returns to its original dimensions.", author: "Ralph Waldo Emerson", category: "Growth" },
  { text: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson", category: "Optimism" },
  { text: "Peace cannot be achieved through violence, it can only be attained through understanding.", author: "Ralph Waldo Emerson", category: "Peace" },
  { text: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson", category: "Potential" },

  // Closing with Universal Wisdom
  { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr.", category: "Friendship" },
  { text: "Life's most persistent and urgent question is: 'What are you doing for others?'", author: "Martin Luther King Jr.", category: "Service" },
  { text: "The time is always right to do what is right.", author: "Martin Luther King Jr.", category: "Right Action" },
  { text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr.", category: "Hope" },
  { text: "Love is the only force capable of transforming an enemy into a friend.", author: "Martin Luther King Jr.", category: "Love" },
  { text: "The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.", author: "Martin Luther King Jr.", category: "Character" },
  { text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.", author: "Martin Luther King Jr.", category: "Progress" },
  { text: "Our lives begin to end the day we become silent about things that matter.", author: "Martin Luther King Jr.", category: "Speaking Up" },
  { text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr.", category: "Education" },
  { text: "We are not makers of history. We are made by history.", author: "Martin Luther King Jr.", category: "History" },

  // Final 40 Quotes to Complete 400
  { text: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr.", category: "Preparation" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Belief" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Hope" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll", category: "Attitude" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot", category: "Potential" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action" },
  { text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill", category: "Optimism" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers", category: "Present" },
  { text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown", category: "Failure" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", category: "Resilience" },
  { text: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs", category: "Vision" },
  { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen", category: "Change" },
  { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino", category: "Determination" },
  { text: "Entrepreneurs are great at dealing with uncertainty and also very good at minimizing risk. That's the classic entrepreneur.", author: "Mohnish Pabrai", category: "Entrepreneurship" },
  { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou", category: "Perseverance" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe", category: "Action" },
  { text: "Imagine your life is perfect in every respect; what would it look like?", author: "Brian Tracy", category: "Vision" },
  { text: "We generate fears while we sit. We overcome them by action.", author: "Dr. Henry Link", category: "Fear" },
  { text: "Whether you think you can or think you can't, you're right.", author: "Henry Ford", category: "Mindset" },
  { text: "Security is mostly a superstition. Life is either a daring adventure or nothing.", author: "Helen Keller", category: "Adventure" },
  { text: "The man who has confidence in himself gains the confidence of others.", author: "Hasidic Proverb", category: "Confidence" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "Doubt" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "Creativity" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Inner Strength" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou", category: "Life" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "Fear" },
  { text: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", author: "Plato", category: "Truth" },
  { text: "Believe that life is worth living and your belief will help create the fact.", author: "William James", category: "Belief" },
  { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown", category: "Dreams" },
  { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine", category: "Challenges" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", category: "Service" },
  { text: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci", category: "Action" },
  { text: "Limitations live only in our minds. But if we use our imaginations, our possibilities become limitless.", author: "Jamie Paolinetti", category: "Imagination" },
  { text: "You take your life in your own hands, and what happens? A terrible thing, no one to blame.", author: "Erica Jong", category: "Responsibility" },
  { text: "What's money? A man is a success if he gets up in the morning and goes to bed at night and in between does what he wants to do.", author: "Bob Dylan", category: "Success" },
  { text: "I didn't fail the test. I just found 100 ways to do it wrong.", author: "Benjamin Franklin", category: "Learning" },
  { text: "In order to succeed, your desire for success should be greater than your fear of failure.", author: "Bill Cosby", category: "Success" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", category: "Mistakes" }
];

export const getRandomWisdomQuote = (): WisdomQuote => {
  const randomIndex = Math.floor(Math.random() * wisdomQuotes.length);
  return wisdomQuotes[randomIndex];
};

export const getShuffledWisdomQuotes = (): WisdomQuote[] => {
  const shuffled = [...wisdomQuotes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getQuotesByCategory = (category: string): WisdomQuote[] => {
  return wisdomQuotes.filter(quote => quote.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = wisdomQuotes.map(quote => quote.category);
  return [...new Set(categories)].sort();
};
