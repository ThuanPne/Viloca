import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { FilterSheet, FilterTab } from './FilterSheet';

const FILTER_CHIPS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'hashtag', label: '#Tag',      icon: 'pricetag-outline' },
  { key: 'city',    label: 'TP',        icon: 'business-outline' },
  { key: 'vibe',    label: 'Vibe',      icon: 'sparkles-outline' },
  { key: 'place',   label: 'Địa điểm', icon: 'location-outline' },
  { key: 'group',   label: 'Nhóm HĐ',  icon: 'apps-outline' },
];

interface Props {
  bottomOffset: number;
}

export function HomeSearchBar({ bottomOffset }: Props) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [initialTab, setInitialTab]     = useState<FilterTab>('hashtag');

  function openSheet(tab: FilterTab) {
    setInitialTab(tab);
    setSheetVisible(true);
  }

  return (
    <>
      <BlurView
        intensity={80}
        tint="light"
        style={[styles.container, { bottom: bottomOffset }]}
      >
        {/* Search input row */}
        <TouchableOpacity style={styles.searchRow} onPress={() => openSheet('place')} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={18} color={colors.nomad.onSurfaceVariant} />
          <Text style={styles.placeholder}>Tìm địa điểm, lễ hội, vibe...</Text>
          <View style={styles.filterIconWrap}>
            <Ionicons name="options-outline" size={18} color={colors.nomad.primary} />
          </View>
        </TouchableOpacity>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={styles.chip}
              onPress={() => openSheet(chip.key)}
            >
              <Ionicons name={chip.icon as any} size={12} color={colors.nomad.primary} />
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BlurView>

      <FilterSheet
        visible={sheetVisible}
        initialTab={initialTab}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.nomad.outlineVariant,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  placeholder:    { flex: 1, fontSize: 14, color: colors.nomad.onSurfaceVariant },
  filterIconWrap: { padding: 2 },
  chips:          { },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: colors.nomad.outlineVariant,
  },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.nomad.primary },
});
