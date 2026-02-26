import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { Program, Session, ExerciseDetail } from '../../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Exercise row ─────────────────────────────────────────────────────────────

function ExerciseRow({ exercise }: { exercise: ExerciseDetail }) {
  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseBullet} />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseBadgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{exercise.sets} séries × {exercise.reps}</Text>
          </View>
          <View style={[styles.badge, styles.badgeRest]}>
            <Ionicons name="time-outline" size={11} color={DarkColors.textSecondary} />
            <Text style={[styles.badgeText, styles.badgeRestText]}> {exercise.rest}</Text>
          </View>
        </View>
        {exercise.notes ? (
          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Session accordion ────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.sessionCard}>
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={styles.sessionTitleGroup}>
          <Text style={styles.sessionDay}>{session.day}</Text>
          <Text style={styles.sessionFocus}>{session.focus}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionExerciseCount}>
            {session.exercises.length} exos
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={DarkColors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sessionBody}>
          {session.exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  program: Program;
}

export default function ProgramDisplay({ program }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(0);

  const currentWeek = program.content.weeks[selectedWeek];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <Text style={styles.programTitle}>{program.title}</Text>
        <Text style={styles.programDate}>
          Généré le {formatDate(program.generatedAt)}
        </Text>
        <Text style={styles.programDescription}>{program.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={DarkColors.primary} />
            <Text style={styles.statText}>{program.durationWeeks} semaines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={16} color={DarkColors.primary} />
            <Text style={styles.statText}>
              {program.sessionsPerWeek > 0 ? `${program.sessionsPerWeek} séances / semaine` : 'Fréquence variable'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Week selector ── */}
      <Text style={styles.sectionTitle}>Programme</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekScroll}
        contentContainerStyle={styles.weekScrollContent}
      >
        {program.content.weeks.map((week, index) => {
          const isSelected = selectedWeek === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.weekTab, isSelected && styles.weekTabSelected]}
              onPress={() => setSelectedWeek(index)}
              activeOpacity={0.75}
            >
              <Text style={[styles.weekTabText, isSelected && styles.weekTabTextSelected]}>
                Sem. {week.weekNumber ?? (week as any).week_number ?? index + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Sessions for selected week ── */}
      {currentWeek ? (
        <View style={styles.sessionsContainer}>
          {currentWeek.sessions.map((session, i) => (
            <SessionCard key={i} session={session} />
          ))}
        </View>
      ) : null}

      {/* ── Tips ── */}
      {program.content.tips?.length > 0 && (
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsTitle}>Conseils du coach IA</Text>
          </View>
          {program.content.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header card
  headerCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DarkColors.divider,
  },
  programTitle: {
    color: DarkColors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  programDate: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  programDescription: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.background,
    borderRadius: 10,
    padding: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statText: {
    color: DarkColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: DarkColors.divider,
  },

  // Section title
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Week selector
  weekScroll: {
    marginBottom: 16,
  },
  weekScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  weekTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DarkColors.inputBorder,
    backgroundColor: DarkColors.card,
  },
  weekTabSelected: {
    backgroundColor: DarkColors.primary,
    borderColor: DarkColors.primary,
  },
  weekTabText: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  weekTabTextSelected: {
    color: '#FFFFFF',
  },

  // Sessions
  sessionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sessionTitleGroup: {
    flex: 1,
    gap: 2,
  },
  sessionDay: {
    color: DarkColors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionFocus: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionExerciseCount: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },
  sessionBody: {
    borderTopWidth: 1,
    borderTopColor: DarkColors.divider,
    padding: 14,
    gap: 14,
  },

  // Exercise row
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exerciseBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkColors.primary,
    marginTop: 6,
  },
  exerciseInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseBadgeRow: {
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
  badgeRest: {
    backgroundColor: DarkColors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRestText: {
    color: DarkColors.textSecondary,
  },
  exerciseNotes: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Tips
  tipsCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tipsIcon: {
    fontSize: 18,
  },
  tipsTitle: {
    color: DarkColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkColors.accent ?? DarkColors.primary,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    color: DarkColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
