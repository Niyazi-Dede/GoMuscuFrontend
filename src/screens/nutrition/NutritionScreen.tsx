import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors } from '../../constants/colors';
import { Meal, NutritionStats } from '../../types';
import { nutritionService } from '../../services/nutrition.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (toDateString(date) === toDateString(today)) return "Aujourd'hui";
  if (toDateString(date) === toDateString(yesterday)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// ─── Macro bar ─────────────────────────────────────────────────────────────────

function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? clamp(consumed / target, 0, 1) : 0;
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.labelGroup}>
        <View style={[macroStyles.dot, { backgroundColor: color }]} />
        <Text style={macroStyles.label}>{label}</Text>
      </View>
      <View style={macroStyles.track}>
        <View style={[macroStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={macroStyles.value}>
        {consumed}g{target > 0 ? ` / ${target}g` : ''}
      </Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkColors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  value: {
    color: DarkColors.text,
    fontSize: 12,
    fontWeight: '600',
    width: 72,
    textAlign: 'right',
  },
});

// ─── Meal type colors (repeating cycle) ────────────────────────────────────────

const MEAL_COLORS = ['#F59E0B', '#10B981', '#8B5CF6', '#3B82F6', '#EF4444', '#EC4899'];

function mealColor(index: number) {
  return MEAL_COLORS[index % MEAL_COLORS.length];
}

// ─── Meal row ─────────────────────────────────────────────────────────────────

function MealRow({
  meal,
  index,
  onDelete,
}: {
  meal: Meal;
  index: number;
  onDelete: () => void;
}) {
  const color = mealColor(index);

  return (
    <View style={[mealStyles.card, { borderLeftColor: color }]}>
      <View style={mealStyles.info}>
        <Text style={mealStyles.name}>{meal.name}</Text>
        <View style={mealStyles.metaRow}>
          <Text style={mealStyles.calories}>{meal.calories} kcal</Text>
          {meal.protein != null && (
            <Text style={mealStyles.macro}>P {meal.protein}g</Text>
          )}
          {meal.carbs != null && (
            <Text style={mealStyles.macro}>G {meal.carbs}g</Text>
          )}
          {meal.fats != null && (
            <Text style={mealStyles.macro}>L {meal.fats}g</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={mealStyles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={16} color={DarkColors.error} />
      </TouchableOpacity>
    </View>
  );
}

const mealStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    borderLeftWidth: 4,
    padding: 14,
    gap: 12,
  },
  info: { flex: 1 },
  name: {
    color: DarkColors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  calories: {
    color: DarkColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  macro: {
    color: DarkColors.textSecondary,
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
});

// ─── Add meal modal ───────────────────────────────────────────────────────────

interface AddMealModalProps {
  visible: boolean;
  date: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddMealModal({ visible, date, onClose, onSaved }: AddMealModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un nom de repas.');
      return;
    }
    const cal = parseInt(calories);
    if (!cal || cal <= 0) {
      Alert.alert('Champ requis', 'Veuillez saisir des calories valides.');
      return;
    }

    setIsSaving(true);
    try {
      await nutritionService.create({
        name: name.trim(),
        calories: cal,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fats: fats ? parseFloat(fats) : undefined,
        date,
      });
      reset();
      onSaved();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le repas.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />

        <View style={modalStyles.sheet}>
          {/* Handle */}
          <View style={modalStyles.handle} />

          <Text style={modalStyles.title}>Ajouter un repas</Text>

          {/* Name */}
          <Text style={modalStyles.label}>Nom du repas *</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex : Déjeuner, Whey post-entraînement…"
            placeholderTextColor={DarkColors.textSecondary}
            autoFocus
          />

          {/* Calories */}
          <Text style={modalStyles.label}>Calories (kcal) *</Text>
          <TextInput
            style={modalStyles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="Ex : 450"
            placeholderTextColor={DarkColors.textSecondary}
            keyboardType="numeric"
          />

          {/* Macros row */}
          <Text style={modalStyles.label}>Macros (optionnel)</Text>
          <View style={modalStyles.macroRow}>
            <View style={modalStyles.macroGroup}>
              <Text style={modalStyles.macroLabel}>Protéines (g)</Text>
              <TextInput
                style={modalStyles.macroInput}
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor={DarkColors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={modalStyles.macroGroup}>
              <Text style={modalStyles.macroLabel}>Glucides (g)</Text>
              <TextInput
                style={modalStyles.macroInput}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor={DarkColors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={modalStyles.macroGroup}>
              <Text style={modalStyles.macroLabel}>Lipides (g)</Text>
              <TextInput
                style={modalStyles.macroInput}
                value={fats}
                onChangeText={setFats}
                placeholder="0"
                placeholderTextColor={DarkColors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.saveBtn, isSaving && modalStyles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.saveText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: DarkColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DarkColors.divider,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: DarkColors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: DarkColors.inputBackground,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 10,
    color: DarkColors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroGroup: { flex: 1 },
  macroLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  macroInput: {
    backgroundColor: DarkColors.inputBackground,
    borderWidth: 1,
    borderColor: DarkColors.inputBorder,
    borderRadius: 8,
    color: DarkColors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: DarkColors.inputBorder,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: DarkColors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<NutritionStats | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const dateStr = toDateString(selectedDate);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, mealsRes] = await Promise.all([
        nutritionService.stats(dateStr),
        nutritionService.listMeals(dateStr),
      ]);
      setStats(statsRes.data);
      setMeals(mealsRes.data);
    } catch {
      // Stats might not exist for the date — show empty state
      setStats(null);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function changeDate(delta: number) {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + delta);
      // Don't allow future dates
      if (next > new Date()) return d;
      return next;
    });
  }

  async function handleDelete(meal: Meal) {
    Alert.alert(
      'Supprimer',
      `Supprimer "${meal.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await nutritionService.delete(meal.id);
              load();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le repas.');
            }
          },
        },
      ]
    );
  }

  // ─── Computed ──────────────────────────────────────────────────────────────

  const caloriesConsumed = stats?.caloriesConsumed ?? meals.reduce((s, m) => s + m.calories, 0);
  const caloriesTarget = stats?.caloriesTarget ?? 2000;
  const caloriesRemaining = Math.max(caloriesTarget - caloriesConsumed, 0);
  const progressPct = caloriesTarget > 0 ? clamp(caloriesConsumed / caloriesTarget, 0, 1) : 0;
  const isOverTarget = caloriesConsumed > caloriesTarget;

  const proteinConsumed = stats?.proteinConsumed ?? meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  const carbsConsumed = stats?.carbsConsumed ?? meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const fatsConsumed = stats?.fatsConsumed ?? meals.reduce((s, m) => s + (m.fats ?? 0), 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
      </View>

      {/* Date navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
          <Ionicons name="chevron-back" size={20} color={DarkColors.text} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          style={styles.dateNavBtn}
          disabled={toDateString(selectedDate) === toDateString(new Date())}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              toDateString(selectedDate) === toDateString(new Date())
                ? DarkColors.divider
                : DarkColors.text
            }
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={DarkColors.primary} />
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Calorie stats card */}
              <View style={styles.statsCard}>
                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    {isOverTarget ? '⚠️ Objectif dépassé' : `${Math.round(progressPct * 100)}% de l'objectif`}
                  </Text>
                  <Text style={styles.progressPct}>
                    {caloriesConsumed} / {caloriesTarget} kcal
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progressPct * 100)}%`,
                        backgroundColor: isOverTarget ? DarkColors.error : DarkColors.primary,
                      },
                    ]}
                  />
                </View>

                {/* 3 stats pills */}
                <View style={styles.caloriePills}>
                  <View style={styles.caloriePill}>
                    <Text style={styles.caloriePillValue}>{caloriesTarget}</Text>
                    <Text style={styles.caloriePillLabel}>Objectif</Text>
                  </View>
                  <View style={styles.caloriePillDivider} />
                  <View style={styles.caloriePill}>
                    <Text style={[styles.caloriePillValue, { color: DarkColors.primary }]}>
                      {caloriesConsumed}
                    </Text>
                    <Text style={styles.caloriePillLabel}>Consommé</Text>
                  </View>
                  <View style={styles.caloriePillDivider} />
                  <View style={styles.caloriePill}>
                    <Text
                      style={[
                        styles.caloriePillValue,
                        { color: isOverTarget ? DarkColors.error : (DarkColors.accent ?? '#4ADE80') },
                      ]}
                    >
                      {isOverTarget ? `-${caloriesConsumed - caloriesTarget}` : caloriesRemaining}
                    </Text>
                    <Text style={styles.caloriePillLabel}>
                      {isOverTarget ? 'Excédent' : 'Restant'}
                    </Text>
                  </View>
                </View>

                {/* Macros */}
                {(proteinConsumed > 0 || carbsConsumed > 0 || fatsConsumed > 0) && (
                  <View style={styles.macrosContainer}>
                    <MacroBar
                      label="Protéines"
                      consumed={proteinConsumed}
                      target={stats?.proteinTarget ?? 0}
                      color="#EF4444"
                    />
                    <MacroBar
                      label="Glucides"
                      consumed={carbsConsumed}
                      target={stats?.carbsTarget ?? 0}
                      color="#10B981"
                    />
                    <MacroBar
                      label="Lipides"
                      consumed={fatsConsumed}
                      target={stats?.fatsTarget ?? 0}
                      color="#F59E0B"
                    />
                  </View>
                )}
              </View>

              {meals.length > 0 && (
                <Text style={styles.sectionTitle}>Repas du jour</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>Aucun repas enregistré</Text>
              <Text style={styles.emptySubtitle}>
                Appuyez sur le bouton + pour ajouter votre premier repas.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <MealRow meal={item} index={index} onDelete={() => handleDelete(item)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add meal modal */}
      <AddMealModal
        visible={showModal}
        date={dateStr}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); load(); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkColors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    color: DarkColors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    color: DarkColors.text,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Stats card
  statsCard: {
    backgroundColor: DarkColors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: DarkColors.divider,
    gap: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: DarkColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPct: {
    color: DarkColors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkColors.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  caloriePills: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkColors.background,
    borderRadius: 10,
    padding: 12,
  },
  caloriePill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  caloriePillValue: {
    color: DarkColors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  caloriePillLabel: {
    color: DarkColors.textSecondary,
    fontSize: 11,
  },
  caloriePillDivider: {
    width: 1,
    height: 28,
    backgroundColor: DarkColors.divider,
  },
  macrosContainer: {
    gap: 0,
    paddingTop: 4,
  },

  // Section title
  sectionTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: DarkColors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: DarkColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DarkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DarkColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
