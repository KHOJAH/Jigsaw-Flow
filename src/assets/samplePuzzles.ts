import { PuzzleCategory } from '../types/puzzle'

export interface SamplePuzzle {
  id: string
  title: string
  imageSrc: string
  pieceCount: number
  description: string
  category: string
  categoryKey?: PuzzleCategory
}

export const CATEGORY_FILTERS: { key: PuzzleCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All Collections', icon: 'grid_view' },
  { key: 'masterpieces', label: 'Fine Art & Masters', icon: 'palette' },
  { key: 'nature', label: 'Nature & Wildlife', icon: 'forest' },
  { key: 'cozy', label: 'Cozy & Landmarks', icon: 'cottage' },
  { key: 'abstract', label: 'Cosmic & Abstract', icon: 'blur_on' },
]

/**
 * Deterministically picks a daily puzzle based on date string (YYYY-MM-DD)
 */
export function getDailyPuzzleForDate(targetDate: Date = new Date()): {
  puzzle: SamplePuzzle
  dateStr: string
  formattedDate: string
  dayOfMonth: number
  dayName: string
  monthName: string
} {
  const y = targetDate.getFullYear()
  const m = String(targetDate.getMonth() + 1).padStart(2, '0')
  const d = String(targetDate.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  // Simple seed generator from date string
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed << 5) - seed + dateStr.charCodeAt(i)
    seed |= 0
  }
  const index = Math.abs(seed) % SAMPLE_PUZZLES.length
  const base = SAMPLE_PUZZLES[index]

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return {
    puzzle: {
      ...base,
      id: `daily-${dateStr}`,
      title: `${base.title} (Daily Challenge)`,
      pieceCount: 75, // balanced standard daily piece count
    },
    dateStr,
    formattedDate: `${monthNames[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()}`,
    dayOfMonth: targetDate.getDate(),
    dayName: dayNames[targetDate.getDay()],
    monthName: monthNames[targetDate.getMonth()],
  }
}

export const SAMPLE_PUZZLES: SamplePuzzle[] = [
  // =========================================================================
  // 1. FINE ART (11 Authentic Masterpieces from local collection)
  // =========================================================================
  {
    id: 'art-girl-red-hat',
    title: 'Girl with the Red Hat',
    imageSrc: './art/art4.jpg',
    pieceCount: 100,
    description: 'Johannes Vermeer (c. 1665–1666) — Masterpiece portrait featuring glowing light, blue robe, and vibrant feathered red hat.',
    category: 'Fine Art',
  },
  {
    id: 'art-the-concert',
    title: 'The Concert',
    imageSrc: './art/art3.jpg',
    pieceCount: 250,
    description: 'Gerard van Honthorst (1623) — Dutch Golden Age Caravaggisti oil painting of musicians singing and playing lutes around a table.',
    category: 'Fine Art',
  },
  {
    id: 'art-peasant-girl-knitting',
    title: 'A Peasant Girl Knitting',
    imageSrc: './art/art7.jpg',
    pieceCount: 50,
    description: 'Jules Breton (1861) — French Realist genre painting of a serene young woman in a red bonnet knitting beside a sewing box.',
    category: 'Fine Art',
  },
  {
    id: 'art-the-weaver',
    title: 'The Weaver at the Loom',
    imageSrc: './art/art8.jpg',
    pieceCount: 100,
    description: 'Nils Larsson (1906) — Atmospheric Swedish watercolor capturing morning sunlight illuminating a weaver working at a wooden loom.',
    category: 'Fine Art',
  },
  {
    id: 'art-horses-at-inn',
    title: 'Draft Horses at the Wayside Inn',
    imageSrc: './art/art9.jpg',
    pieceCount: 250,
    description: 'Wouterus Verschuur (c. 1850) — Renowned Dutch equestrian painting depicting heavy draft horses, riders, and dogs resting at a rustic tavern.',
    category: 'Fine Art',
  },
  {
    id: 'art-still-life-roses',
    title: 'Still Life with Roses & Strawberries',
    imageSrc: './art/art11.jpg',
    pieceCount: 150,
    description: '19th-century Master Still Life — Fragrant pink cabbage roses, ripe strawberries, golden cider in etched glass, and a Westerwald pewter jug.',
    category: 'Fine Art',
  },
  {
    id: 'art-tavern-dance',
    title: 'The Village Tavern Dance',
    imageSrc: './art/art6.jpg',
    pieceCount: 250,
    description: '19th-century European Genre Painting — Lively rural folk festival with musicians on violin and guitar accompanying joyful dancers.',
    category: 'Fine Art',
  },
  {
    id: 'art-mosque-minaret',
    title: 'Mosque Minaret & Portico',
    imageSrc: './art/art1.jpg',
    pieceCount: 50,
    description: '19th-century Orientalist Watercolor — Sunlit mosque courtyard featuring candy-striped twisted columns and a tall minaret tower.',
    category: 'Fine Art',
  },
  {
    id: 'art-mountain-pass',
    title: 'Mountain Pass at Gordale Scar',
    imageSrc: './art/art5.jpg',
    pieceCount: 100,
    description: 'British Romantic Watercolor — Dramatic limestone gorge and rocky crags with winding trail and golden autumn foliage.',
    category: 'Fine Art',
  },
  {
    id: 'art-lake-sunset',
    title: 'Twilight Sunset over the Mountain Lake',
    imageSrc: './art/art10.jpg',
    pieceCount: 50,
    description: 'Hudson River School (c. 1870) — Fiery crimson and orange sunset clouds reflected in a serene mountain lake with a distant sailboat.',
    category: 'Fine Art',
  },
  {
    id: 'art-lady-in-cathedral',
    title: 'Lady at Vespers in the Cathedral',
    imageSrc: './art/art2.jpg',
    pieceCount: 50,
    description: '19th-century Lithograph — Chiaroscuro tonal study of a Victorian lady in dark flowing gown standing in a sunlit cathedral aisle.',
    category: 'Fine Art',
  },

  // =========================================================================
  // 2. NATURE & LANDSCAPES (11 Breathtaking Views)
  // =========================================================================
  {
    id: 'nature-alpine-lake',
    title: 'Alpine Lake Sunrise',
    imageSrc: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Golden morning light reflecting over a serene crystal alpine lake surrounded by pine forests.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-misty-pines',
    title: 'Misty Pines at Dawn',
    imageSrc: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Atmospheric deep emerald forest covered with morning fog and soft diffused sunbeams.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-lavender-fields',
    title: 'Lavender Fields of Provence',
    imageSrc: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 150,
    description: 'Endless rows of blooming purple lavender under a warm French sunset sky.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-autumn-river',
    title: 'Autumn River in the Cascades',
    imageSrc: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Vibrant amber and scarlet maple foliage flanking a rushing mountain boulder stream.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-emerald-waterfalls',
    title: 'Emerald Valley Waterfalls',
    imageSrc: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Lush tropical canyon with twin tiered waterfalls cascading into crystal turquoise pools.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-fuji-sakura',
    title: 'Mount Fuji & Cherry Blossoms',
    imageSrc: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Snowcapped Mount Fuji framed by blooming pink cherry blossom branches over Lake Kawaguchiko.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-sossusvlei-dunes',
    title: 'Desert Dunes of Sossusvlei',
    imageSrc: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Towering rust-orange sculpted sand dunes casting deep graphic morning shadows in Namibia.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-northern-lights',
    title: 'Aurora Borealis over Lofoten',
    imageSrc: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Vivid emerald and magenta northern lights dancing across Arctic night skies above snowy fjords.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-swiss-meadow',
    title: 'Swiss Alps Wildflower Meadow',
    imageSrc: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Lush green mountain meadows blooming with alpine wildflowers beneath jagged granite peaks.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-monument-valley',
    title: 'Sunset at Monument Valley',
    imageSrc: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Iconic red sandstone buttes standing tall in the warm desert twilight.',
    category: 'Nature & Landscapes',
  },
  {
    id: 'nature-bamboo-forest',
    title: 'Arashiyama Bamboo Grove',
    imageSrc: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Soaring emerald stalks of bamboo swaying in the wind along a tranquil forest pathway in Kyoto.',
    category: 'Nature & Landscapes',
  },

  // =========================================================================
  // 3. WORLD ARCHITECTURE & CITIES (11 Iconic Landmarks)
  // =========================================================================
  {
    id: 'arch-santorini-domes',
    title: 'Santorini Blue Domes at Sunset',
    imageSrc: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Whitewashed cliffside villas and brilliant cobalt blue church domes overlooking the Aegean Sea.',
    category: 'World Architecture',
  },
  {
    id: 'arch-parthenon-athens',
    title: 'The Parthenon at Golden Hour',
    imageSrc: 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 150,
    description: 'Ancient classical Greek marble temple columns standing atop the Acropolis bathed in golden light.',
    category: 'World Architecture',
  },
  {
    id: 'arch-venice-canals',
    title: 'Venice Grand Canal Gondolas',
    imageSrc: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Traditional wooden gondolas moored along the historic Grand Canal in front of Santa Maria della Salute.',
    category: 'World Architecture',
  },
  {
    id: 'arch-kyoto-pagoda',
    title: 'Kyoto Yasaka Pagoda by Twilight',
    imageSrc: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Historic wooden five-story pagoda rising above lantern-lit cobblestone streets of Higashiyama.',
    category: 'World Architecture',
  },
  {
    id: 'arch-eiffel-tower',
    title: 'Eiffel Tower from the Seine',
    imageSrc: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Parisian autumn morning framing the iconic wrought-iron lattice tower across the river Seine.',
    category: 'World Architecture',
  },
  {
    id: 'arch-taj-mahal',
    title: 'Taj Mahal Reflection Pool',
    imageSrc: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Immense white marble mausoleum with symmetrical garden waterways glowing in the morning mist in Agra.',
    category: 'World Architecture',
  },
  {
    id: 'arch-neuschwanstein',
    title: 'Neuschwanstein Castle in Autumn',
    imageSrc: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Fairytale 19th-century Romanesque Revival castle perched above vibrant Bavarian alpine forests.',
    category: 'World Architecture',
  },
  {
    id: 'arch-golden-gate',
    title: 'Golden Gate Bridge in Ocean Fog',
    imageSrc: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'International orange suspension bridge towers rising through rolling Pacific marine fog.',
    category: 'World Architecture',
  },
  {
    id: 'arch-colosseum-rome',
    title: 'Colosseum of Rome at Dusk',
    imageSrc: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 150,
    description: 'Monumental ancient Roman stone amphitheater dramatically illuminated against deep blue twilight.',
    category: 'World Architecture',
  },
  {
    id: 'arch-prague-square',
    title: 'Prague Old Town Spires',
    imageSrc: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Gothic spires of Church of Our Lady before Týn overlooking the historic cobblestone market square.',
    category: 'World Architecture',
  },
  {
    id: 'arch-big-ben-london',
    title: 'Big Ben & Palace of Westminster',
    imageSrc: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'The great Elizabeth Tower clock and Neo-Gothic parliamentary facades reflecting across the Thames.',
    category: 'World Architecture',
  },

  // =========================================================================
  // 4. WILDLIFE & ANIMALS (11 Spectacular Fauna Portraits)
  // =========================================================================
  {
    id: 'wildlife-serengeti-lion',
    title: 'Majestic Lion of the Serengeti',
    imageSrc: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Proud male African lion with a dark golden mane resting in the warm savannah grasslands.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-sea-turtle',
    title: 'Great Barrier Reef Sea Turtle',
    imageSrc: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Graceful green sea turtle gliding through turquoise Pacific waters surrounded by colorful coral reefs.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-arctic-fox',
    title: 'Arctic Red Fox in Snow',
    imageSrc: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Vivid orange red fox hunting amidst pristine powder snowdrifts in the subarctic wilderness.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-scarlet-macaw',
    title: 'Scarlet Macaw in the Amazon',
    imageSrc: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Brilliant red, yellow, and blue plumage of an Amazonian macaw perched in deep rainforest foliage.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-bald-eagle',
    title: 'Bald Eagle in Flight',
    imageSrc: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 150,
    description: 'American bald eagle soaring with outstretched wings over coastal fjords in Alaska.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-humpback-breach',
    title: 'Humpback Whale Sunset Breach',
    imageSrc: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'A colossal humpback whale leaping completely out of ocean swells during a golden sunset.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-bengal-tiger',
    title: 'Bengal Tiger in the Mist',
    imageSrc: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Stealthy apex predator with striking striped coat stalking through morning bamboo mist.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-elephant-family',
    title: 'Elephant Herd at the Waterhole',
    imageSrc: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'African elephant matriarch and calf gathered together at an African watering hole at sunset.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-monarch-butterfly',
    title: 'Monarch on Wildflower',
    imageSrc: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Macro close-up portrait of delicate black-and-orange stained-glass patterned monarch butterfly wings.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-sea-otter',
    title: 'Sea Otter in Kelp Forest',
    imageSrc: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Playful California sea otter floating on its back wrapped in green sea kelp.',
    category: 'Wildlife & Animals',
  },
  {
    id: 'wildlife-snow-leopard',
    title: 'Snow Leopard on Mountain Ridge',
    imageSrc: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'The elusive ghost cat of the Himalayas surveying rocky snow-covered precipices.',
    category: 'Wildlife & Animals',
  },

  // =========================================================================
  // 5. SPACE & COSMIC WONDERS (11 Deep-Sky Astrophotography Portraits)
  // =========================================================================
  {
    id: 'space-carina-nebula',
    title: 'Carina Nebula Star Birth',
    imageSrc: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Turbulent cosmic mountains of glowing ionized gas and infant star clusters in the Carina Nebula.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-orion-nebula',
    title: 'Orion Nebula Stellar Cloud',
    imageSrc: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 150,
    description: 'Fluorescent cosmic clouds of hydrogen and helium gas glowing in vibrant violet and cyan hues.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-ring-nebula',
    title: 'Ring Nebula in Lyra',
    imageSrc: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Glowing rainbow shell of gas ejected by a dying central white dwarf star in deep space.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-earthrise',
    title: 'Earthrise from Lunar Orbit',
    imageSrc: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'The fragile blue marble of planet Earth rising majestically over the desolate craters of the Moon.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-andromeda-galaxy',
    title: 'Andromeda Galaxy Spiral',
    imageSrc: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Magnificent spiral arms containing over one trillion stars spinning in our neighboring galactic neighbor.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-pillars-creation',
    title: 'Pillars of Creation',
    imageSrc: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 500,
    description: 'Towering interstellar columns of dense molecular gas and dust in the Eagle Nebula creating new solar systems.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-solar-eclipse',
    title: 'Solar Eclipse Diamond Ring',
    imageSrc: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Radiant corona light burst creating the spectacular diamond ring effect during a total solar eclipse.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-saturn-rings',
    title: 'Saturn & Golden Rings',
    imageSrc: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Detailed view of the complex icy ring system and atmospheric bands of the giant ringed planet.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-deep-field',
    title: 'Deep Field Ancient Galaxies',
    imageSrc: 'https://images.unsplash.com/photo-1504333638930-c878015770f7?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Deepest infrared look into the early universe revealing thousands of gravitationally warped ancient galaxies.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-milky-way-arch',
    title: 'Milky Way over Desert Arch',
    imageSrc: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'The luminous galactic core of the Milky Way stretching across dark skies over a natural sandstone rock arch.',
    category: 'Space & Cosmic',
  },
  {
    id: 'space-crab-nebula',
    title: 'Crab Nebula Supernova Remnant',
    imageSrc: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Intricate filaments and expanding shockwaves from a historic supernova explosion recorded in 1054 AD.',
    category: 'Space & Cosmic',
  },
]
