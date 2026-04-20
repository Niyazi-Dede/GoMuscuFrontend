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

const GOALS: { value: ProgramGoal; icon: string; label: string; description: string }[] = [
  { value: 'bulk', icon: '💪', label: 'Prise de masse', description: 'Gagner en masse musculaire et force' },
  { value: 'cut', icon: '🔥', label: 'Perte de poids / Sèche', description: 'Brûler les graisses et affiner la silhouette' },
  { value: 'maintain', icon: '⚡', label: 'Maintien / Tonification', description: 'Maintenir ma condition physique actuelle' },
  { value: 'strength', icon: '🏋️', label: 'Gain de force', description: 'Devenir plus fort et puissant' },
  { value: 'calisthenics', icon: '🤸', label: 'Calisthénie', description: 'Contrôle du corps, force relative et maîtrise technique' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; icon: string; label: string; description: string }[] = [
  { value: 'beginner', icon: '🌱', label: 'Débutant', description: 'Je commence tout juste le sport (< 6 mois)' },
  { value: 'intermediate', icon: '📈', label: 'Intermédiaire', description: 'Je pratique régulièrement (6 mois – 2 ans)' },
  { value: 'advanced', icon: '🏆', label: 'Avancé', description: "Je m'entraîne intensément (> 2 ans)" },
];

const SESSIONS_PER_WEEK: { value: SessionsPerWeek; label: string }[] = [
  { value: 0, label: 'À recommander' },
  { value: 1, label: '1 / sem' },
  { value: 2, label: '2 / sem' },
  { value: 3, label: '3 / sem' },
  { value: 4, label: '4 / sem' },
  { value: 5, label: '5 / sem' },
  { value: 6, label: '6 / sem' },
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

const DEFAULT_PROGRAM_DURATION: ProgramDuration = 52;
const TOTAL_STEPS = 5;

const STEP_TITLES = [
  'Quel est votre objectif\nprincipal ?',
  "Quel est votre niveau\nd'expérience ?",
  'Combien de séances\npar semaine ?',
  'Combien de temps par\nséance ?',
  'Quel équipement\navez-vous ?',
];

const STEP_SUBTITLES = [
  "Sélectionnez l'objectif qui vous correspond le mieux",
  'Cela nous aidera à personnaliser votre programme',
  "L'IA proposera 1 à 3 séances adaptées à votre rythme",
  'Chaque séance restera réaliste et tenable dans le temps',
  "L'équipement disponible pour vos entraînements",
];

const STEP_ICONS = ['🎯', '📊', '📆', '⏱️', '🏋️'];

export default function ProgramGeneratorScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [goal, setGoal] = useState<ProgramGoal | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<SessionsPerWeek | null>(null);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const currentSelections = [goal, experienceLevel, sessionsPerWeek, sessionDuration, equipment];
  const isCurrentStepValid = currentSelections[currentStep] !== null;
  const progress = (currentStep / TOTAL_STEPS) * 100;

  function handleNext() {
    if (!isCurrentStepValid) return;
    setCurrentStep((step) => step + 1);
  }

  function handleBack() {
    if (currentStep === 0) {
      navigation.goBack();
      return;
    }

    setCurrentStep((step) => step - 1);
  }

  async function handleGenerate() {
    if (!goal || !experienceLevel || sessionsPerWeek === null || !sessionDuration || !equipment) {
      Alert.alert('Erreur', 'Veuillez répondre à toutes les questions.');
      return;
    }

    const input: ProgramGeneratorInput = {
      goal,
      experienceLevel,
      sessionsPerWeek,
      sessionDuration,
      equipment,
      programDuration: DEFAULT_PROGRAM_DURATION,
    };

    setIsLoading(true);

    try {
      const response = await programService.generate(input);
      const program = response.data;
      navigation.replace('ProgramDisplay', { programId: program.id });
    } catch (error: any) {
      const responseData = error?.response?.data;
      const validationErrors = Array.isArray(responseData?.errors)
        ? responseData.errors.filter((value: unknown): value is string => typeof value === 'string')
        : [];
      const message =
        validationErrors[0] ||
        (validationErrors.length > 1 ? validationErrors.join('\n') : null) ||
        responseData?.error ||
        responseData?.detail ||
        responseData?.message ||
        'Une erreur est survenue lors de la génération. Veuillez réessayer.';

      Alert.alert('Erreur', message, [
        { text: 'Réessayer', onPress: handleGenerate },
        { text: 'Annuler', style: 'cancel' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function renderRadioCard<T>(
    options: { value: T; icon: string; label: string; description: string }[],
    selected: T | null,
    onSelect: (value: T) => void
  ) {
    return options.map((option) => {
      const isSelected = selected === option.value;

      return (
        <TouchableOpacity
          key={String(option.value)}
          style={[styles.radioCard, isSelected && styles.radioCardSelected]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.75}
        >
          <Text style={styles.radioCardIcon}>{option.icon}</Text>
          <View style={styles.radioCardTextGroup}>
            <Text style={[styles.radioCardLabel, isSelected && styles.radioCardLabelSelected]}>
              {option.label}
            </Text>
            <Text style={styles.radioCardDescription}>{option.description}</Text>
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
    onSelect: (value: T) => void
  ) {
    return (
      <View style={styles.pillRow}>
        {options.map((option) => {
          const isSelected = selected === option.value;

          return (
            <TouchableOpacity
              key={String(option.value)}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderRadioCard(GOALS, goal, setGoal);
      case 1:
        return renderRadioCard(EXPERIENCE_LEVELS, experienceLevel, setExperienceLevel);
      case 2:
        return renderPillOptions(SESSIONS_PER_WEEK, sessionsPerWeek, setSessionsPerWeek);
      case 3:
        return renderPillOptions(SESSION_DURATIONS, sessionDuration, setSessionDuration);
      case 4:
        return renderRadioCard(EQUIPMENT_OPTIONS, equipment, setEquipment);
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
        <Text style={styles.loadingTitle}>Génération en cours…</Text>
        <Text style={styles.loadingSubtitle}>
          Notre IA prépare un programme long terme avec des séances à répéter intelligemment.{'\n'}
          Cela peut prendre 10 à 20 secondes.
        </Text>
      </SafeAreaView>
    );
  }

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>
          Étape {currentStep + 1} sur {TOTAL_STEPS}
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progress + (100 / TOTAL_STEPS)}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepIcon}>{STEP_ICONS[currentStep]}</Text>
        <Text style={styles.title}>{STEP_TITLES[currentStep]}</Text>
        <Text style={styles.subtitle}>{STEP_SUBTITLES[currentStep]}</Text>

        <View style={styles.optionsContainer}>
          {renderStepContent()}
        </View>
      </ScrollView>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  stepIcon: {
    fontSize: 40,
    marginBottom: 20,
  },
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
    minWidth: 90,
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
