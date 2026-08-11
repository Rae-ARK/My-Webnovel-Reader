export interface Fiction {
  id: string
  title: string
  author: string
  cover: string | null
  synopsis: string
  status: 'ongoing' | 'completed' | 'hiatus'
  genres: string[]
  tags: string[]
}

export interface Chapter {
  id: string
  fictionId: string
  number: number
  title: string
  content: string
}

export interface FictionSummary extends Fiction {
  chapterCount: number
}
