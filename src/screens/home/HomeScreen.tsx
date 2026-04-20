import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profile.service';
import { programService } from '../../services/program.service';
import { workoutService } from '../../services/workout.service';
import { nutritionService } from '../../services/nutrition.service';
import { Profile, Program, WorkoutStats, NutritionStats } from '../../types';
import { getProgramFrequencyLabel } from '../../components/program/programSessions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

function firstName(fullName: string) {
  return fullName.split(' ')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// ─── Dashboard state ──────────────────────────────────────────────────────────

interface DashboardData {
  profile: Profile | null;
  program: Program | null;
  workoutStats: WorkoutStats | null;
  nutritionStats: NutritionStats | null;
}

// ─── Card components ──────────────────────────────────────────────────────────

function DashCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    marginBottom: 14,
  },
});

// ─── Quick stat pill ──────────────────────────────────────────────────────────

function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.pillIcon}>{icon}</Text>
      <Text style={statStyles.pillValue}>{value}</Text>
      <Text style={statStyles.pillLabel}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: DarkColors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 4,
  },
  pillIcon: { fontSize: 22 },
  pillValue: {
    color: DarkColors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  pillLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});

// ─── CTA button ───────────────────────────────────────────────────────────────

function CtaButton({
  label,
  icon,
  onPress,
  variant = 'primary',
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}) {
  return (
    <TouchableOpacity
      style={variant === 'primary' ? ctaStyles.primary : ctaStyles.outline}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon}
        size={15}
        color={variant === 'primary' ? '#fff' : DarkColors.primary}
      />
      <Text style={variant === 'primary' ? ctaStyles.primaryText : ctaStyles.outlineText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const ctaStyles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  outlineText: { color: DarkColors.primary, fontSize: 13, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    profile: null,
    program: null,
    workoutStats: null,
    nutritionStats: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [profileRes, programsRes, workoutRes, nutritionRes] = await Promise.allSettled([
      profileService.getProfile(),
      programService.list(),
      workoutService.stats(),
      nutritionService.stats(today()),
    ]);

    setData({
      profile: profileRes.status === 'fulfilled' ? (profileRes.value.data as Profile) : null,
      program:
        programsRes.status === 'fulfilled' && (programsRes.value.data as Program[]).length > 0
          ? [...(programsRes.value.data as Program[])].sort(
              (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
            )[0]
          : null,
      workoutStats:
        workoutRes.status === 'fulfilled' ? (workoutRes.value.data as WorkoutStats) : null,
      nutritionStats:
        nutritionRes.status === 'fulfilled' ? (nutritionRes.value.data as NutritionStats) : null,
    });
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ─── Navigation helpers ──────────────────────────────────────────────────────

  function goToProgram() {
    navigation.navigate('MyProgram');
  }
  function goToGenerator() {
    navigation.navigate('ProgramGenerator');
  }
  function goToWorkout() {
    navigation.navigate('WorkoutTracking', {});
  }
  function goToNutrition() {
    navigation.navigate('Nutrition');
  }

  // ─── Derived values ──────────────────────────────────────────────────────────

  const displayName = data.profile
    ? firstName(data.profile.fullName)
    : user?.email?.split('@')[0] ?? '';

  const caloriesConsumed = data.nutritionStats?.caloriesConsumed ?? 0;
  const caloriesTarget =
    data.nutritionStats?.caloriesTarget ??
    data.profile?.dailyCalorieTarget ??
    2000;
  const calProgressPct = caloriesTarget > 0
    ? clamp(caloriesConsumed / caloriesTarget, 0, 1)
    : 0;

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()} {displayName} 👋
            </Text>
            <Text style={styles.subGreeting}>Voici votre résumé du jour</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color={DarkColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Programme card ── */}
        {data.program ? (
          <DashCard>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBg}>
                <Ionicons name="barbell-outline" size={18} color={DarkColors.primary} />
              </View>
              <Text style={styles.cardTitle}>Mon programme</Text>
            </View>
            <Text style={styles.programTitle} numberOfLines={1}>
              {data.program.title}
            </Text>
            <View style={styles.programMeta}>
              <Text style={styles.programMetaText}>
                {getProgramFrequencyLabel(data.program)}
              </Text>
            </View>
            <CtaButton
              label="Voir mon programme"
              icon="eye-outline"
              onPress={goToProgram}
              variant="outline"
            />
          </DashCard>
        ) : (
          <DashCard style={styles.generateCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBg, styles.cardIconBgPurple]}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Programme IA</Text>
            </View>
            <Text style={styles.generateTitle}>
              Générez votre programme{'\n'}personnalisé
            </Text>
            <Text style={styles.generateSub}>
              Notre IA crée un programme sur-mesure en quelques secondes.
            </Text>
            <CtaButton
              label="Générer mon programme"
              icon="sparkles-outline"
              onPress={goToGenerator}
            />
          </DashCard>
        )}

        {/* ── Workout card ── */}
        <DashCard>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBg}>
              <Ionicons name="flame-outline" size={18} color={DarkColors.primary} />
            </View>
            <Text style={styles.cardTitle}>Entraînements</Text>
          </View>

          <View style={styles.workoutStatsRow}>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>
                {data.workoutStats?.workoutsThisWeek ?? '—'}
              </Text>
              <Text style={styles.workoutStatLabel}>Cette semaine</Text>
            </View>
            <View style={styles.workoutStatDivider} />
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>
                {data.workoutStats?.currentStreak ?? '—'}
                {data.workoutStats ? '🔥' : ''}
              </Text>
              <Text style={styles.workoutStatLabel}>Jours consécutifs</Text>
            </View>
          </View>

          <CtaButton
            label="Commencer une séance"
            icon="play-outline"
            onPress={goToWorkout}
          />
        </DashCard>

        {/* ── Nutrition card ── */}
        <DashCard>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBg}>
              <Ionicons name="nutrition-outline" size={18} color={DarkColors.primary} />
            </View>
            <Text style={styles.cardTitle}>Nutrition</Text>
            <Text style={styles.nutritionDate}>
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {/* Calories */}
          <View style={styles.calorieRow}>
            <Text style={styles.calorieConsumed}>{caloriesConsumed}</Text>
            <Text style={styles.calorieTarget}> / {caloriesTarget} kcal</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.calProgressTrack}>
            <View
              style={[
                styles.calProgressFill,
                {
                  width: `${Math.round(calProgressPct * 100)}%`,
                  backgroundColor:
                    calProgressPct >= 1 ? DarkColors.error : DarkColors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.calProgressLabel}>
            {Math.round(calProgressPct * 100)}% de l'objectif journalier
          </Text>

          <CtaButton
            label="Ajouter un repas"
            icon="add-circle-outline"
            onPress={goToNutrition}
            variant="outline"
          />
        </DashCard>

        {/* ── Quick stats ── */}
        {data.workoutStats && (
          <>
            <Text style={styles.sectionTitle}>Ce mois</Text>
            <View style={styles.statsRow}>
              <StatPill
                icon="🏋️"
                value={data.workoutStats.workoutsThisMonth}
                label="Séances total"
              />
              <StatPill
                icon="🔥"
                value={`${data.workoutStats.currentStreak}j`}
                label="Série active"
              />
              <StatPill
                icon="📅"
                value={data.workoutStats.workoutsThisWeek}
                label="Cette semaine"
              />
            </View>
          </>
        )}
      </ScrollView>
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
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subGreeting: {
    color: DarkColors.textSecondary,
    fontSize: 13,
  },
  avatarBtn: {
    padding: 2,
  },

  // Card shared
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1A1035',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBgPurple: {
    backgroundColor: DarkColors.primary,
  },
  cardTitle: {
    flex: 1,
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  // Programme card
  programTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  programMeta: {
    marginBottom: 14,
  },
  programMetaText: {
    color: DarkColors.textSecondary,
    fontSize: 13,
  },

  // Generate card
  generateCard: {
    borderColor: DarkColors.primary + '44',
    borderWidth: 1.5,
  },
  generateTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 6,
  },
  generateSub: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },

  // Workout card
  workoutStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  workoutStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  workoutStatValue: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  workoutStatLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  workoutStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: DarkColors.divider,
  },

  // Nutrition card
  nutritionDate: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  calorieConsumed: {
    color: DarkColors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  calorieTarget: {
    color: DarkColors.textSecondary,
    fontSize: 15,
  },
  calProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkColors.divider,
    overflow: 'hidden',
    marginBottom: 6,
  },
  calProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  calProgressLabel: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  },

  // Quick stats
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
