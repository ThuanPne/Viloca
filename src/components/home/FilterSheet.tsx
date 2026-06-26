import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

export type FilterTab = 'category' | 'city' | 'style' | 'price';

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'category', label: 'Danh mục',   icon: 'grid-outline' },
  { key: 'city',     label: 'Thành phố',  icon: 'business-outline' },
  { key: 'style',    label: 'Không khí',  icon: 'sparkles-outline' },
  { key: 'price',    label: 'Mức giá',    icon: 'pricetag-outline' },
];

// Extracted from category column in DB
const CATEGORIES = [
  'Di tích', 'Kiến trúc', 'Nghệ thuật', 'Ẩm thực', 'Lịch sử',
  'Trải nghiệm', 'Tham quan', 'Văn hóa', 'Mua sắm', 'Check-in',
  'Workshop', 'Café', 'Du lịch cộng đồng', 'Trekking',
];

// Only cities with actual data in DB
const CITIES = [
  { code: 'HN', label: 'Hà Nội' },
  { code: 'SG', label: 'TP. HCM' },
  { code: 'DN', label: 'Đà Nẵng' },
];

// Extracted from style_tag column in DB (individual tags)
const STYLE_TAGS = [
  'Cổ kính', 'Hoài cổ', 'Lịch sử', 'Truyền thống', 'Dân gian',
  'Kiến trúc Pháp', 'Kiến trúc tối giản', 'Sang trọng', 'Lộng lẫy',
  'Nghệ thuật', 'Triển lãm', 'Biểu diễn', 'Đương đại',
  'Chụp ảnh', 'Check-in',
  'Yên tĩnh', 'Yên bình', 'Thư giãn', 'Sâu lắng',
  'Nhộn nhịp', 'Đông đúc',
  'Giáo dục', 'Bảo tàng',
  'Làng nghề', 'Thủ công', 'Bền vững',
  'Thiên nhiên', 'Nghỉ dưỡng', 'Bản địa',
];

// Matches price_level column values
const PRICE_LEVELS = [
  { value: 1, label: '₫   Miễn phí – 80k' },
  { value: 2, label: '₫₫   80k – 250k' },
  { value: 3, label: '₫₫₫   250k – 600k' },
  { value: 4, label: '₫₫₫₄   600k+' },
];

function ChipGrid({ items, selected, onSelect }: {
  items: string[]; selected: string[]; onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <TouchableOpacity
            key={item}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface Props {
  visible: boolean;
  initialTab?: FilterTab;
  onClose: () => void;
}

export function FilterSheet({ visible, initialTab = 'category', onClose }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [selected, setSelected]   = useState<string[]>([]);

  function toggle(val: string) {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Lọc địa điểm</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.nomad.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any} size={14}
                color={activeTab === tab.key ? '#fff' : colors.nomad.onSurfaceVariant}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Options */}
        <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
          {activeTab === 'category' && (
            <ChipGrid items={CATEGORIES} selected={selected} onSelect={toggle} />
          )}
          {activeTab === 'city' && (
            <View style={styles.grid}>
              {CITIES.map((c) => {
                const active = selected.includes(c.code);
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(c.code)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {activeTab === 'style' && (
            <ChipGrid items={STYLE_TAGS} selected={selected} onSelect={toggle} />
          )}
          {activeTab === 'price' && (
            <View style={styles.priceList}>
              {PRICE_LEVELS.map((p) => {
                const key = String(p.value);
                const active = selected.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.priceRow, active && styles.priceRowActive]}
                    onPress={() => toggle(key)}
                  >
                    <Text style={[styles.priceLabel, active && styles.priceLabelActive]}>
                      {p.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={16} color={colors.nomad.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {selected.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSelected([])}>
              <Text style={styles.clearText}>Xóa ({selected.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.nomad.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40, maxHeight: '75%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.nomad.outlineVariant,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.nomad.onSurface },

  tabScroll: { marginBottom: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: colors.nomad.surfaceContainer,
  },
  tabActive:     { backgroundColor: colors.nomad.primary },
  tabText:       { fontSize: 12, fontWeight: '500', color: colors.nomad.onSurfaceVariant },
  tabTextActive: { color: '#fff' },

  optionsScroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: colors.nomad.surfaceContainer,
  },
  chipActive:     { backgroundColor: colors.nomad.onPrimaryContainer },
  chipText:       { fontSize: 13, color: colors.nomad.onSurfaceVariant },
  chipTextActive: { color: colors.nomad.primary, fontWeight: '600' },

  priceList: { gap: 8 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: colors.nomad.surfaceContainer,
  },
  priceRowActive:  { backgroundColor: colors.nomad.onPrimaryContainer },
  priceLabel:      { fontSize: 14, color: colors.nomad.onSurfaceVariant },
  priceLabelActive: { color: colors.nomad.primary, fontWeight: '600' },

  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  clearBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.nomad.outline, alignItems: 'center',
  },
  clearText: { fontSize: 14, color: colors.nomad.onSurface, fontWeight: '600' },
  applyBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 10,
    backgroundColor: colors.nomad.primary, alignItems: 'center',
  },
  applyText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
