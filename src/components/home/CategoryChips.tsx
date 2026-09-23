import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useCategories } from '@/src/hooks/useCategories';
import { colors } from '@/src/theme/colors';

interface Props {
  selected: string | null;
  onSelect: (name: string) => void;
}

function ChipSkeleton() {
  return <View style={styles.skeleton} />;
}

export function CategoryChips({ selected, onSelect }: Props) {
  const { categories, loading } = useCategories();

  useEffect(() => {
    if (!loading && categories.length > 0 && selected === null) {
      onSelect(categories[0].name);
    }
  }, [loading, categories, selected, onSelect]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {loading
        ? [1, 2, 3].map((k) => <ChipSkeleton key={k} />)
        : categories.map((cat) => {
            const active = selected === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => onSelect(cat.name)}
              >
                {cat.emoji ? (
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                ) : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:         { marginBottom: 20 },
  content:        { paddingHorizontal: 16, gap: 10, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 40, borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  chipActive:     { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  chipEmoji:      { fontSize: 15 },
  chipText:       { fontSize: 14, color: colors.nomad.onSurface, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  skeleton:       { width: 90, height: 40, borderRadius: 20, backgroundColor: '#E8E8E8', opacity: 0.6 },
});
