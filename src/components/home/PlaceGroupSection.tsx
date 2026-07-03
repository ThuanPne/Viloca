import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/src/theme/colors';
import { PlaceCard } from './PlaceCard';
import type { Place, PlaceRegion } from '@/src/types';

type MainTab = 'region' | 'type';

const REGION_CHIPS: { label: string; value: PlaceRegion }[] = [
  { label: 'Miền Bắc', value: 'north' },
  { label: 'Miền Trung', value: 'central' },
  { label: 'Miền Nam', value: 'south' },
];

const TYPE_CHIPS = [
  { label: 'Ẩm thực', value: 'food_tour' },
  { label: 'Checkin', value: 'checkin' },
  { label: 'Trekking', value: 'trekking' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Văn hóa', value: 'cultural' },
];

interface Props {
  places: Place[];
  loading: boolean;
}

export function PlaceGroupSection({ places, loading }: Props) {
  const [activeTab, setActiveTab]     = useState<MainTab>('region');
  const [activeRegion, setActiveRegion] = useState<PlaceRegion>('north');
  const [activeType, setActiveType]   = useState('food_tour');

  const filtered = activeTab === 'region'
    ? places.filter((p) => p.region === activeRegion)
    : places.filter((p) => p.experience_types.includes(activeType));

  return (
    <View style={styles.container}>
      {/* Main tab switcher */}
      <View style={styles.tabRow}>
        {(['region', 'type'] as MainTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'region' ? 'Khu vực' : 'Loại trải nghiệm'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {(activeTab === 'region' ? REGION_CHIPS : TYPE_CHIPS).map((chip) => {
          const isActive = activeTab === 'region'
            ? chip.value === activeRegion
            : chip.value === activeType;
          return (
            <TouchableOpacity
              key={chip.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => {
                if (activeTab === 'region') setActiveRegion(chip.value as PlaceRegion);
                else setActiveType(chip.value);
              }}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Place cards */}
      {loading ? (
        <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 24 }} />
      ) : (
        <FlatList
          horizontal
          data={filtered}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 4 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có địa điểm trong nhóm này</Text>
          }
          renderItem={({ item }) => <PlaceCard place={item} size="sm" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { marginTop: 8 },
  tabRow:       { flexDirection: 'row', marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: colors.nomad.primary },
  tabText:      { fontSize: 13, fontWeight: '500', color: colors.nomad.onSurfaceVariant },
  tabTextActive:{ color: colors.nomad.primary, fontWeight: '700' },
  chips:        { marginTop: 12 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: colors.nomad.surfaceContainer },
  chipActive:   { backgroundColor: colors.nomad.primary },
  chipText:     { fontSize: 12, fontWeight: '500', color: colors.nomad.onSurfaceVariant },
  chipTextActive:{ color: '#fff' },
  empty:        { fontSize: 13, color: colors.nomad.onSurfaceVariant, paddingVertical: 24, paddingHorizontal: 4 },
});
