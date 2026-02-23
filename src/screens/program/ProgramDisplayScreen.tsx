import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainStackScreenProps, Program } from '../../types';
import { programService } from '../../services/program.service';
import ProgramDisplay from '../../components/program/ProgramDisplay';

type Props = MainStackScreenProps<'ProgramDisplay'>;

export default function ProgramDisplayScreen({ navigation, route }: Props) {
  const { programId } = route.params;
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await programService.get(programId);
      setProgram(response.data);
    } catch {
      setError('Impossible de charger votre programme.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [programId]);

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
        <Text style={styles.loadingText}>Chargement du programme…</Text>
      </SafeAreaView>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────────

  if (error || !program) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={DarkColors.error} />
        <Text style={styles.errorTitle}>Une erreur est survenue</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { screen: 'MyProgram' })}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon programme</Text>
        <View style={styles.backButton} />
      </View>

      {/* Success banner */}
      <View style={styles.successBanner}>
        <Ionicons name="checkmark-circle" size={18} color={DarkColors.accent ?? '#4ADE80'} />
        <Text style={styles.successText}>Programme généré avec succès !</Text>
      </View>

      <ProgramDisplay program={program} />
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
    paddingBottom: 8,
  },
  backButton: {
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

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#0F2A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#166534',
  },
  successText: {
    color: DarkColors.accent ?? '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingText: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },

  // Error
  errorTitle: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
