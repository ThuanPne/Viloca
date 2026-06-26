import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useFavorite } from '@/src/hooks/useFavorite';
import { colors } from '@/src/theme/colors';
import type { Location } from '@/src/types';

const PRICE_LABEL: Record<number, { symbol: string; label: string }> = {
  1: { symbol: '₫',    label: 'Miễn phí – 80k' },
  2: { symbol: '₫₫',   label: '80k – 250k' },
  3: { symbol: '₫₫₫',  label: '250k – 600k' },
  4: { symbol: '₫₫₫₫', label: '600k+' },
};
const LONG_DESC_LINES = 4;

// ─── Accordion section ───────────────────────────────────────────────────────
function AccordionSection({
  title, children,
}: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.nomad.onSurfaceVariant}
        />
      </TouchableOpacity>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  const { isFavorite, toggle } = useFavorite(id);

  useEffect(() => {
    supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setLocation(data as Location);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.nomad.primary} size="large" />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Không tìm thấy địa điểm</Text>
      </View>
    );
  }

  const firstPhoto = location.photos?.split(',')[0]?.trim();
  const styleTags = location.style_tag
    ? location.style_tag.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const subtitle = [location.district, location.city === 'SG' ? 'TP. Hồ Chí Minh' : location.city === 'HN' ? 'Hà Nội' : location.city === 'DN' ? 'Đà Nẵng' : location.city].filter(Boolean).join(', ');

  const hasLongDesc = location.long_description && location.long_description.length > 0;
  const hasMapsUrl = !!location.google_maps_url;

  return (
    <View style={styles.screen}>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          locations={[0, 0.6]}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Content ────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Category + verified */}
        <View style={styles.badgeRow}>
          {location.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {location.category.split(',')[0].trim()}
              </Text>
            </View>
          ) : null}
          {location.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.nomad.primary} />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
        </View>

        {/* Name + heart */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={3}>{location.name}</Text>
          <TouchableOpacity onPress={toggle} style={styles.heartBtn} activeOpacity={0.7}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? '#e53e3e' : colors.nomad.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <Ionicons name="location-outline" size={14} color={colors.nomad.onSurfaceVariant} />
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        ) : null}

        {/* Style tags */}
        {styleTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            {styleTags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Price badge */}
        {location.price_level ? (
          <View style={styles.priceBadgeRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeSymbol}>{PRICE_LABEL[location.price_level].symbol}</Text>
              <Text style={styles.priceBadgeLabel}>{PRICE_LABEL[location.price_level].label}</Text>
            </View>
          </View>
        ) : null}

        {/* Short description */}
        {location.short_description ? (
          <Text style={styles.shortDesc}>{location.short_description}</Text>
        ) : null}

        {/* Long description (expandable) */}
        {hasLongDesc && (
          <View style={styles.longDescWrap}>
            <Text
              style={styles.longDesc}
              numberOfLines={descExpanded ? undefined : LONG_DESC_LINES}
            >
              {location.long_description}
            </Text>
            <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} style={styles.expandBtn}>
              <Text style={styles.expandText}>
                {descExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* Accordion: Giờ mở cửa */}
        <AccordionSection title="Giờ mở cửa">
          <View style={styles.infoGrid}>
            {location.opening_hours ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mở cửa</Text>
                <Text style={styles.infoValue}>{location.opening_hours}</Text>
              </View>
            ) : null}
            {location.closing_hours ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Đóng cửa</Text>
                <Text style={styles.infoValue}>{location.closing_hours}</Text>
              </View>
            ) : null}
            {location.off_days ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày nghỉ</Text>
                <Text style={styles.infoValue}>{location.off_days}</Text>
              </View>
            ) : null}
          </View>
        </AccordionSection>

        <View style={styles.accordionDivider} />

        {/* Accordion: Liên hệ & Địa chỉ */}
        <AccordionSection title="Liên hệ & Địa chỉ">
          <View style={styles.infoGrid}>
            {location.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{location.address}</Text>
              </View>
            ) : null}
            {location.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điện thoại</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${location.phone}`)}>
                  <Text style={[styles.infoValue, styles.link]}>{location.phone}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </AccordionSection>
      </ScrollView>

      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.mapsBtn, !hasMapsUrl && styles.mapsBtnDisabled]}
          activeOpacity={hasMapsUrl ? 0.85 : 1}
          onPress={() => hasMapsUrl && Linking.openURL(location.google_maps_url!)}
        >
          <Ionicons name="map-outline" size={18} color={hasMapsUrl ? colors.nomad.onPrimary : colors.nomad.outline} />
          <Text style={[styles.mapsBtnText, !hasMapsUrl && styles.mapsBtnTextDisabled]}>
            Mở Google Maps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.nomad.background },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.nomad.background },
  notFound: { color: colors.nomad.onSurfaceVariant, fontSize: 15 },

  // Hero
  hero:    { height: 300, backgroundColor: colors.nomad.surfaceContainer },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Scroll
  scroll: { flex: 1 },

  // Badge row
  badgeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
  categoryBadge: { backgroundColor: colors.nomad.secondaryContainer, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, maxWidth: 200 },
  categoryText:  { fontSize: 12, fontWeight: '600', color: colors.nomad.onSurface },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:  { fontSize: 12, color: colors.nomad.primary, fontWeight: '600' },

  // Name + heart
  nameRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, gap: 12, marginBottom: 6 },
  name:     { flex: 1, fontSize: 24, fontWeight: '800', color: colors.nomad.onSurface, lineHeight: 32 },
  heartBtn: { paddingTop: 4, padding: 4 },

  // Subtitle
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginBottom: 14 },
  subtitle:    { fontSize: 13, color: colors.nomad.onSurfaceVariant },

  // Style tags
  tagsScroll: { paddingHorizontal: 20, marginBottom: 16 },
  tag:        { backgroundColor: colors.nomad.surfaceContainer, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  tagText:    { fontSize: 12, fontWeight: '500', color: colors.nomad.onSurfaceVariant },

  // Price badge
  priceBadgeRow:    { paddingHorizontal: 20, marginBottom: 20 },
  priceBadge:       { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.nomad.surfaceContainer, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  priceBadgeSymbol: { fontSize: 14, fontWeight: '800', color: colors.nomad.primary },
  priceBadgeLabel:  { fontSize: 13, color: colors.nomad.onSurfaceVariant },

  // Short description
  shortDesc: { fontSize: 15, color: colors.nomad.onSurface, lineHeight: 24, paddingHorizontal: 20, marginBottom: 16, fontWeight: '500' },

  // Long description
  longDescWrap: { paddingHorizontal: 20, marginBottom: 16 },
  longDesc:     { fontSize: 14, color: colors.nomad.onSurfaceVariant, lineHeight: 22 },
  expandBtn:    { marginTop: 8 },
  expandText:   { fontSize: 13, fontWeight: '600', color: colors.nomad.primary },

  // Dividers
  divider:         { height: 1, backgroundColor: colors.nomad.outlineVariant, marginHorizontal: 20, marginBottom: 4 },
  accordionDivider: { height: 1, backgroundColor: colors.nomad.outlineVariant, marginHorizontal: 20 },

  // Accordion
  accordion:       { paddingHorizontal: 20 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  accordionTitle:  { fontSize: 15, fontWeight: '600', color: colors.nomad.onSurface },
  accordionBody:   { paddingBottom: 16 },

  // Info grid inside accordion
  infoGrid: { gap: 10 },
  infoRow:  { flexDirection: 'row', gap: 12 },
  infoLabel: { width: 90, fontSize: 13, color: colors.nomad.onSurfaceVariant },
  infoValue: { flex: 1, fontSize: 13, color: colors.nomad.onSurface, lineHeight: 20 },
  link:      { color: colors.nomad.primary, textDecorationLine: 'underline' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.nomad.background,
    borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant,
    paddingHorizontal: 20, paddingTop: 12,
  },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.nomad.primary,
    borderRadius: 14, paddingVertical: 14,
  },
  mapsBtnDisabled:     { backgroundColor: colors.nomad.surfaceContainer },
  mapsBtnText:         { fontSize: 15, fontWeight: '700', color: colors.nomad.onPrimary },
  mapsBtnTextDisabled: { color: colors.nomad.outline },
});
