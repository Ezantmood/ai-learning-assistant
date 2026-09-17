import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  Banner,
  Button,
  Dialog,
  Portal,
  Text,
} from 'react-native-paper';

import { AppScreen } from '../../../src/components/AppScreen';
import { FormTextField } from '../../../src/components/FormTextField';
import { FullScreenStatus } from '../../../src/components/FullScreenStatus';
import { useSession } from '../../../src/features/auth/useSession';
import { toNotesErrorMessage } from '../../../src/features/notes/errors';
import {
  useDeleteNote,
  useNote,
  useUpdateNote,
} from '../../../src/features/notes/queries';
import {
  noteSchema,
  type NoteFormValues,
} from '../../../src/features/notes/schemas';
import { spacing } from '../../../src/lib/theme';
import type { StudyNoteRow } from '../../../src/types/database';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const noteQuery = useNote(user?.id, id);

  if (noteQuery.isPending) {
    return <FullScreenStatus message="Đang tải ghi chú…" />;
  }

  if (noteQuery.isError || !noteQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>
          {toNotesErrorMessage(noteQuery.error)}
        </Text>
        <Button
          accessibilityLabel="Quay lại danh sách"
          accessibilityRole="button"
          mode="contained"
          onPress={() => router.back()}
        >
          Quay lại
        </Button>
      </View>
    );
  }

  return <NoteEditor key={noteQuery.data.id} note={noteQuery.data} />;
}

function NoteEditor({ note }: { note: StudyNoteRow }) {
  const { user } = useSession();
  const userId = user?.id ?? '';
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { control, handleSubmit, setError } = useForm<NoteFormValues>({
    defaultValues: { content: note.content, title: note.title },
  });

  const updateMutation = useUpdateNote(userId, note.id);
  const deleteMutation = useDeleteNote(userId);

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

    if (!updateMutation.isPending) {
      updateMutation.mutate(parsed.data, {
        onError: (error: unknown) => {
          setApiError(toNotesErrorMessage(error));
        },
        onSuccess: () => {
          router.back();
        },
      });
    }
  };

  const onConfirmDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }
    deleteMutation.mutate(note.id, {
      onError: (error: unknown) => {
        setConfirmDelete(false);
        setApiError(toNotesErrorMessage(error));
      },
      onSuccess: () => {
        setConfirmDelete(false);
        router.back();
      },
    });
  };

  return (
    <AppScreen>
      <Text variant="headlineSmall">Sửa ghi chú</Text>

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
        accessibilityLabel="Lưu thay đổi"
        accessibilityRole="button"
        disabled={updateMutation.isPending}
        loading={updateMutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
      >
        Lưu thay đổi
      </Button>

      <Button
        accessibilityLabel="Xóa ghi chú"
        accessibilityRole="button"
        disabled={deleteMutation.isPending}
        mode="outlined"
        onPress={() => setConfirmDelete(true)}
        textColor="#B3261E"
      >
        Xóa ghi chú
      </Button>

      <Portal>
        <Dialog
          onDismiss={() => setConfirmDelete(false)}
          visible={confirmDelete}
        >
          <Dialog.Title>Xóa ghi chú?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Ghi chú “{note.title}” sẽ bị xóa khỏi tài khoản của bạn.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              accessibilityLabel="Hủy xóa"
              accessibilityRole="button"
              onPress={() => setConfirmDelete(false)}
            >
              Hủy
            </Button>
            <Button
              accessibilityLabel="Xác nhận xóa ghi chú"
              accessibilityRole="button"
              loading={deleteMutation.isPending}
              onPress={onConfirmDelete}
            >
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centerText: {
    textAlign: 'center',
  },
});
