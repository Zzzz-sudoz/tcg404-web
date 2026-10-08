export const games = [
  {
    id: 'pokemon',
    name: 'Pokémon',
    subtitle: 'From first partners to full arts.',
    index: '01',
    image: '/cards/mew.png',
  },
  {
    id: 'one-piece',
    name: 'One Piece',
    subtitle: 'Build your crew. Find your grail.',
    index: '02',
    image: '/cards/luffy.png',
  },
  {
    id: 'magic',
    name: 'Magic: The Gathering',
    subtitle: 'A new addition to your next deck.',
    index: '03',
    image: '/cards/black-lotus.jpg',
  },
]
export function formatPrice(price) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}
