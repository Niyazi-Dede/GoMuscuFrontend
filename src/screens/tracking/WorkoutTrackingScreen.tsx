import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainStackScreenProps } from '../../types';
import { workoutService } from '../../services/workout.service';
import { programService } from '../../services/program.service';
import { Program, Session } from '../../types';

type Props = MainStackScreenProps<'WorkoutTracking'>;

// ─── Local state types ────────────────────────────────────────────────────────

interface TrackedExercise {
  tempId: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  completed: boolean;
}

type Mode = 'program' | 'free';

let counter = 0;
function newId() {
  return `ex_${++counter}_${Date.now()}`;
}

function emptyExercise(name = ''): TrackedExercise {
  return { tempId: newId(), name, sets: '3', reps: '10', weight: '', completed: false };
}

// ─── Exercise card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: TrackedExercise;
  isFree: boolean;
  onChange: (updated: TrackedExercise) => void;
  onRemove: () => void;
}

function ExerciseCard({ exercise, isFree, onChange, onRemove }: ExerciseCardProps) {
  function update(fields: Partial<TrackedExercise>) {
    onChange({ ...exercise, ...fields });
  }

  return (
    <View style={[styles.exerciseCard, exercise.completed && styles.exerciseCardDone]}>
      {/* Top row: name + done toggle */}
      <View style={styles.exerciseCardHeader}>
        {isFree ? (
          <TextInput
            style={styles.exerciseNameInput}
            value={exercise.name}
            onChangeText={(v) => update({ name: v })}
            placeholder="Nom de l'exercice"
            placeholderTextColor={DarkColors.textSecondary}
          />
        ) : (
          <Text style={styles.exerciseNameLabel}>{exercise.name}</Text>
        )}
        <TouchableOpacity
          style={[styles.checkBox, exercise.completed && styles.checkBoxDone]}
          onPress={() => update({ completed: !exercise.completed })}
        >
          {exercise.completed && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Inputs row */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Séries</Text>
          <TextInput
            style={styles.numInput}
            value={exercise.sets}
            onChangeText={(v) => update({ sets: v })}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.numInput}
            value={exercise.reps}
            onChangeText={(v) => update({ reps: v })}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Poids (kg)</Text>
          <TextInput
            style={styles.numInput}
            value={exercise.weight}
            onChangeText={(v) => update({ weight: v })}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={DarkColors.textSecondary}
            selectTextOnFocus
          />
        </View>
        {isFree && (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color={DarkColors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WorkoutTrackingScreen({ navigation, route }: Props) {
  const { programId } = route.params ?? {};

  const [mode, setMode] = useState<Mode>(programId ? 'program' : 'free');
  const [exercises, setExercises] = useState<TrackedExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Program mode state
  const [program, setProgram] = useState<Program | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Load program when switching to program mode
  useEffect(() => {
    if (mode === 'program' && !program) {
      loadProgram();
    }
  }, [mode]);

  async function loadProgram() {
    setLoadingProgram(true);
    try {
      const res = await programService.list();
      const programs = res.data;
      if (programs.length > 0) {
        const sorted = [...programs].sort(
          (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        );
        setProgram(sorted[0]);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le programme.');
    } finally {
      setLoadingProgram(false);
    }
  }

  function selectSession(session: Session) {
    setSelectedSession(session);
    setExercises(
      session.exercises.map((ex) =>
        emptyExercise(ex.name)
      )
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function updateExercise(index: number, updated: TrackedExercise) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? updated : ex)));
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function handleFinish() {
    if (exercises.length === 0) {
      Alert.alert('Séance vide', 'Ajoutez au moins un exercice avant de terminer.');
      return;
    }

    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Exercices invalides', "Donnez un nom à chaque exercice.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        programId: program?.id,
        notes: notes.trim() || undefined,
        exercises: validExercises.map((ex) => ({
          exerciseId: ex.tempId,
          sets: parseInt(ex.sets) || 1,
          reps: ex.reps || '1',
          weight: ex.weight ? parseFloat(ex.weight) : undefined,
          notes: ex.name,
          completed: ex.completed,
        })),
      };

      const res = await workoutService.create(payload as any);
      const workout = res.data;

      if (timerRef.current) clearInterval(timerRef.current);

      navigation.replace('WorkoutDetail', { workoutId: workout.id });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Impossible de sauvegarder la séance. Réessayez.';
      Alert.alert('Erreur', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Program mode: session picker ─────────────────────────────────────────

  function renderSessionPicker() {
    if (loadingProgram) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={DarkColors.primary} />
          <Text style={styles.loadingText}>Chargement du programme…</Text>
        </View>
      );
    }

    if (!program) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun programme trouvé</Text>
          <Text style={styles.emptySubtitle}>
            Générez un programme IA pour utiliser ce mode.
          </Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => setMode('free')}
          >
            <Text style={styles.outlineButtonText}>Passer en mode libre</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Flatten all sessions across all weeks
    const allSessions = program.content.weeks.flatMap((week) =>
      week.sessions.map((session) => ({ ...session, weekNumber: week.weekNumber }))
    );

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Choisissez une séance :</Text>
        {allSessions.map((session, i) => (
          <TouchableOpacity
            key={i}
            style={styles.sessionPickCard}
            onPress={() => selectSession(session)}
            activeOpacity={0.75}
          >
            <View style={styles.sessionPickInfo}>
              <Text style={styles.sessionPickWeek}>Semaine {session.weekNumber}</Text>
              <Text style={styles.sessionPickDay}>{session.day}</Text>
              <Text style={styles.sessionPickFocus}>{session.focus}</Text>
            </View>
            <View style={styles.sessionPickRight}>
              <Text style={styles.sessionPickCount}>
                {session.exercises.length} exos
              </Text>
              <Ionicons name="chevron-forward" size={16} color={DarkColors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ─── Exercise list ─────────────────────────────────────────────────────────

  function renderExerciseList() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedSession && (
            <View style={styles.sessionBanner}>
              <Ionicons name="barbell-outline" size={14} color={DarkColors.primary} />
              <Text style={styles.sessionBannerText}>
                {selectedSession.day} · {selectedSession.focus}
              </Text>
              <TouchableOpacity onPress={() => { setSelectedSession(null); setExercises([]); }}>
                <Ionicons name="close-circle-outline" size={16} color={DarkColors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyExercisesText}>
                {mode === 'free'
                  ? "Appuyez sur « + Ajouter » pour commencer."
                  : "Sélectionnez une séance ci-dessus."}
              </Text>
            </View>
          ) : (
            exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.tempId}
                exercise={ex}
                isFree={mode === 'free'}
                onChange={(updated) => updateExercise(i, updated)}
                onRemove={() => removeExercise(i)}
              />
            ))
          )}

          {mode === 'free' && (
            <TouchableOpacity style={styles.addButton} onPress={addExercise}>
              <Ionicons name="add-circle-outline" size={20} color={DarkColors.primary} />
              <Text style={styles.addButtonText}>Ajouter un exercice</Text>
            </TouchableOpacity>
          )}

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ressenti, contexte, observations…"
            placeholderTextColor={DarkColors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.finishButton, isSubmitting && styles.finishButtonDisabled]}
            onPress={handleFinish}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.finishButtonText}>Terminer la séance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const showExerciseList = mode === 'free' || selectedSession !== null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle séance</Text>
        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={13} color={DarkColors.primary} />
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Mode tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'program' && styles.modeTabActive]}
          onPress={() => { setMode('program'); setSelectedSession(null); setExercises([]); }}
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={mode === 'program' ? DarkColors.primary : DarkColors.textSecondary}
          />
          <Text style={[styles.modeTabText, mode === 'program' && styles.modeTabTextActive]}>
            Programme
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'free' && styles.modeTabActive]}
          onPress={() => { setMode('free'); setSelectedSession(null); setExercises([]); }}
        >
          <Ionicons
            name="create-outline"
            size={14}
            color={mode === 'free' ? DarkColors.primary : DarkColors.textSecondary}
          />
          <Text style={[styles.modeTabText, mode === 'free' && styles.modeTabTextActive]}>
            Séance libre
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {mode === 'program' && !showExerciseList
        ? renderSessionPicker()
        : renderExerciseList()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: DarkColors.divider,
  },
  timerText: {
    color: DarkColors.primary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: DarkColors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: DarkColors.divider,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#2D1F4D',
  },
  modeTabText: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: DarkColors.primary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionLabel: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },

  // Session picker
  sessionPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    padding: 14,
    marginBottom: 10,
  },
  sessionPickInfo: { flex: 1, gap: 2 },
  sessionPickWeek: {
    color: DarkColors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sessionPickDay: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionPickFocus: {
    color: DarkColors.textSecondary,
    fontSize: 13,
  },
  sessionPickRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionPickCount: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },

  // Session banner
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1035',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: DarkColors.primary + '44',
  },
  sessionBannerText: {
    flex: 1,
    color: DarkColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    padding: 14,
    marginBottom: 10,
  },
  exerciseCardDone: {
    borderColor: DarkColors.primary + '66',
    backgroundColor: '#1A1035',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  exerciseNameLabel: {
    flex: 1,
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseNameInput: {
    flex: 1,
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: DarkColors.inputBorder,
    paddingBottom: 4,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DarkColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: DarkColors.primary,
    borderColor: DarkColors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  numInput: {
    backgroundColor: DarkColors.background,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    color: DarkColors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  removeBtn: {
    paddingBottom: 8,
    paddingHorizontal: 4,
  },

  // Add exercise
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: DarkColors.primary + '77',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  addButtonText: {
    color: DarkColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Notes
  notesInput: {
    backgroundColor: DarkColors.card,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 10,
    color: DarkColors.text,
    fontSize: 14,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DarkColors.divider,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  finishButtonDisabled: { opacity: 0.6 },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Outline button
  outlineButton: {
    borderWidth: 1.5,
    borderColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  outlineButtonText: {
    color: DarkColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty exercise list
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyExercisesText: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
