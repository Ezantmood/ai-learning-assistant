import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Banner, Button, Text } from 'react-native-paper';

import { AppScreen } from '../../../src/components/AppScreen';
import { FormTextField } from '../../../src/components/FormTextField';
import { useSession } from '../../../src/features/auth/useSession';
import { toNotesErrorMessage } from '../../../src/features/notes/errors';
import { useCreateNote } from '../../../src/features/notes/queries';
import {
  noteSchema,
  type NoteFormValues,
} from '../../../src/features/notes/schemas';

export default function NewNoteScreen() {
  const { user } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<NoteFormValues>({
    defaultValues: { content: '', title: '' },
  });

  const mutation = useCreateNote(user?.id ?? '');

  const onSubmit = (values: NoteFormValues) => {
    const parsed = noteSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'title' || field === 'content') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (user && !mutation.isPending) {
      mutation.mutate(parsed.data, {
        onError: (error: unknown) => {
          // Giữ nguyên nội dung form để thử lại khi lỗi mạng.
          setApiError(toNotesErrorMessage(error));
        },
        onSuccess: () => {
          router.back();
        },
      });
    }
  };

  return (
    <AppScreen>
      <Text variant="headlineSmall">Ghi chú mới</Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <FormTextField
            fieldError={fieldState.error?.message}
            label="Tiêu đề"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="content"
        render={({ field, fieldState }) => (
          <FormTextField
            fieldError={fieldState.error?.message}
            label="Nội dung"
            multiline
            numberOfLines={6}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Lưu ghi chú"
        accessibilityRole="button"
        disabled={mutation.isPending}
        loading={mutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
      >
        Lưu
      </Button>
    </AppScreen>
  );
}
