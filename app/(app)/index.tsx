import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Image, TouchableOpacity, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useExperiences } from '@/src/hooks/useExperiences';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Tag } from '@/src/components/ui/Tag';
import { Badge } from '@/src/components/ui/Badge';
import { Avatar } from '@/src/components/ui/Avatar';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { Experience, ExperienceCategory } from '@/src/types';

const CATEGORIES: { label: string; value: ExperienceCategory | null }[] = [
  { label: 'Tất cả', value: null },
  { label: 'Ẩm thực', value: 'food_tour' },
  { label: 'Văn hóa', value: 'cultural' },
  { label: 'Thiên nhiên', value: 'trekking' },
  { label: 'Workshop', value: 'workshop' },
];

const CATEGORY_LABEL: Record<string, string> = {
  food_tour: 'Ẩm thực',
  workshop:  'Workshop',
  trekking:  'Thiên nhiên',
  cultural:  'Văn hóa',
};

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState<ExperienceCategory | null>(null);
  const { experiences, featured } = useExperiences(activeCategory);

  const firstName = user?.user_metadata?.full_name?.split(' ').pop() ?? 'bạn';

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar name={user?.user_metadata?.full_name} size={36} />
            <Text style={styles.greeting}>Xin chào, <Text style={styles.greetingName}>{firstName}</Text></Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Bạn muốn khám phá điều gì?"
            placeholderTextColor={colors.textMuted}
            editable={false}
          />
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat.value)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured */}
        {!activeCategory && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <SectionHeader title="Đang nổi bật" />
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              renderItem={({ item }) => <FeaturedCard item={item} />}
            />
          </View>
        )}

        {/* Experience List */}
        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
          <SectionHeader title="Trải nghiệm gợi ý" />
          {experiences.map((item) => (
            <ExperienceRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function FeaturedCard({ item }: { item: Experience }) {
  return (
    <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => router.push(`/experience/${item.id}`)}>
      <Image source={{ uri: item.coverImage }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay}>
        <Badge label={CATEGORY_LABEL[item.category] ?? item.category} color="primary" />
        <View style={{ marginTop: 'auto' }}>
          <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.featuredLocation}>📍 {item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ExperienceRow({ item }: { item: Experience }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => router.push(`/experience/${item.id}`)}>
      <Image source={{ uri: item.coverImage }} style={styles.rowImage} />
      <View style={styles.rowInfo}>
        <Tag label={CATEGORY_LABEL[item.category] ?? item.category} color="forest" />
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rowLocation} numberOfLines={1}>📍 {item.location}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowRating}>⭐ {item.rating}</Text>
          <Text style={styles.rowPrice}>{formatPrice(item.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting:          { fontSize: 15, color: colors.textMuted },
  greetingName:      { fontWeight: '600', color: colors.textPrimary },
  searchBar:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 12, gap: 8 },
  searchInput:       { flex: 1, fontSize: 14, color: colors.textPrimary },
  categories:        { marginTop: spacing.md },
  categoryChip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.primary100 },
  categoryChipActive:{ backgroundColor: colors.primary600 },
  categoryText:      { fontSize: 13, fontWeight: '500', color: colors.primary600 },
  categoryTextActive:{ color: colors.textOnDark },
  sectionHeader:     { paddingHorizontal: spacing.lg },
  featuredCard:      { width: 260, height: 180, borderRadius: radius.lg, overflow: 'hidden' },
  featuredImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredOverlay:   { ...StyleSheet.absoluteFillObject, padding: 12, justifyContent: 'flex-start', backgroundColor: 'rgba(0,0,0,0.25)' },
  featuredTitle:     { color: colors.textOnDark, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  featuredLocation:  { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  row:               { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: spacing.md, gap: 12 },
  rowImage:          { width: 80, height: 80, borderRadius: radius.md, resizeMode: 'cover' },
  rowInfo:           { flex: 1, gap: 4 },
  rowTitle:          { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 },
  rowLocation:       { fontSize: 12, color: colors.textMuted },
  rowMeta:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  rowRating:         { fontSize: 12, color: colors.textMuted },
  rowPrice:          { fontSize: 13, fontWeight: '600', color: colors.primary600 },
});
