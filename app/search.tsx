import { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocationSearch, CITY_OPTIONS } from '@/src/hooks/useLocationSearch';
import { FilterSheet, FilterTab } from '@/src/components/home/FilterSheet';
import { colors } from '@/src/theme/colors';
import type { Location } from '@/src/types';

const PRICE_LABEL: Record<number, string> = { 1: '₫', 2: '₫₫', 3: '₫₫₫', 4: '₫₫₫₫' };

// ─── Result card ─────────────────────────────────────────────────────────────
function LocationResultCard({ location }: { location: Location }) {
  const firstPhoto = location.photos?.split(',')[0]?.trim();
  const subtitle = [location.district, location.city === 'SG' ? 'TP. HCM' : location.city === 'HN' ? 'Hà Nội' : 'Đà Nẵng'].filter(Boolean).join(', ');
  const firstCategory = location.category?.split(',')[0]?.trim();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{location.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color={colors.nomad.onSurfaceVariant} />
          <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={styles.cardTags}>
          {firstCategory ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{firstCategory}</Text>
            </View>
          ) : null}
          {location.price_level ? (
            <Text style={styles.priceText}>{PRICE_LABEL[location.price_level]}</Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.nomad.outlineVariant} />
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { query, setQuery, cityCode, setCityCode, results, loading } = useLocationSearch();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTab, setSheetTab]         = useState<FilterTab>('category');

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const isEmpty = query.trim().length === 0 && cityCode === null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={16} color={colors.nomad.outline} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Tìm địa điểm..."
            placeholderTextColor={colors.nomad.outline}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.nomad.outline} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => { setSheetTab('hashtag'); setSheetVisible(true); }}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={colors.nomad.primary} />
        </TouchableOpacity>
      </View>

      <FilterSheet
        visible={sheetVisible}
        initialTab={sheetTab}
        onClose={() => setSheetVisible(false)}
      />

      {/* ── City chips ───────────────────────────────────────────── */}
      <View style={styles.cityRow}>
        {CITY_OPTIONS.map((opt) => {
          const active = cityCode === opt.code;
          return (
            <TouchableOpacity
              key={String(opt.code)}
              style={[styles.cityChip, active && styles.cityChipActive]}
              onPress={() => setCityCode(active ? null : opt.code)}
            >
              <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Results ──────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator color={colors.nomad.primary} style={styles.loader} />
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={colors.nomad.outlineVariant} />
          <Text style={styles.emptyTitle}>Tìm địa điểm</Text>
          <Text style={styles.emptyHint}>Gõ tên, quận, hoặc chọn thành phố{'\n'}Không cần dấu cũng tìm được</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color={colors.nomad.outlineVariant} />
          <Text style={styles.emptyTitle}>Không tìm thấy</Text>
          <Text style={styles.emptyHint}>Thử từ khóa khác hoặc chọn thành phố khác</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <LocationResultCard location={item} />}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.nomad.background },

  // Header
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:   { padding: 4 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.nomad.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.nomad.surfaceContainer,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, color: colors.nomad.onSurface, padding: 0 },

  // City chips
  cityRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  cityChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99,
    backgroundColor: colors.nomad.surfaceContainer,
  },
  cityChipActive:     { backgroundColor: colors.nomad.primary },
  cityChipText:       { fontSize: 13, fontWeight: '500', color: colors.nomad.onSurfaceVariant },
  cityChipTextActive: { color: '#fff', fontWeight: '600' },

  // Loader
  loader: { marginTop: 48 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.nomad.onSurface },
  emptyHint:  { fontSize: 14, color: colors.nomad.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },

  // Result cards
  list:      { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: colors.nomad.outlineVariant },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
  },
  thumbnail: {
    width: 72, height: 72, borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.nomad.surfaceContainer,
  },
  cardInfo:     { flex: 1, gap: 4 },
  cardName:     { fontSize: 15, fontWeight: '600', color: colors.nomad.onSurface, lineHeight: 21 },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardSubtitle: { fontSize: 12, color: colors.nomad.onSurfaceVariant },
  cardTags:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  categoryPill: {
    backgroundColor: colors.nomad.secondaryContainer,
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryPillText: { fontSize: 11, fontWeight: '600', color: colors.nomad.onSurface },
  priceText:        { fontSize: 12, color: colors.nomad.onSurfaceVariant, fontWeight: '600' },
});
