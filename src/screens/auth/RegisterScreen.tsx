import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { DarkColors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackScreenProps } from '../../types';

type Props = AuthStackScreenProps<'Register'>;

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) {
      Alert.alert('Conditions requises', 'Veuillez accepter les conditions d\'utilisation.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Impossible de créer le compte. Vérifiez vos informations.';
      Alert.alert('Erreur d\'inscription', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            💪 <Text style={styles.logoWhite}>GoMuscu</Text>
            <Text style={styles.logoApp}>APP</Text>
          </Text>
          <Text style={styles.tagline}>
            Commencez votre voyage vers{'\n'}une meilleure version de vous
          </Text>
        </View>

        {/* Titre */}
        <Text style={styles.screenTitle}>INSCRIPTION</Text>

        <View style={styles.form}>
          {/* Nom complet */}
          <Text style={styles.label}>Nom complet</Text>
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: 'Le nom complet est requis',
              minLength: { value: 2, message: 'Au moins 2 caractères' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Jean Dupont"
                placeholderTextColor={DarkColors.textSecondary}
                autoCapitalize="words"
                autoComplete="name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName.message}</Text>
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'L\'email est requis',
              pattern: {
                value: EMAIL_REGEX,
                message: 'Format d\'email invalide',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="votre@email.com"
                placeholderTextColor={DarkColors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}

          {/* Mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Le mot de passe est requis',
              pattern: {
                value: PASSWORD_REGEX,
                message: 'Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={DarkColors.textSecondary}
                secureTextEntry
                autoComplete="new-password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          {/* Confirmer mot de passe */}
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Veuillez confirmer votre mot de passe',
              validate: (value) =>
                value === passwordValue || 'Les mots de passe ne correspondent pas',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={DarkColors.textSecondary}
                secureTextEntry
                autoComplete="new-password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
          )}
        </View>

        {/* Checkbox conditions */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAcceptTerms(!acceptTerms)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
            {acceptTerms && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            J'accepte les{' '}
            <Text style={styles.termsLink}>conditions d'utilisation</Text>
            {' '}et la{' '}
            <Text style={styles.termsLink}>politique de confidentialité</Text>
          </Text>
        </TouchableOpacity>

        {/* Bouton principal */}
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Créer mon compte</Text>
          )}
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Boutons sociaux */}
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialButtonText}>G  S'inscrire avec Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialButtonText}>f  S'inscrire avec Facebook</Text>
        </TouchableOpacity>

        {/* Lien connexion */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DarkColors.text,
    marginBottom: 8,
  },
  logoWhite: {
    color: DarkColors.text,
    fontWeight: 'bold',
  },
  logoApp: {
    color: DarkColors.accent,
    fontWeight: 'bold',
  },
  tagline: {
    color: DarkColors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  screenTitle: {
    color: DarkColors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  form: {
    marginBottom: 8,
  },
  label: {
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: DarkColors.inputBackground,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    color: DarkColors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: DarkColors.error,
  },
  errorText: {
    color: DarkColors.error,
    fontSize: 12,
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: DarkColors.inputBorder,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: DarkColors.primary,
    borderColor: DarkColors.primary,
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    color: DarkColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  termsLink: {
    color: DarkColors.primary,
  },
  primaryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DarkColors.divider,
  },
  dividerText: {
    color: DarkColors.textSecondary,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: DarkColors.socialButtonBorder,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: DarkColors.socialButton,
  },
  socialButtonText: {
    color: DarkColors.text,
    fontSize: 15,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: DarkColors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: DarkColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
