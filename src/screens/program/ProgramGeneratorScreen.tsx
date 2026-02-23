import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainStackScreenProps } from '../../types';
import { programService } from '../../services/program.service';
import {
  ProgramGeneratorInput,
  ProgramGoal,
  ExperienceLevel,
  SessionsPerWeek,
  ProgramDuration,
  SessionDuration,
  Equipment,
} from '../../types';

type Props = MainStackScreenProps<'ProgramGenerator'>;

// ─── Data ────────────────────────────────────────────────────────────────────

const GOALS: { value: ProgramGoal; icon: string; label: string; description: string }[] = [
  { value: 'bulk', icon: '💪', label: 'Prise de masse', description: 'Gagner en masse musculaire et force' },
  { value: 'cut', icon: '🔥', label: 'Perte de poids / Sèche', description: 'Brûler les graisses et affiner la silhouette' },
  { value: 'maintain', icon: '⚡', label: 'Maintien / Tonification', description: 'Maintenir ma condition physique actuelle' },
  { value: 'strength', icon: '🏋️', label: 'Gain de force', description: 'Devenir plus fort et puissant' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; icon: string; label: string; description: string }[] = [
  { value: 'beginner', icon: '🌱', label: 'Débutant', description: 'Je commence tout juste le sport (< 6 mois)' },
  { value: 'intermediate', icon: '📈', label: 'Intermédiaire', description: 'Je pratique régulièrement (6 mois – 2 ans)' },
  { value: 'advanced', icon: '🏆', label: 'Avancé', description: "Je m'entraîne intensément (> 2 ans)" },
];

const SESSIONS_PER_WEEK: { value: SessionsPerWeek; label: string }[] = [
  { value: 3, label: '3 / sem' },
  { value: 4, label: '4 / sem' },
  { value: 5, label: '5 / sem' },
  { value: 6, label: '6 / sem' },
];

const PROGRAM_DURATIONS: { value: ProgramDuration; label: string }[] = [
  { value: 4, label: '4 sem.' },
  { value: 8, label: '8 sem.' },
  { value: 12, label: '12 sem.' },
];

const SESSION_DURATIONS: { value: SessionDuration; label: string }[] = [
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; icon: string; label: string; description: string }[] = [
  { value: 'full_gym', icon: '🏟️', label: 'Salle de sport complète', description: 'Accès à tous les équipements professionnels' },
  { value: 'home_gym', icon: '🏠', label: 'Home gym', description: 'Haltères, barre, banc à domicile' },
  { value: 'bodyweight', icon: '🤸', label: 'Poids du corps', description: 'Aucun équipement nécessaire' },
];

const TOTAL_STEPS = 6;

// ─── Step labels / icons ─────────────────────────────────────────────────────

const STEP_TITLES = [
  'Quel est votre objectif\nprincipal ?',
  "Quel est votre niveau\nd'expérience ?",
  "Combien de séances\npar semaine ?",
  'Quelle durée pour\nvotre programme ?',
  "Combien de temps par\nséance ?",
  'Quel équipement\navez-vous ?',
];

const STEP_SUBTITLES = [
  "Sélectionnez l'objectif qui vous correspond le mieux",
  'Cela nous aidera à personnaliser votre programme',
  'Choisissez la fréquence qui vous convient',
  'La durée totale de votre programme',
  'Sélectionnez la durée qui vous convient',
  "L'équipement disponible pour vos entraînements",
];

const STEP_ICONS = ['🎯', '📊', '📅', '📆', '⏱️', '🏋️'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgramGeneratorScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [goal, setGoal] = useState<ProgramGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<SessionsPerWeek | null>(null);
  const [programDuration, setProgramDuration] = useState<ProgramDuration | null>(null);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const currentSelections = [goal, experienceLevel, sessionsPerWeek, programDuration, sessionDuration, equipment];
  const isCurrentStepValid = currentSelections[currentStep] !== null;

  const progress = (currentStep / TOTAL_STEPS) * 100;

  function handleNext() {
    if (!isCurrentStepValid) return;
    setCurrentStep((s) => s + 1);
  }

  function handleBack() {
    if (currentStep === 0) {
      navigation.goBack();
    } else {
      setCurrentStep((s) => s - 1);
    }
  }

  async function handleGenerate() {
    if (!goal || !experienceLevel || !sessionsPerWeek || !programDuration || !sessionDuration || !equipment) {
      Alert.alert('Erreur', 'Veuillez répondre à toutes les questions.');
      return;
    }

    const input: ProgramGeneratorInput = {
      goal,
      experienceLevel,
      sessionsPerWeek,
      programDuration,
      sessionDuration,
      equipment,
    };

    setIsLoading(true);
    try {
      const response = await programService.generate(input);
      const program = response.data;
      navigation.replace('ProgramDisplay', { programId: program.id });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Une erreur est survenue lors de la génération. Veuillez réessayer.';
      Alert.alert('Erreur', message, [
        { text: 'Réessayer', onPress: handleGenerate },
        { text: 'Annuler', style: 'cancel' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Render helpers ─────────────────────────────────────────────────────────

  function renderRadioCard<T>(
    options: { value: T; icon: string; label: string; description: string }[],
    selected: T | null,
    onSelect: (v: T) => void
  ) {
    return options.map((opt) => {
      const isSelected = selected === opt.value;
      return (
        <TouchableOpacity
          key={String(opt.value)}
          style={[styles.radioCard, isSelected && styles.radioCardSelected]}
          onPress={() => onSelect(opt.value)}
          activeOpacity={0.75}
        >
          <Text style={styles.radioCardIcon}>{opt.icon}</Text>
          <View style={styles.radioCardTextGroup}>
            <Text style={[styles.radioCardLabel, isSelected && styles.radioCardLabelSelected]}>
              {opt.label}
            </Text>
            <Text style={styles.radioCardDescription}>{opt.description}</Text>
          </View>
          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
            {isSelected && <View style={styles.radioCircleInner} />}
          </View>
        </TouchableOpacity>
      );
    });
  }

  function renderPillOptions<T>(
    options: { value: T; label: string }[],
    selected: T | null,
    onSelect: (v: T) => void
  ) {
    return (
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ─── Steps content ───────────────────────────────────────────────────────────

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderRadioCard(GOALS, goal, setGoal);
      case 1:
        return renderRadioCard(EXPERIENCE_LEVELS, experienceLevel, setExperienceLevel);
      case 2:
        return renderPillOptions(SESSIONS_PER_WEEK, sessionsPerWeek, setSessionsPerWeek);
      case 3:
        return renderPillOptions(PROGRAM_DURATIONS, programDuration, setProgramDuration);
      case 4:
        return renderPillOptions(SESSION_DURATIONS, sessionDuration, setSessionDuration);
      case 5:
        return renderRadioCard(EQUIPMENT_OPTIONS, equipment, setEquipment);
      default:
        return null;
    }
  }

  // ─── Loading overlay ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
        <Text style={styles.loadingTitle}>Génération en cours…</Text>
        <Text style={styles.loadingSubtitle}>
          Notre IA crée votre programme personnalisé.{'\n'}Cela peut prendre 10 à 20 secondes.
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>
          Étape {currentStep + 1} sur {TOTAL_STEPS}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progress + (100 / TOTAL_STEPS)}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step icon */}
        <Text style={styles.stepIcon}>{STEP_ICONS[currentStep]}</Text>

        {/* Title & subtitle */}
        <Text style={styles.title}>{STEP_TITLES[currentStep]}</Text>
        <Text style={styles.subtitle}>{STEP_SUBTITLES[currentStep]}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {renderStepContent()}
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, !isCurrentStepValid && styles.primaryButtonDisabled]}
          onPress={isLastStep ? handleGenerate : handleNext}
          disabled={!isCurrentStepValid}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? 'Générer mon programme' : 'Continuer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>
            {currentStep === 0 ? 'Annuler' : 'Précédent'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingTitle: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  loadingSubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Progress bar
  progressBarTrack: {
    height: 4,
    backgroundColor: DarkColors.divider,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: DarkColors.primary,
    borderRadius: 2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },

  // Step icon
  stepIcon: {
    fontSize: 40,
    marginBottom: 20,
  },

  // Title & subtitle
  title: {
    color: DarkColors.text,
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },

  optionsContainer: {
    gap: 12,
  },

  // Radio card
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DarkColors.inputBorder,
    padding: 14,
    gap: 12,
  },
  radioCardSelected: {
    borderColor: DarkColors.primary,
    backgroundColor: '#2D1F4D',
  },
  radioCardIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  radioCardTextGroup: {
    flex: 1,
  },
  radioCardLabel: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  radioCardLabelSelected: {
    color: DarkColors.primaryLight,
  },
  radioCardDescription: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: DarkColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: DarkColors.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DarkColors.primary,
  },

  // Pill buttons
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    borderWidth: 1.5,
    borderColor: DarkColors.inputBorder,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: DarkColors.card,
    minWidth: 80,
    alignItems: 'center',
  },
  pillSelected: {
    borderColor: DarkColors.primary,
    backgroundColor: '#2D1F4D',
  },
  pillText: {
    color: DarkColors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: DarkColors.primaryLight,
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DarkColors.inputBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
