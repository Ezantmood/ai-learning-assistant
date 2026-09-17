import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from './api';
import type { NoteFormValues } from './schemas';

export function notesKey(userId: string) {
  return ['notes', userId] as const;
}

export function noteKey(userId: string, noteId: string) {
  return ['notes', userId, noteId] as const;
}

export function useNotes(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => listNotes(userId as string),
    queryKey: userId ? notesKey(userId) : ['notes', 'anonymous'],
  });
}

export function useNote(userId: string | undefined, noteId: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getNote(userId as string, noteId),
    queryKey: userId ? noteKey(userId, noteId) : ['notes', 'anonymous', noteId],
  });
}

export function useCreateNote(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteFormValues) => createNote(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey(userId) });
    },
  });
}

export function useUpdateNote(userId: string, noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteFormValues) => updateNote(userId, noteId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey(userId) });
      void queryClient.invalidateQueries({
        queryKey: noteKey(userId, noteId),
      });
    },
  });
}

export function useDeleteNote(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(userId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey(userId) });
    },
  });
}
