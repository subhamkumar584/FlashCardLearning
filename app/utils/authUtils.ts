import { User } from 'firebase/auth';

export interface AuthUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  tags?: string[];
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  completed: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  reviewCount?: number;
  lastReviewed?: Date;
}

export interface UserStats {
  totalCards: number;
  completedCards: number;
  studyStreak: number;
  totalStudyTime: number;
  lastStudyDate: Date;
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const calculateProgress = (completed: number, total: number): number => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};