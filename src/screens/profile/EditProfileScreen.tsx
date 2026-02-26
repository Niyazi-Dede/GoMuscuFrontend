import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { profileService } from '../../services/profile.service';
import {
  Profile,
  ProfileUpdateDto,
  Goal,
  ActivityLevel,
  GoalLabels,
  ActivityLevelLabels,
  MainStackParamList,
} from '../../types';
import { DarkColors } from '../../constants/colors';
import { TextInput } from 'react-native';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const GOALS: Goal[] = ['bulk', 'cut', 'maintain', 'strength'];
const ACTIVITY_LEVELS: ActivityLevel[] = [1, 2, 3, 4, 5];

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateDto>({
    defaultValues: {
      fullName: '',
      weight: undefined,
      height: undefined,
      age: undefined,
      goal: undefined,
      activityLevel: undefined,
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileService.getProfile();
      const p: Profile = response.data;
      reset({
        fullName: p.fullName,
        weight: p.weight,
        height: p.height,
        age: p.age,
        goal: p.goal,
        activityLevel: p.activityLevel,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le profil');
      navigation.goBack();
    } finally {
      setLoadingProfile(false);
    }
  };

  const onSubmit = async (data: ProfileUpdateDto) => {
    try {
      setSaving(true);
      await profileService.updateProfile(data);
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'La mise à jour a échoué. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DarkColors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Modifier mon profil</Text>
        </View>

        {/* Nom complet */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nom complet</Text>
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: 'Le nom est requis',
              minLength: { value: 2, message: 'Minimum 2 caractères' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
                placeholder="Votre nom"
                placeholderTextColor={DarkColors.textSecondary}
                autoCapitalize="words"
              />
            )}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
        </View>

        {/* Poids / Taille / Âge */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.fieldLabel}>Poids (kg)</Text>
            <Controller
              control={control}
              name="weight"
              rules={{
                required: 'Requis',
                min: { value: 30, message: '≥ 30' },
                max: { value: 300, message: '≤ 300' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.weight && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                  value={value != null ? String(value) : ''}
                  placeholder="70"
                  placeholderTextColor={DarkColors.textSecondary}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight.message}</Text>}
          </View>

          <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.fieldLabel}>Taille (cm)</Text>
            <Controller
              control={control}
              name="height"
              rules={{
                required: 'Requis',
                min: { value: 100, message: '≥ 100' },
                max: { value: 250, message: '≤ 250' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.height && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                  value={value != null ? String(value) : ''}
                  placeholder="175"
                  placeholderTextColor={DarkColors.textSecondary}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.height && <Text style={styles.errorText}>{errors.height.message}</Text>}
          </View>

          <View style={[styles.fieldGroup, styles.rowItem]}>
            <Text style={styles.fieldLabel}>Âge</Text>
            <Controller
              control={control}
              name="age"
              rules={{
                required: 'Requis',
                min: { value: 10, message: '≥ 10' },
                max: { value: 120, message: '≤ 120' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                  value={value != null ? String(value) : ''}
                  placeholder="25"
                  placeholderTextColor={DarkColors.textSecondary}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
          </View>
        </View>

        {/* Objectif */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Objectif</Text>
          <Controller
            control={control}
            name="goal"
            rules={{ required: "L'objectif est requis" }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionGrid}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionButton, value === g && styles.optionButtonActive]}
                    onPress={() => onChange(g)}
                  >
                    <Text
                      style={[styles.optionText, value === g && styles.optionTextActive]}
                    >
                      {GoalLabels[g]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.goal && <Text style={styles.errorText}>{errors.goal.message}</Text>}
        </View>

        {/* Niveau d'activité */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Niveau d'activité</Text>
          <Controller
            control={control}
            name="activityLevel"
            rules={{ required: "Le niveau d'activité est requis" }}
            render={({ field: { onChange, value } }) => (
              <View>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.activityButton, value === level && styles.activityButtonActive]}
                    onPress={() => onChange(level)}
                  >
                    <Text
                      style={[
                        styles.activityButtonText,
                        value === level && styles.activityButtonTextActive,
                      ]}
                    >
                      {ActivityLevelLabels[level]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.activityLevel && (
            <Text style={styles.errorText}>{errors.activityLevel.message}</Text>
          )}
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  header: {
    marginBottom: 24,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: DarkColors.primary,
    fontSize: 16,
  },
  title: {
    color: DarkColors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: DarkColors.inputBackground,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DarkColors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: DarkColors.error,
  },
  errorText: {
    color: DarkColors.error,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  rowItem: {
    flex: 1,
    marginBottom: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: DarkColors.card,
  },
  optionButtonActive: {
    borderColor: DarkColors.primary,
    backgroundColor: DarkColors.primary,
  },
  optionText: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  activityButton: {
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: DarkColors.card,
    marginBottom: 8,
  },
  activityButtonActive: {
    borderColor: DarkColors.primary,
    backgroundColor: DarkColors.primary,
  },
  activityButtonText: {
    color: DarkColors.textSecondary,
    fontSize: 14,
  },
  activityButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
