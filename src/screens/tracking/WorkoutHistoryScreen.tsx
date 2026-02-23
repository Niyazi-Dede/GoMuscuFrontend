import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainTabsScreenProps, Workout, WorkoutStats } from '../../types';
import { workoutService } from '../../services/workout.service';

type Props = MainTabsScreenProps<'Tracking'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Workout row ──────────────────────────────────────────────────────────────

function WorkoutRow({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const completedCount = workout.exercises.filter((e) => e.completed).length;
  const totalCount = workout.exercises.length;

  return (
    <TouchableOpacity style={styles.workoutRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.workoutDateCol}>
        <Text style={styles.workoutDay}>
          {new Date(workout.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
        </Text>
        <Text style={styles.workoutDayNum}>
          {new Date(workout.date).getDate()}
        </Text>
      </View>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>
          {workout.exercises[0]?.exercise?.name ?? 'Séance'}
          {totalCount > 1 ? ` +${totalCount - 1}` : ''}
        </Text>
        <View style={styles.workoutMeta}>
          <View style={styles.metaBadge}>
            <Ionicons name="barbell-outline" size={11} color={DarkColors.textSecondary} />
            <Text style={styles.metaBadgeText}>{totalCount} exos</Text>
          </View>
          {completedCount > 0 && (
            <View style={[styles.metaBadge, styles.metaBadgeDone]}>
              <Ionicons name="checkmark-circle" size={11} color={DarkColors.accent ?? '#4ADE80'} />
              <Text style={[styles.metaBadgeText, styles.metaBadgeTextDone]}>
                {completedCount}/{totalCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={DarkColors.textSecondary} />
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WorkoutHistoryScreen({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [workoutsRes, statsRes] = await Promise.all([
        workoutService.list(),
        workoutService.stats(),
      ]);
      const sorted = [...workoutsRes.data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sorted);
      setStats(statsRes.data);
    } catch {
      setError('Impossible de charger les séances.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function startWorkout() {
    (navigation as any).navigate('WorkoutTracking', {});
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </SafeAreaView>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={DarkColors.error} />
        <Text style={styles.emptyTitle}>Erreur</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suivi</Text>
        <TouchableOpacity style={styles.newWorkoutBtn} onPress={startWorkout}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newWorkoutBtnText}>Séance</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Stats row */}
            {stats && (
              <View style={styles.statsRow}>
                <StatCard icon="🏋️" value={stats.totalWorkouts} label="Total" />
                <StatCard icon="📅" value={stats.workoutsThisWeek} label="Cette semaine" />
                <StatCard icon="🔥" value={`${stats.currentStreak}j`} label="Série" />
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity style={styles.ctaCard} onPress={startWorkout} activeOpacity={0.8}>
              <View style={styles.ctaInfo}>
                <Text style={styles.ctaTitle}>Commencer une séance</Text>
                <Text style={styles.ctaSubtitle}>Depuis votre programme ou en libre</Text>
              </View>
              <Ionicons name="play-circle" size={36} color={DarkColors.primary} />
            </TouchableOpacity>

            {workouts.length > 0 && (
              <Text style={styles.sectionTitle}>Historique</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Aucune séance</Text>
            <Text style={styles.emptySubtitle}>
              Vos séances terminées apparaîtront ici.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            onPress={() => (navigation as any).navigate('WorkoutDetail', { workoutId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: DarkColors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  newWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newWorkoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: {
    color: DarkColors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  // CTA card
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DarkColors.primary + '44',
  },
  ctaInfo: { flex: 1 },
  ctaTitle: {
    color: DarkColors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ctaSubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 13,
  },

  // Section title
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Workout row
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 12,
  },
  workoutDateCol: {
    alignItems: 'center',
    width: 36,
  },
  workoutDay: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  workoutDayNum: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutInfo: { flex: 1 },
  workoutTitle: {
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DarkColors.background,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaBadgeDone: {
    backgroundColor: '#0F2A1A',
  },
  metaBadgeText: {
    color: DarkColors.textSecondary,
    fontSize: 11,
  },
  metaBadgeTextDone: {
    color: DarkColors.accent ?? '#4ADE80',
  },
  separator: { height: 8 },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
