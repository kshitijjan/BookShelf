import { MarginNote, ReadingCircle } from '../types/book';

export const MARGIN_NOTES_DATA: MarginNote[] = [
  {
    id: 'note-1',
    readerName: 'Elena Rostova',
    readerHandle: '@erostova',
    readerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bookTitle: 'The Memory Police',
    bookAuthor: 'Yōko Ogawa',
    pageNumber: 142,
    passageSnippet: '"If you lose the memory of a perfume, does the flower still exist?"',
    noteText: 'Underlined this three times with my graphite pencil. It speaks so directly to how grief operates—not as sudden erasure, but as slow quiet fog settling over rooms you once knew by heart.',
    likes: 342,
    timestamp: '2 hours ago',
    isStaffPick: true
  },
  {
    id: 'note-2',
    readerName: 'Julian Vance',
    readerHandle: '@jvance_reads',
    readerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bookTitle: 'Exhalation',
    bookAuthor: 'Ted Chiang',
    pageNumber: 88,
    passageSnippet: '"The universe began as an enormous breath held, and is slowly exhaling."',
    noteText: 'The thermodynamic conceit of this story gave me goosebumps at midnight. It reconciles cold physics with cosmic gratitude.',
    likes: 519,
    timestamp: 'Yesterday',
    isStaffPick: true
  },
  {
    id: 'note-3',
    readerName: 'Mira Thorne',
    readerHandle: '@mirathorne',
    readerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bookTitle: 'Days at the Morisaki Bookshop',
    bookAuthor: 'Satoshi Yagisawa',
    pageNumber: 47,
    passageSnippet: '"In secondhand books, you read two lives: the author’s story, and the ghost of the previous reader."',
    noteText: 'Found a dried pressed ginkgo leaf tucked into my secondhand copy right here. I am leaving it for whoever borrows it next.',
    likes: 289,
    timestamp: '3 days ago'
  },
  {
    id: 'note-4',
    readerName: 'Devon K.',
    readerHandle: '@devon_k',
    readerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bookTitle: 'Piranesi',
    bookAuthor: 'Susanna Clarke',
    pageNumber: 210,
    passageSnippet: '"The Beauty of the House is immeasurable; its Kindness infinite."',
    noteText: 'Piranesi’s radical kindness in the face of complete isolation is the most refreshing literary tonic of the 21st century.',
    likes: 412,
    timestamp: '4 days ago'
  }
];

export const READING_CIRCLES_DATA: ReadingCircle[] = [
  {
    id: 'circle-1',
    name: 'Midnight Speculative Guild',
    currentBook: 'Exhalation',
    author: 'Ted Chiang',
    membersCount: 840,
    meetingDate: 'Thursday, 8:00 PM EST',
    topic: 'Free Will, Entropy, and the Prism of Consciousness',
    coverGradient: 'from-[#1e2738] to-[#121620]'
  },
  {
    id: 'circle-2',
    name: 'Tokyo Coffee & Quiet Prose',
    currentBook: 'Days at the Morisaki Bookshop',
    author: 'Satoshi Yagisawa',
    membersCount: 1220,
    meetingDate: 'Sunday, 10:00 AM JST',
    topic: 'Secondhand Book Culture and Healing in Jimbocho',
    coverGradient: 'from-[#4d3324] to-[#26180f]'
  },
  {
    id: 'circle-3',
    name: 'The Gothic Bibliotheca',
    currentBook: 'The Shadow of the Wind',
    author: 'Carlos Ruiz Zafón',
    membersCount: 960,
    meetingDate: 'Saturday, 7:00 PM CET',
    topic: 'Cemetery of Forgotten Books: Literature as Salvation',
    coverGradient: 'from-[#2e1d3d] to-[#160d1f]'
  }
];
