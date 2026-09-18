import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { createAvatarSignedUrl, getProfile, updateProfile, uploadAvatar } from './api';
import { AVATAR_URL_STALE_MS } from './avatar';
import type { ProfileFormValues } from './schemas';

export function profileKey(userId: string) {
  return ['profile', userId] as const;
}

export function avatarUrlKey(userId: string, path: string) {
  return ['avatar-url', userId, path] as const;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getProfile(userId as string),
    queryKey: userId ? profileKey(userId) : ['profile', 'anonymous'],
  });
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProfileFormValues) => updateProfile(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKey(userId) });
    },
  });
}

/**
 * Signed URL avatar, cache ngắn hơn TTL 3600s.
 * Không lưu URL vào DB hay state persist; fail thì UI dùng fallback.
 */
export function useAvatarUrl(
  userId: string | undefined,
  path: string | null | undefined,
) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(path),
    queryFn: () => createAvatarSignedUrl(path as string),
    queryKey:
      userId && path
        ? avatarUrlKey(userId, path)
        : ['avatar-url', 'anonymous'],
    staleTime: AVATAR_URL_STALE_MS,
  });
}

export function useUploadAvatar(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { base64: string; previousPath: string | null }) =>
      uploadAvatar({ ...input, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKey(userId) });
    },
  });
}
