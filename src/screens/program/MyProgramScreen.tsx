import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { MainTabsScreenProps } from '../../types';
import { programService } from '../../services/program.service';
import { Program } from '../../types';
import ProgramDisplay from '../../components/program/ProgramDisplay';

type Props = MainTabsScreenProps<'MyProgram'>;

export default function MyProgramScreen({ navigation }: Props) {
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await programService.list();
      const programs = response.data;
      if (programs.length > 0) {
        // Show the most recent program
        const sorted = [...programs].sort(
          (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        );
        setProgram(sorted[0]);
      } else {
        setProgram(null);
      }
    } catch (err: any) {
      setError('Impossible de charger votre programme.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload when the tab comes into focus (e.g. after generating a new program)
  useFocusEffect(useCallback(() => { loadProgram(); }, [loadProgram]));

  function navigateToGenerator() {
    (navigation as any).navigate('ProgramGenerator');
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </SafeAreaView>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={DarkColors.error} />
        <Text style={styles.emptyTitle}>Une erreur est survenue</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadProgram}>
          <Text style={styles.primaryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────────

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon programme</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>Aucun programme</Text>
          <Text style={styles.emptySubtitle}>
            Vous n'avez pas encore de programme d'entraînement.{'\n'}
            Générez-en un en quelques secondes grâce à notre IA.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToGenerator}>
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Générer mon programme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Program display ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon programme</Text>
        <TouchableOpacity style={styles.newButton} onPress={navigateToGenerator}>
          <Ionicons name="add-circle-outline" size={22} color={DarkColors.primary} />
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: DarkColors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  newButton: {
    padding: 4,
  },

  // Empty state
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    color: DarkColors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
