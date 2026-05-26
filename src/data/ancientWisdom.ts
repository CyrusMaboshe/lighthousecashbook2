
const ancientWisdom = [
  // Dark Ancient Wisdom - Power & Control
  "The strong do what they can, the weak suffer what they must - Thucydides",
  "It is better to be feared than loved, if you cannot be both - Machiavelli",
  "Power is not revealed by striking hard or often, but by striking true - Balzac",
  "The greatest enemy will hide in the last place you would ever look - Caesar",
  "Trust no one completely, not even yourself - Ancient Proverb",
  "In the kingdom of the blind, the one-eyed man is king - Erasmus",
  "The blade that cuts deepest is the one you never see coming - Sun Tzu",
  "Silence is the ultimate weapon of power - de Gaulle",
  "Your enemies' mistakes are your greatest opportunities - Napoleon",
  "The wise man learns more from his enemies than the fool from his friends - Marcus Aurelius",
  
  // Dark Truths About Human Nature
  "Every man has his price, the only question is whether you can afford it - Unknown",
  "Scratch a cynic and you'll find a disappointed idealist - George Carlin",
  "Man is the only animal that deals in that atrocity of atrocities: War - Mark Twain",
  "The road to hell is paved with good intentions - Saint Bernard",
  "Hell is other people - Jean-Paul Sartre",
  "We are all in the gutter, but some of us are looking at the stars - Oscar Wilde",
  "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion - Camus",
  "In a time of deceit, telling the truth is a revolutionary act - Orwell",
  "The masses have never thirsted after truth - Gustave Le Bon",
  "Most people would rather die than think; in fact, they do so - Bertrand Russell",
  
  // Harsh Realities of Success
  "Success is going from failure to failure without losing your enthusiasm - Churchill",
  "The price of greatness is responsibility - Churchill",
  "If you want to make enemies, try to change something - Woodrow Wilson",
  "The successful warrior is the average man with laser-like focus - Bruce Lee",
  "Opportunity is missed by most people because it is dressed in overalls and looks like work - Edison",
  "The cave you fear to enter holds the treasure you seek - Campbell",
  "What doesn't kill you makes you stronger, but what almost kills you makes you a warrior - Nietzsche",
  "The master has failed more times than the beginner has even tried - Stephen McCranie",
  "Pain is temporary, quitting lasts forever - Lance Armstrong",
  "Champions don't become champions in the ring, they become champions in their training - Muhammad Ali",
  
  // Dark Philosophy & Existentialism
  "God is dead, and we have killed him - Nietzsche",
  "The abyss gazes also into you - Nietzsche",
  "Life is suffering - Buddha",
  "We suffer more in imagination than in reality - Seneca",
  "The only serious philosophical problem is suicide - Camus",
  "Man is condemned to be free - Sartre",
  "The mass of men lead lives of quiet desperation - Thoreau",
  "In the depth of winter, I finally learned that there was in me an invincible summer - Camus",
  "The unexamined life is not worth living - Socrates",
  "Everything we hear is an opinion, not a fact. Everything we see is perspective, not truth - Marcus Aurelius",
  
  // Brutal Wisdom About Life
  "Life is a sexually transmitted disease and the mortality rate is one hundred percent - R.D. Laing",
  "We're born alone, we live alone, we die alone - Hunter S. Thompson",
  "The only certainties in life are death and taxes - Benjamin Franklin",
  "Life is what happens while you're making other plans - John Lennon",
  "The graveyards are full of indispensable men - Charles de Gaulle",
  "We are here on Earth to do good for others. What the others are here for, I don't know - W.H. Auden",
  "Man is born free, and everywhere he is in chains - Rousseau",
  "The world is a stage, but the play is badly cast - Oscar Wilde",
  "Reality is that which, when you stop believing in it, doesn't go away - Philip K. Dick",
  "The truth will set you free, but first it will piss you off - Gloria Steinem",
  
  // War & Conflict Wisdom
  "All warfare is based on deception - Sun Tzu",
  "If you know the enemy and know yourself, you need not fear the result of a hundred battles - Sun Tzu",
  "The supreme art of war is to subdue the enemy without fighting - Sun Tzu",
  "War is the continuation of politics by other means - Clausewitz",
  "In war, truth is the first casualty - Aeschylus",
  "The best defense is a good offense - Vince Lombardi",
  "Keep your friends close, but your enemies closer - Sun Tzu",
  "He who fights monsters should be careful lest he thereby become a monster - Nietzsche",
  "The warrior and the artist live by the same code of necessity, which dictates that the battle must be fought anew every day - Steven Pressfield",
  "Victory belongs to the most persevering - Napoleon",
  
  // Money & Power
  "Money is the root of all evil - Biblical",
  "Power corrupts, absolute power corrupts absolutely - Lord Acton",
  "The love of money is the root of all kinds of evil - 1 Timothy 6:10",
  "He who has the gold makes the rules - Ancient Proverb",
  "Time is money - Benjamin Franklin",
  "Money talks, but wealth whispers - Unknown",
  "The rich get richer, the poor get poorer - Percy Bysshe Shelley",
  "Behind every great fortune lies a great crime - Balzac",
  "It's not about the money, it's about the power - Unknown",
  "Greed is good - Gordon Gekko",
  
  // Betrayal & Trust
  "Et tu, Brute? - Shakespeare",
  "The saddest thing about betrayal is that it never comes from your enemies - Unknown",
  "Trust takes years to build, seconds to break, and forever to repair - Unknown",
  "Betrayal is the only truth that sticks - Arthur Miller",
  "The knife in the back is better than the smile to the face - Unknown",
  "Everyone is capable of betrayal, given the right circumstances - Unknown",
  "Blood is thicker than water, but money is thicker than blood - Unknown",
  "Never trust a man who doesn't trust you - Unknown",
  "Loyalty is earned, not given - Unknown",
  "The most dangerous person is the one who listens, thinks and observes - Bruce Lee",
  
  // Death & Mortality
  "Death is not the greatest loss in life. The greatest loss is what dies inside us while we live - Norman Cousins",
  "To die will be an awfully big adventure - J.M. Barrie",
  "Death smiles at us all, but all a man can do is smile back - Marcus Aurelius",
  "The fear of death follows from the fear of life - Mark Twain",
  "Death is nothing, but to live defeated and inglorious is to die daily - Napoleon",
  "We all die. The goal isn't to live forever, the goal is to create something that will - Chuck Palahniuk",
  "Death is the solution to all problems. No man - no problem - Stalin",
  "In the end, we will remember not the words of our enemies, but the silence of our friends - MLK",
  "Life is pleasant. Death is peaceful. It's the transition that's troublesome - Isaac Asimov",
  "Death is not extinguishing the light; it is only putting out the lamp because the dawn has come - Rabindranath Tagore",
  
  // Loneliness & Isolation
  "The eternal quest of the individual human being is to shatter his loneliness - Norman Cousins",
  "We're all islands shouting lies to each other across seas of misunderstanding - Rudyard Kipling",
  "The greatest thing in the world is to know how to belong to oneself - Montaigne",
  "Loneliness is the human condition - Eugene O'Neill",
  "Hell is yourself and the only redemption is when a person puts himself aside to feel deeply for another person - Tennessee Williams",
  "The lonely become either thoughtful or empty - Mason Cooley",
  "We live as we dream - alone - Joseph Conrad",
  "Solitude is fine but you need someone to tell that solitude is fine - Honoré de Balzac",
  "The worst loneliness is to not be comfortable with yourself - Mark Twain",
  "Being alone never felt right. Sometimes it felt good, but it never felt right - Charles Bukowski",
  
  // Madness & Sanity
  "Insanity: doing the same thing over and over again and expecting different results - Einstein",
  "The only difference between genius and insanity is success - Unknown",
  "We're all mad here - Lewis Carroll",
  "Sanity is a madness put to good uses - George Santayana",
  "Show me a sane man and I will cure him for you - Carl Jung",
  "The edge... there is no honest way to explain it because the only people who really know where it is are the ones who have gone over - Hunter S. Thompson",
  "One person's craziness is another person's reality - Tim Burton",
  "I have not failed. I've just found 10,000 ways that won't work - Edison",
  "The definition of insanity is doing the same thing over and over and expecting different results - Rita Mae Brown",
  "Normal is an illusion. What is normal for the spider is chaos for the fly - Morticia Addams",
  
  // Deception & Lies
  "The truth is rarely pure and never simple - Oscar Wilde",
  "A lie can travel half way around the world while the truth is putting on its shoes - Mark Twain",
  "If you tell the truth, you don't have to remember anything - Mark Twain",
  "The best lies contain enough truth to be believable - Unknown",
  "We live in a fantasy world, a world of illusion. The great task in life is to find reality - Iris Murdoch",
  "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge - Stephen Hawking",
  "People will believe a big lie sooner than a little one - Adolf Hitler",
  "The most dangerous lies are truths slightly distorted - Georg Christoph Lichtenberg",
  "Truth is stranger than fiction, but it is because Fiction is obliged to stick to possibilities; Truth isn't - Mark Twain",
  "Everyone thinks of changing the world, but no one thinks of changing himself - Tolstoy",
  
  // Survival & Adaptation
  "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change - Darwin",
  "Adapt or perish - H.G. Wells",
  "The fittest survive. What is meant by the fittest? Not the strongest; not the cleverest - Wealth of Nations",
  "In the struggle for survival, the fittest win out at the expense of their rivals - Darwin",
  "Survival is not about being fearless. It's about making a decision, getting on and doing it - Bear Grylls",
  "The art of living is more like wrestling than dancing - Marcus Aurelius",
  "Life is like a game of poker; you have to know when to hold and when to fold - Unknown",
  "The secret of survival is to embrace change and to adapt. Times change. Technology changes. Habits change. You must change too - Unknown",
  "Survival can be summed up in three words - never give up - Bear Grylls",
  "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty - Churchill",
  
  // Ancient Battle Wisdom
  "Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win - Sun Tzu",
  "He who is prudent and lies in wait for an enemy who is not, will be victorious - Sun Tzu",
  "The clever combatant looks to the effect of combined energy, and does not require too much from individuals - Sun Tzu",
  "Rapidity is the essence of war - Sun Tzu",
  "All men can see these tactics whereby I conquer, but what none can see is the strategy out of which victory is evolved - Sun Tzu",
  "The highest form of warfare is to attack plans - Sun Tzu",
  "Know yourself and you will win all battles - Sun Tzu",
  "Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt - Sun Tzu",
  "The whole secret lies in confusing the enemy, so that he cannot fathom our real intent - Sun Tzu",
  "Attack where they are unprepared, appear where you are not expected - Sun Tzu",
  
  // Dark Leadership
  "A leader is a dealer in hope - Napoleon",
  "Leadership is the art of getting someone else to do something you want done - Eisenhower",
  "The way to get started is to quit talking and begin doing - Walt Disney",
  "If your actions inspire others to dream more, learn more, do more and become more, you are a leader - John Quincy Adams",
  "The challenge of leadership is to be strong, but not rude; be kind, but not weak - Jim Rohn",
  "A genuine leader is not a searcher for consensus but a molder of consensus - MLK",
  "Leadership is not about being in charge. It is about taking care of those in your charge - Simon Sinek",
  "The art of leadership is saying no, not saying yes - Tony Blair",
  "Leadership is the capacity to translate vision into reality - Warren Bennis",
  "A leader takes people where they want to go. A great leader takes people where they don't necessarily want to go, but ought to be - Rosalynn Carter",
  
  // Corruption & Greed
  "Power tends to corrupt, and absolute power corrupts absolutely - Lord Acton",
  "The corruption of the best things gives rise to the worst - David Hume",
  "Corruption is authority plus monopoly minus transparency - Unknown",
  "When you see corruption being rewarded and honesty becoming a self-sacrifice, you may know that your society is doomed - Ayn Rand",
  "The accomplice to the crime of corruption is frequently our own indifference - Bess Myerson",
  "Corruption is worse than prostitution. The latter might endanger the morals of an individual, the former invariably endangers the morals of the entire country - Karl Kraus",
  "Greed is a bottomless pit which exhausts the person in an endless effort to satisfy the need without ever reaching satisfaction - Erich Fromm",
  "The avarice of mankind is insatiable - Aristotle",
  "Greed has taken the whole universe, and nobody is worried about their soul - Little Richard",
  "There is enough in the world for everyone's need, but not enough for everyone's greed - Gandhi",
  
  // Vengeance & Justice
  "Revenge is a dish best served cold - The Godfather",
  "Before you embark on a journey of revenge, dig two graves - Confucius",
  "An eye for an eye makes the whole world blind - Gandhi",
  "The best revenge is massive success - Frank Sinatra",
  "Living well is the best revenge - George Herbert",
  "Revenge is sweet and not fattening - Alfred Hitchcock",
  "Don't get mad, get even - Joseph P. Kennedy",
  "Justice delayed is justice denied - William E. Gladstone",
  "Injustice anywhere is a threat to justice everywhere - MLK",
  "The arc of the moral universe is long, but it bends toward justice - Theodore Parker",
  
  // Ancient Stoic Darkness
  "You have power over your mind - not outside events. Realize this, and you will find strength - Marcus Aurelius",
  "The happiness of your life depends upon the quality of your thoughts - Marcus Aurelius",
  "Waste no more time arguing what a good man should be. Be one - Marcus Aurelius",
  "Very little is needed to make a happy life; it is all within yourself, in your way of thinking - Marcus Aurelius",
  "Accept the things to which fate binds you, and love the people with whom fate associates you - Marcus Aurelius",
  "The best revenge is not to be like your enemy - Marcus Aurelius",
  "How much trouble he avoids who does not look to see what his neighbor says or does - Marcus Aurelius",
  "You are an actor in a play, which is as the author wants it to be - Epictetus",
  "It's not what happens to you, but how you react to it that matters - Epictetus",
  "No one can hurt you without your permission - Eleanor Roosevelt",
  
  // Existential Dread
  "The universe is not only stranger than we imagine, it is stranger than we can imagine - J.B.S. Haldane",
  "In the face of the universe, we are all insects - Unknown",
  "We are nothing more than a speck of dust in an infinite cosmos - Carl Sagan",
  "The silence of infinite space terrifies me - Pascal",
  "Man is a useless passion - Sartre",
  "Life has no meaning the moment you lose the illusion of being eternal - Sartre",
  "The purpose of life is to live it, to taste experience to the utmost - Eleanor Roosevelt",
  "Life is a series of natural and spontaneous changes - Lao Tzu",
  "In three words I can sum up everything I've learned about life: it goes on - Robert Frost",
  "Life is really simple, but we insist on making it complicated - Confucius"
];

// Add more categories to reach massive numbers
const moreAncientWisdom = [
  // Dark Medieval Wisdom
  "All glory is fleeting - Ancient Roman saying",
  "The sword decides everything - Medieval proverb",
  "Fear the man who has nothing to lose - Unknown",
  "In times of war, the law falls silent - Cicero",
  "Veni, vidi, vici - I came, I saw, I conquered - Caesar",
  "Divide and conquer - Ancient strategy",
  "History is written by the victors - Winston Churchill",
  "The dead cannot cry out for justice - Aeschylus",
  "Blood calls for blood - Ancient law",
  "The crown is heavy - Medieval saying",
  
  // Psychology of Evil
  "The banality of evil - Hannah Arendt",
  "Evil is unspectacular and always human - W.H. Auden",
  "The only thing necessary for the triumph of evil is for good men to do nothing - Edmund Burke",
  "Man is wolf to man - Plautus",
  "The heart is desperately wicked - Jeremiah 17:9",
  "We are each our own devil, and we make this world our hell - Oscar Wilde",
  "The devil's finest trick is to persuade you that he does not exist - Charles Baudelaire",
  "Hell is empty and all the devils are here - Shakespeare",
  "Evil spelled backwards is live - Unknown",
  "The road to evil is paved with good intentions - Unknown",
  
  // Dark Economics & Society
  "There's no such thing as a free lunch - Milton Friedman",
  "Competition is the law of the jungle - Unknown",
  "Only the paranoid survive - Andy Grove",
  "Business is war - Unknown",
  "Time is the scarcest resource - Peter Drucker",
  "Information is power - Francis Bacon",
  "Knowledge is power, but power corrupts - Unknown",
  "Money is the sinews of war - Cicero",
  "War is the health of the state - Randolph Bourne",
  "Government is not reason, it is force - George Washington",
  
  // Ancient Chinese Darkness
  "The wise find pleasure in water; the virtuous find pleasure in hills - Confucius",
  "If you would govern a state of a thousand chariots, you must pay strict attention to business - Confucius",
  "The man who moves a mountain begins by carrying away small stones - Confucius",
  "It does not matter how slowly you go as long as you do not stop - Confucius",
  "Choose a job you love, and you will never have to work a day in your life - Confucius",
  "The superior man understands what is right; the inferior man understands what will sell - Confucius",
  "When we see men of worth, we should think of equaling them - Confucius",
  "The cautious seldom err - Confucius",
  "Study the past if you would define the future - Confucius",
  "Real knowledge is to know the extent of one's ignorance - Confucius",
  
  // Japanese Bushido Darkness
  "The way of the samurai is in desperateness - Yamamoto Tsunetomo",
  "If you meet the Buddha on the road, kill him - Zen saying",
  "Death before dishonor - Bushido code",
  "The sword is the soul of the samurai - Japanese proverb",
  "Fall seven times, rise eight - Japanese proverb",
  "Even monkeys fall from trees - Japanese proverb",
  "The nail that sticks out gets hammered down - Japanese proverb",
  "After victory, tighten your helmet cord - Japanese proverb",
  "When the character of a man is not clear to you, look at his friends - Japanese proverb",
  "Vision without action is a daydream. Action without vision is a nightmare - Japanese proverb",
  
  // Norse/Viking Darkness
  "Cattle die, kinsmen die, you yourself will also die, but the reputation never dies of one who has earned a good name - Hávamál",
  "Better to fight and fall than to live without hope - Volsunga Saga",
  "Fear not death, for the hour of your doom is set and none may escape it - Volsunga Saga",
  "A man should be loyal through life to friends - Hávamál",
  "The brave may not live forever, but the cautious do not live at all - Unknown",
  "Wisdom is welcome wherever it comes from - Scandinavian proverb",
  "Even the gods cannot change the past - Norse saying",
  "A coward believes he will live forever if he avoids his foes - Hávamál",
  "Where wolf's ears are, wolf's teeth are near - Volsunga Saga",
  "Trust not him whose father you have slain - Norse proverb",
  
  // Celtic/Druid Darkness
  "Three things give hardy strength: sleeping on the ground, breathing fresh air, and eating plain food - Celtic wisdom",
  "The three most beautiful sights: a potato garden in bloom, a ship in sail, a woman after the birth of her child - Irish saying",
  "Better the certainty of death than the hope of life - Celtic saying",
  "A man's best fortune, or his worst, is his wife - Irish proverb",
  "The older the fiddle, the sweeter the tune - Irish proverb",
  "What's done cannot be undone - Celtic wisdom",
  "The door of wisdom is never shut - Celtic saying",
  "A silent mouth is melodious - Irish proverb",
  "The river is deepest where it makes the least noise - Celtic wisdom",
  "Three things that come without seeking: fear, jealousy, and love - Celtic triad",
  
  // Egyptian/Mesopotamian Darkness
  "Death is but a doorway to the afterlife - Egyptian belief",
  "The gods help those who help themselves - Ancient Egyptian",
  "What you do not wish for yourself, do not do to others - Ancient Egyptian",
  "A man's heart is his own god - Egyptian wisdom",
  "The tongue of a wise man lies behind his heart - Egyptian proverb",
  "Better is bread with a happy heart than wealth with vexation - Egyptian wisdom",
  "Do not speak against anyone, great or small - Egyptian teaching",
  "The scribe who is skillful in his calling finds himself worthy to be a courtier - Egyptian wisdom",
  "Make your dwelling in the writing, put it in your heart - Egyptian teaching",
  "The wise man is he who learns from another's mistakes - Egyptian proverb",
  
  // Greek Philosophical Darkness
  "I know that I know nothing - Socrates",
  "The unexamined life is not worth living - Socrates",
  "There is only one good, knowledge, and one evil, ignorance - Socrates",
  "Wonder is the beginning of wisdom - Socrates",
  "He is richest who is content with the least - Socrates",
  "The only true wisdom is in knowing you know nothing - Socrates",
  "Beware the barrenness of a busy life - Socrates",
  "Education is the kindling of a flame, not the filling of a vessel - Socrates",
  "The secret of happiness, you see, is not found in seeking more, but in developing the capacity to enjoy less - Socrates",
  "Strong minds discuss ideas, average minds discuss events, weak minds discuss people - Socrates",
  
  // Roman Imperial Darkness
  "If you want peace, prepare for war - Vegetius",
  "Bread and circuses - Juvenal",
  "Beware of Greeks bearing gifts - Virgil",
  "Fortune favors the bold - Virgil",
  "Love conquers all - Virgil",
  "Time flies irretrievably - Virgil",
  "The greatest wealth is health - Virgil",
  "They can because they think they can - Virgil",
  "Mind moves matter - Virgil",
  "Each of us bears his own Hell - Virgil",
  
  // Biblical Darkness
  "For what shall it profit a man, if he shall gain the whole world, and lose his own soul? - Mark 8:36",
  "The love of money is the root of all evil - 1 Timothy 6:10",
  "Pride goes before destruction, and a haughty spirit before a fall - Proverbs 16:18",
  "There is a way that seems right to a man, but its end is the way to death - Proverbs 14:12",
  "All is vanity - Ecclesiastes",
  "To everything there is a season - Ecclesiastes 3:1",
  "Cast your bread upon the waters - Ecclesiastes 11:1",
  "Remember your Creator in the days of your youth - Ecclesiastes 12:1",
  "The fear of the Lord is the beginning of wisdom - Proverbs 9:10",
  "Trust in the Lord with all your heart - Proverbs 3:5",
  
  // Persian/Zoroastrian Darkness
  "Good thoughts, good words, good deeds - Zoroastrian motto",
  "The worst punishment is to be left alone with your thoughts - Persian saying",
  "A wound inflicted by a friend does not heal - Persian proverb",
  "When the cat is away, the mice will play - Persian origin",
  "The tree that would grow high must sink its roots deep - Persian wisdom",
  "Better a living dog than a dead lion - Persian saying",
  "If you are not part of the solution, you are part of the problem - Persian wisdom",
  "The enemy of my enemy is my friend - Persian strategy",
  "Paradise is at the feet of mothers - Persian saying",
  "A man becomes learned by asking questions - Persian proverb",
  
  // Indian/Hindu Darkness
  "The whole world is one family - Vasudhaiva Kutumbakam",
  "Truth alone triumphs - Satyameva Jayate",
  "Where there is dharma, there is victory - Yato dharmas tato jayah",
  "This too shall pass - Persian/Sanskrit origin",
  "The guest is god - Atithi Devo Bhava",
  "Knowledge is power - Vidya Shakti",
  "Work is worship - Karm hi puja hai",
  "The world is a bridge, pass over it but build no house upon it - Indian wisdom",
  "What we plant in the soil of contemplation, we shall reap in the harvest of action - Meister Eckhart",
  "The mind is everything; what you think you become - Buddha",
  
  // Buddhist Darkness
  "Life is suffering - Buddha",
  "All conditioned things are impermanent - Buddha",
  "Hatred does not cease by hatred, but only by love - Buddha",
  "The root of suffering is attachment - Buddha",
  "Peace comes from within. Do not seek it without - Buddha",
  "You yourself, as much as anybody in the entire universe, deserve your love and affection - Buddha",
  "The way is not in the sky. The way is in the heart - Buddha",
  "Better than a thousand hollow words, is one word that brings peace - Buddha",
  "If you truly loved yourself, you would never hurt another - Buddha",
  "In the end, these things matter most: How well did you love? How fully did you live? How deeply did you let go? - Buddha",
  
  // Sufi/Islamic Darkness
  "Die before you die - Sufi saying",
  "The truth was a mirror in the hands of God. It fell, and broke into pieces. Everybody took a piece of it - Rumi",
  "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself - Rumi",
  "The wound is the place where the Light enters you - Rumi",
  "Don't grieve. Anything you lose comes round in another form - Rumi",
  "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray - Rumi",
  "The quieter you become, the more you are able to hear - Rumi",
  "What you seek is seeking you - Rumi",
  "Out beyond ideas of wrongdoing and rightdoing there is a field. I'll meet you there - Rumi",
  "The lion who breaks the enemy's ranks is a minor hero compared to the lion who breaks his own anger - Rumi"
];

// Combine all collections
const allWisdom = [...ancientWisdom, ...moreAncientWisdom];

// Utility functions
export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * allWisdom.length);
  return allWisdom[randomIndex];
};

export const getShuffledQuotes = (): string[] => {
  const shuffled = [...allWisdom];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export { allWisdom as ancientWisdom };
