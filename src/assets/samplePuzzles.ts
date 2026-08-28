export interface SamplePuzzle {
  id: string
  title: string
  imageSrc: string
  pieceCount: number
  description: string
  category: string
}

export const SAMPLE_PUZZLES: SamplePuzzle[] = [
  {
    id: 'sample-alpine-lake',
    title: 'Alpine Lake Sunrise',
    imageSrc:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 50,
    description: 'Golden morning light reflecting over a serene crystal alpine lake surrounded by pine forests.',
    category: 'Nature',
  },
  {
    id: 'sample-coral-reef',
    title: 'Great Barrier Reef',
    imageSrc:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Vibrant tropical marine life, sea turtles, and colorful corals beneath azure ocean waters.',
    category: 'Ocean',
  },
  {
    id: 'sample-misty-pines',
    title: 'Misty Pines at Dawn',
    imageSrc:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 100,
    description: 'Atmospheric deep emerald forest covered with morning fog and soft diffused sunbeams.',
    category: 'Forest',
  },
  {
    id: 'sample-clockwork',
    title: 'Antique Pocket Watch',
    imageSrc:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    pieceCount: 250,
    description: 'Intricate brass and copper mechanical gearwork of a vintage pocket watch mechanism.',
    category: 'Mechanical',
  },
]
