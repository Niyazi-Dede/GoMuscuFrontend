import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { profileService } from '../../services/profile.service';
import { useAuth } from '../../contexts/AuthContext';
import { Profile, GoalLabels, ActivityLevelLabels, MainStackParamList } from '../../types';
import { DarkColors } from '../../constants/colors';

type NavigationProp = StackNavigationProp<MainStackParamList>;

export default function ProfileScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getProfile();
      setProfile(response.data);
    } catch {
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.fullName ?? '—'}</Text>
      </View>

      {/* Calories cibles */}
      {profile?.dailyCalorieTarget != null && (
        <View style={styles.calorieCard}>
          <Text style={styles.calorieLabel}>Objectif calorique journalier</Text>
          <Text style={styles.calorieValue}>{profile.dailyCalorieTarget} kcal</Text>
        </View>
      )}

      {/* Infos physiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations physiques</Text>
        <View style={styles.infoRow}>
          <InfoItem label="Poids" value={profile?.weight != null ? `${profile.weight} kg` : '—'} />
          <InfoItem label="Taille" value={profile?.height != null ? `${profile.height} cm` : '—'} />
          <InfoItem label="Âge" value={profile?.age != null ? `${profile.age} ans` : '—'} />
        </View>
      </View>

      {/* Objectif & Activité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Programme</Text>
        <LabelItem
          label="Objectif"
          value={profile?.goal != null ? GoalLabels[profile.goal] : '—'}
        />
        <LabelItem
          label="Niveau d'activité"
          value={profile?.activityLevel != null ? ActivityLevelLabels[profile.activityLevel] : '—'}
        />
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Modifier mon profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function LabelItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.labelItem}>
      <Text style={styles.labelItemLabel}>{label}</Text>
      <Text style={styles.labelItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: DarkColors.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DarkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  calorieCard: {
    backgroundColor: DarkColors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  calorieValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoLabel: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },
  labelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkColors.divider,
  },
  labelItemLabel: {
    color: DarkColors.textSecondary,
    fontSize: 14,
  },
  labelItemValue: {
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkColors.error,
  },
  logoutButtonText: {
    color: DarkColors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
