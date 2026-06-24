import { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Image, TouchableOpacity, TextInput, Modal,
  Animated, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExperiences } from '@/src/hooks/useExperiences';
import { useBookmarks } from '@/src/hooks/useBookmarks';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Tag } from '@/src/components/ui/Tag';
import { Badge } from '@/src/components/ui/Badge';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import { mockExperiences } from '@/src/data/mock/experiences';
import type { Experience, ExperienceCategory, BookmarkStatus } from '@/src/types';

const CATEGORIES: { label: string; value: ExperienceCategory | null }[] = [
  { label: 'Tất cả',    value: null },
  { label: 'Ẩm thực',  value: 'food_tour' },
  { label: 'Văn hóa',  value: 'cultural' },
  { label: 'Thiên nhiên', value: 'trekking' },
  { label: 'Workshop', value: 'workshop' },
];

const CATEGORY_LABEL: Record<string, string> = {
  food_tour: 'Ẩm thực',
  workshop:  'Workshop',
  trekking:  'Thiên nhiên',
  cultural:  'Văn hóa',
};

const PROVINCES = [
  'Tất cả',
  'Hà Nội', 'Đà Nẵng', 'Quảng Nam', 'Lào Cai',
  'Lâm Đồng', 'Quảng Ninh', 'Yên Bái', 'Thừa Thiên Huế',
  'Cần Thơ', 'Sơn La',
];

const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Tất cả giá',  min: 0,       max: 99_000_000 },
  { label: '< 300K',      min: 0,       max: 300_000 },
  { label: '300K – 700K', min: 300_000, max: 700_000 },
  { label: '> 700K',      min: 700_000, max: 99_000_000 },
];

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

export default function ExploreScreen() {
  const { bookmarks, toggle, setStatus } = useBookmarks();
  const [query,          setQuery]          = useState('');
  const [activeCategory, setActiveCategory] = useState<ExperienceCategory | null>(null);
  const [province,       setProvince]       = useState('Tất cả');
  const [priceIdx,       setPriceIdx]       = useState(0);
  const [showProvModal,  setShowProvModal]  = useState(false);
  const [searchFocused,  setSearchFocused]  = useState(false);

  const { featured } = useExperiences(null);

  // Animated opacity cho results khi filter thay đổi
  const resultsOpacity = useRef(new Animated.Value(1)).current;
  function animateResults() {
    Animated.sequence([
      Animated.timing(resultsOpacity, { toValue: 0.3, duration: 80, useNativeDriver: true }),
      Animated.timing(resultsOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
    ]).start();
  }

  const priceRange = PRICE_RANGES[priceIdx];

  const filtered = useMemo(() => {
    animateResults();
    return mockExperiences.filter((exp) => {
      const q = query.trim().toLowerCase();
      const matchQuery = !q
        || exp.title.toLowerCase().includes(q)
        || exp.location.toLowerCase().includes(q);
      const matchCat   = !activeCategory || exp.category === activeCategory;
      const matchProv  = province === 'Tất cả' || exp.location.includes(province);
      const matchPrice = exp.price >= priceRange.min && exp.price <= priceRange.max;
      return matchQuery && matchCat && matchProv && matchPrice;
    });
  }, [query, activeCategory, province, priceIdx]);

  const showFeatured = !activeCategory && !query && province === 'Tất cả' && priceIdx === 0;
  const hasFilter    = !!query || !!activeCategory || province !== 'Tất cả' || priceIdx !== 0;

  function clearAll() {
    setQuery('');
    setActiveCategory(null);
    setProvince('Tất cả');
    setPriceIdx(0);
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá</Text>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary600 : colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm địa điểm, trải nghiệm..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(cat.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Province + Price row */}
        <View style={styles.filterRow}>
          {/* Province dropdown */}
          <TouchableOpacity
            style={[styles.filterBtn, province !== 'Tất cả' && styles.filterBtnActive]}
            onPress={() => setShowProvModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={14} color={province !== 'Tất cả' ? colors.textOnDark : colors.primary600} />
            <Text style={[styles.filterBtnText, province !== 'Tất cả' && styles.filterBtnTextActive]} numberOfLines={1}>
              {province === 'Tất cả' ? 'Tỉnh thành' : province}
            </Text>
            <Ionicons name="chevron-down" size={13} color={province !== 'Tất cả' ? colors.textOnDark : colors.primary600} />
          </TouchableOpacity>

          {/* Price chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: spacing.lg }}>
            {PRICE_RANGES.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[styles.chip, i === priceIdx && styles.chipActive]}
                onPress={() => setPriceIdx(i)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, i === priceIdx && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Result count + clear */}
        <View style={styles.resultRow}>
          <Text style={styles.resultCount}>
            {showFeatured ? `${mockExperiences.length} trải nghiệm` : `${filtered.length} kết quả`}
          </Text>
          {hasFilter && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearBtn}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Featured carousel (chỉ hiện khi chưa filter) */}
        {showFeatured && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <SectionHeader title="Đang nổi bật" />
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              renderItem={({ item }) => (
                <FeaturedCard
                  item={item}
                  bookmarkStatus={bookmarks[item.id]}
                  onBookmark={() => toggle(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Results */}
        <Animated.View style={[{ paddingHorizontal: spacing.lg }, { opacity: resultsOpacity }]}>
          {!showFeatured && (
            <SectionHeader title={activeCategory ? (CATEGORY_LABEL[activeCategory] ?? '') : 'Kết quả tìm kiếm'} />
          )}
          {showFeatured && <SectionHeader title="Tất cả trải nghiệm" />}

          {filtered.length === 0 ? (
            <EmptyResult onClear={clearAll} />
          ) : (
            filtered.map((item) => (
              <ExperienceRow
                key={item.id}
                item={item}
                bookmarkStatus={bookmarks[item.id]}
                onBookmark={() => toggle(item.id)}
                onSetStatus={(s) => setStatus(item.id, s)}
              />
            ))
          )}
        </Animated.View>

      </ScrollView>

      {/* Province Modal */}
      <Modal visible={showProvModal} transparent animationType="slide" onRequestClose={() => setShowProvModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowProvModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chọn tỉnh thành</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PROVINCES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.modalItem, province === p && styles.modalItemActive]}
                  onPress={() => { setProvince(p); setShowProvModal(false); }}
                >
                  <Text style={[styles.modalItemText, province === p && styles.modalItemTextActive]}>{p}</Text>
                  {province === p && <Ionicons name="checkmark" size={18} color={colors.primary600} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const BOOKMARK_STATUS_LABEL: Record<BookmarkStatus, string> = {
  want:    'Muốn đi',
  planned: 'Đã kế hoạch',
  done:    'Đã đi',
};
const BOOKMARK_ICON_COLOR: Record<BookmarkStatus, string> = {
  want:    '#EF4444',
  planned: '#F59E0B',
  done:    '#22C55E',
};

function BookmarkButton({
  status,
  onPress,
  onLongPress,
}: {
  status?: BookmarkStatus;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.45, duration: 90,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  const iconName = status ? 'heart' : 'heart-outline';
  const iconColor = status ? BOOKMARK_ICON_COLOR[status] : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function BookmarkSheet({
  visible,
  currentStatus,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentStatus?: BookmarkStatus;
  onSelect: (s: BookmarkStatus | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { maxHeight: 280 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Lưu địa điểm</Text>
          {(['want', 'planned', 'done'] as BookmarkStatus[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.modalItem, currentStatus === s && styles.modalItemActive]}
              onPress={() => { onSelect(s); onClose(); }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="heart" size={18} color={BOOKMARK_ICON_COLOR[s]} />
                <Text style={[styles.modalItemText, currentStatus === s && styles.modalItemTextActive]}>
                  {BOOKMARK_STATUS_LABEL[s]}
                </Text>
              </View>
              {currentStatus === s && <Ionicons name="checkmark" size={18} color={colors.primary600} />}
            </TouchableOpacity>
          ))}
          {currentStatus && (
            <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0 }]} onPress={() => { onSelect(null); onClose(); }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="heart-dislike-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.modalItemText, { color: colors.textMuted }]}>Bỏ lưu</Text>
              </View>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FeaturedCard({
  item,
  bookmarkStatus,
  onBookmark,
}: {
  item: Experience;
  bookmarkStatus?: BookmarkStatus;
  onBookmark: () => void;
}) {
  const [showSheet, setShowSheet] = useState(false);
  const { setStatus } = useBookmarks();

  return (
    <>
      <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => router.push(`/experience/${item.id}`)}>
        <Image source={{ uri: item.coverImage }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Badge label={CATEGORY_LABEL[item.category] ?? item.category} color="primary" />
            <BookmarkButton status={bookmarkStatus} onPress={onBookmark} onLongPress={() => setShowSheet(true)} />
          </View>
          <View style={{ marginTop: 'auto' }}>
            <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.featuredLocation}>📍 {item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <BookmarkSheet
        visible={showSheet}
        currentStatus={bookmarkStatus}
        onSelect={(s) => setStatus(item.id, s)}
        onClose={() => setShowSheet(false)}
      />
    </>
  );
}

function ExperienceRow({
  item,
  bookmarkStatus,
  onBookmark,
  onSetStatus,
}: {
  item: Experience;
  bookmarkStatus?: BookmarkStatus;
  onBookmark: () => void;
  onSetStatus: (s: BookmarkStatus | null) => void;
}) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => router.push(`/experience/${item.id}`)}>
        <Image source={{ uri: item.coverImage }} style={styles.rowImage} />
        <View style={styles.rowInfo}>
          <Tag label={CATEGORY_LABEL[item.category] ?? item.category} color="forest" />
          <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rowLocation} numberOfLines={1}>📍 {item.location}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowRating}>⭐ {item.rating} ({item.reviewCount})</Text>
            <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>
        <View style={{ justifyContent: 'flex-start', paddingTop: 4 }}>
          <BookmarkButton status={bookmarkStatus} onPress={onBookmark} onLongPress={() => setShowSheet(true)} />
        </View>
      </TouchableOpacity>
      <BookmarkSheet
        visible={showSheet}
        currentStatus={bookmarkStatus}
        onSelect={onSetStatus}
        onClose={() => setShowSheet(false)}
      />
    </>
  );
}

function EmptyResult({ onClear }: { onClear: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={52} color={colors.border} />
      <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
      <Text style={styles.emptyBody}>Thử thay đổi từ khóa hoặc bộ lọc</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onClear}>
        <Text style={styles.emptyBtnText}>Xóa bộ lọc</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerTitle:         { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  searchBar:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 12, gap: 8, marginBottom: spacing.md },
  searchBarFocused:    { borderColor: colors.primary600 },
  searchInput:         { flex: 1, fontSize: 14, color: colors.textPrimary },
  chips:               { marginBottom: spacing.sm },
  chip:                { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.primary100 },
  chipActive:          { backgroundColor: colors.primary600 },
  chipText:            { fontSize: 13, fontWeight: '500', color: colors.primary600 },
  chipTextActive:      { color: colors.textOnDark },
  filterRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: spacing.lg, marginBottom: spacing.sm },
  filterBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.primary100, borderWidth: 1, borderColor: colors.primary200 ?? colors.border },
  filterBtnActive:     { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  filterBtnText:       { fontSize: 13, fontWeight: '500', color: colors.primary600, maxWidth: 80 },
  filterBtnTextActive: { color: colors.textOnDark },
  resultRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  resultCount:         { fontSize: 13, color: colors.textMuted },
  clearBtn:            { fontSize: 13, fontWeight: '600', color: colors.primary600 },
  sectionHeader:       { marginBottom: spacing.sm },
  featuredCard:        { width: 260, height: 180, borderRadius: radius.lg, overflow: 'hidden' },
  featuredImage:       { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredOverlay:     { ...StyleSheet.absoluteFillObject, padding: 12, justifyContent: 'flex-start', backgroundColor: 'rgba(0,0,0,0.25)' },
  featuredTitle:       { color: colors.textOnDark, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  featuredLocation:    { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  row:                 { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: spacing.md, gap: 12 },
  rowImage:            { width: 80, height: 80, borderRadius: radius.md, resizeMode: 'cover' },
  rowInfo:             { flex: 1, gap: 4 },
  rowTitle:            { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  rowLocation:         { fontSize: 12, color: colors.textMuted },
  rowMeta:             { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  rowRating:           { fontSize: 12, color: colors.textMuted },
  rowPrice:            { fontSize: 13, fontWeight: '600', color: colors.primary600 },
  empty:               { alignItems: 'center', paddingVertical: spacing.xl * 2, gap: 8 },
  emptyTitle:          { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  emptyBody:           { fontSize: 13, color: colors.textMuted },
  emptyBtn:            { marginTop: spacing.md, paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.primary100 },
  emptyBtnText:        { fontSize: 14, fontWeight: '600', color: colors.primary600 },
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: spacing.lg, paddingBottom: 32, maxHeight: '70%' },
  modalHandle:         { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle:          { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  modalItem:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemActive:     { },
  modalItemText:       { fontSize: 15, color: colors.textPrimary },
  modalItemTextActive: { fontWeight: '600', color: colors.primary600 },
});
