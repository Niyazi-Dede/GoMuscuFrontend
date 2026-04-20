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
import { Program, Session, ExerciseDetail, WeekDayLabels } from '../../types';
import {
  getProgramFrequencyLabel,
  getProgramSessions,
  getWeeklySchedule,
  getTodayWeekDay,
  WeeklyScheduleDay,
} from './programSessions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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

function SessionCard({
  entry,
  isToday,
  defaultExpanded,
}: {
  entry: WeeklyScheduleDay;
  isToday: boolean;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const dayLabel = WeekDayLabels[entry.dayOfWeek];
  const session = entry.session;

  if (!session) {
    return (
      <View style={[styles.sessionCard, styles.restCard, isToday && styles.sessionCardToday]}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleGroup}>
            <View style={styles.sessionTitleRow}>
              <Text style={styles.sessionDay}>{dayLabel}</Text>
              {isToday ? (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.restFocus}>Repos · recuperation</Text>
          </View>
          <Ionicons name="moon-outline" size={18} color={DarkColors.textSecondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sessionCard, isToday && styles.sessionCardToday]}>
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.75}
      >
        <View style={styles.sessionTitleGroup}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionDay}>{dayLabel}</Text>
            {isToday ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sessionFocus}>{session.focus}</Text>
          {session.recommendationReason ? (
            <Text style={styles.sessionReason}>{session.recommendationReason}</Text>
          ) : null}
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
          {session.exercises.map((exercise, index) => (
            <ExerciseRow key={`${session.id ?? session.day}-${index}`} exercise={exercise} />
          ))}
        </View>
      )}
    </View>
  );
}

interface Props {
  program: Program;
}

export default function ProgramDisplay({ program }: Props) {
  const sessions = getProgramSessions(program);
  const schedule = getWeeklySchedule(program);
  const today = getTodayWeekDay();
  const frequencyLabel = getProgramFrequencyLabel(program);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.programTitle}>{program.title}</Text>
        <Text style={styles.programDate}>
          Généré le {formatDate(program.generatedAt)}
        </Text>
        <Text style={styles.programDescription}>{program.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={16} color={DarkColors.primary} />
            <Text style={styles.statText}>{frequencyLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="list-outline" size={16} color={DarkColors.primary} />
            <Text style={styles.statText}>{sessions.length} séance{sessions.length > 1 ? 's' : ''} / semaine</Text>
          </View>
        </View>
      </View>

      {(program.content.selectionGuidance || program.content.changeGuidance) ? (
        <View style={styles.guidanceCard}>
          {program.content.selectionGuidance ? (
            <View style={styles.guidanceRow}>
              <Ionicons name="sparkles-outline" size={16} color={DarkColors.primary} />
              <Text style={styles.guidanceText}>{program.content.selectionGuidance}</Text>
            </View>
          ) : null}
          {program.content.changeGuidance ? (
            <View style={styles.guidanceRow}>
              <Ionicons name="refresh-outline" size={16} color={DarkColors.primary} />
              <Text style={styles.guidanceText}>{program.content.changeGuidance}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Planning de la semaine</Text>
      <View style={styles.sessionsContainer}>
        {schedule.map((entry) => (
          <SessionCard
            key={entry.dayOfWeek}
            entry={entry}
            isToday={entry.dayOfWeek === today}
            defaultExpanded={entry.dayOfWeek === today && !!entry.session}
          />
        ))}
      </View>

      {program.content.tips?.length > 0 ? (
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsTitle}>Conseils du coach IA</Text>
          </View>
          {program.content.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  headerCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
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
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: DarkColors.divider,
  },
  guidanceCard: {
    backgroundColor: '#1A1035',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: DarkColors.primary + '44',
    gap: 12,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guidanceText: {
    flex: 1,
    color: DarkColors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
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
  sessionCardRecommended: {
    borderColor: DarkColors.primary + '66',
  },
  sessionCardToday: {
    borderColor: DarkColors.primary,
    borderWidth: 2,
  },
  restCard: {
    backgroundColor: DarkColors.background,
    opacity: 0.75,
  },
  restFocus: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  todayBadge: {
    backgroundColor: DarkColors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  sessionTitleGroup: {
    flex: 1,
    gap: 4,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionDay: {
    color: DarkColors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DarkColors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionFocus: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionReason: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
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
