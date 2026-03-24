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

type Props = AuthStackScreenProps<'Login'>;

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      const isNetworkError = !error.response;
      const message = isNetworkError
        ? 'Impossible de contacter le serveur. Vérifiez votre connexion.'
        : error.response?.data?.message || 'Email ou mot de passe incorrect.';
      Alert.alert(
        isNetworkError ? 'Erreur réseau' : 'Erreur de connexion',
        message,
      );
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
            💪 <Text style={styles.logoGreen}>GoMuscu</Text>
            <Text style={styles.logoApp}>APP</Text>
          </Text>
          <Text style={styles.tagline}>
            Transformez votre corps,{'\n'}transformez votre vie
          </Text>
        </View>

        {/* Form */}
        <Text style={styles.screenTitle}>CONNEXION</Text>

        <View style={styles.form}>
          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'L\'email est requis',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
            rules={{ required: 'Le mot de passe est requis' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={DarkColors.textSecondary}
                secureTextEntry
                autoComplete="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton principal */}
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Se connecter</Text>
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
          <Text style={styles.socialButtonText}>G  Continuer avec Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialButtonText}>f  Continuer avec Facebook</Text>
        </TouchableOpacity>

        {/* Lien inscription */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>S'inscrire</Text>
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
  logoGreen: {
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: DarkColors.primary,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: DarkColors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
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
