import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainStackScreenProps, Workout } from '../../types';
import { workoutService } from '../../services/workout.service';

type Props = MainStackScreenProps<'WorkoutDetail'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function WorkoutDetailScreen({ navigation, route }: Props) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await workoutService.get(workoutId);
      setWorkout(res.data);
    } catch {
      setError('Impossible de charger les détails de la séance.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [workoutId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={DarkColors.error} />
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const completedCount = workout.exercises.filter((e) => e.completed).length;
  const totalCount = workout.exercises.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'Tracking' })}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails séance</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>{formatDate(workout.date)}</Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{totalCount}</Text>
              <Text style={styles.summaryStatLabel}>Exercices</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{completedCount}</Text>
              <Text style={styles.summaryStatLabel}>Complétés</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: completionPct === 100 ? (DarkColors.accent ?? '#4ADE80') : DarkColors.primary }]}>
                {completionPct}%
              </Text>
              <Text style={styles.summaryStatLabel}>Réussite</Text>
            </View>
          </View>

          {workout.notes ? (
            <View style={styles.notesBox}>
              <Ionicons name="chatbubble-outline" size={13} color={DarkColors.textSecondary} />
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Exercises */}
        <Text style={styles.sectionTitle}>Exercices</Text>
        {workout.exercises.map((ex, i) => (
          <View
            key={ex.id ?? i}
            style={[styles.exerciseCard, ex.completed && styles.exerciseCardDone]}
          >
            <View style={styles.exerciseCardHeader}>
              <View style={[styles.completedDot, ex.completed && styles.completedDotDone]} />
              <Text style={styles.exerciseName}>
                {ex.exercise?.name ?? ex.notes ?? `Exercice ${i + 1}`}
              </Text>
              {ex.completed && (
                <Ionicons name="checkmark-circle" size={16} color={DarkColors.accent ?? '#4ADE80'} />
              )}
            </View>
            <View style={styles.exerciseBadges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{ex.sets} × {ex.reps}</Text>
              </View>
              {ex.weight ? (
                <View style={[styles.badge, styles.badgeWeight]}>
                  <Ionicons name="barbell-outline" size={11} color={DarkColors.textSecondary} />
                  <Text style={[styles.badgeText, styles.badgeWeightText]}> {ex.weight} kg</Text>
                </View>
              ) : null}
              {ex.exercise?.muscleGroup ? (
                <View style={[styles.badge, styles.badgeMuscle]}>
                  <Text style={[styles.badgeText, styles.badgeMuscleText]}>
                    {ex.exercise.muscleGroup}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}

        {/* New workout CTA */}
        <TouchableOpacity
          style={styles.newWorkoutBtn}
          onPress={() => (navigation as any).navigate('WorkoutTracking', {})}
        >
          <Ionicons name="add-circle-outline" size={18} color={DarkColors.primary} />
          <Text style={styles.newWorkoutBtnText}>Nouvelle séance</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Summary card
  summaryCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 16,
  },
  summaryDate: {
    color: DarkColors.text,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.background,
    borderRadius: 10,
    padding: 14,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryStatValue: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryStatLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: DarkColors.divider,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: DarkColors.background,
    borderRadius: 8,
    padding: 10,
  },
  notesText: {
    flex: 1,
    color: DarkColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  exerciseCardDone: {
    borderColor: DarkColors.primary + '44',
    backgroundColor: '#1A1035',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkColors.inputBorder,
  },
  completedDotDone: {
    backgroundColor: DarkColors.accent ?? '#4ADE80',
  },
  exerciseName: {
    flex: 1,
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#2D1F4D',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: DarkColors.primaryLight ?? DarkColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeWeight: {
    backgroundColor: DarkColors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWeightText: {
    color: DarkColors.textSecondary,
  },
  badgeMuscle: {
    backgroundColor: DarkColors.background,
  },
  badgeMuscleText: {
    color: DarkColors.textSecondary,
    fontWeight: '500',
  },

  // New workout button
  newWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: DarkColors.primary + '77',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  newWorkoutBtnText: {
    color: DarkColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Error
  errorTitle: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
