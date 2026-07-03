import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DOW = ['CN','T2','T3','T4','T5','T6','T7'];

interface Props {
  value: string;           // 'yyyy-mm-dd' hoặc ''
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: Date;
}

function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function displayLabel(s: string) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function DatePicker({ value, onChange, placeholder = 'Chọn ngày', minDate }: Props) {
  const today = new Date();
  const selected = parseISO(value);
  const [visible, setVisible] = useState(false);
  const [cursor, setCursor] = useState<Date>(() => selected ?? today);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected  = (d: number) => !!selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;
  const isToday     = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const isDisabled  = (d: number) => !!minDate && new Date(year, month, d) < minDate;

  function pick(day: number) {
    if (isDisabled(day)) return;
    onChange(toISO(year, month, day));
    setVisible(false);
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? displayLabel(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.card} onStartShouldSetResponder={() => true}>
            {/* Month nav */}
            <View style={styles.nav}>
              <TouchableOpacity onPress={() => setCursor(new Date(year, month - 1, 1))} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.navTitle}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={() => setCursor(new Date(year, month + 1, 1))} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Day-of-week header */}
            <View style={styles.dowRow}>
              {DOW.map(d => <Text key={d} style={styles.dowText}>{d}</Text>)}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.cell,
                    day && isSelected(day) ? styles.cellSelected : undefined,
                    day && isToday(day) && !isSelected(day) ? styles.cellToday : undefined,
                  ]}
                  onPress={() => day && pick(day)}
                  disabled={!day}
                  activeOpacity={0.7}
                >
                  {day ? (
                    <Text style={[
                      styles.cellText,
                      isSelected(day) ? styles.cellTextSel : undefined,
                      isDisabled(day) ? styles.cellTextDis : undefined,
                    ]}>
                      {day}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  trigger:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.bgCard },
  triggerText:  { flex: 1, fontSize: 15, color: colors.textPrimary },
  placeholder:  { color: colors.textMuted },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  card:         { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg, width: 320 },
  nav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  navBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  dowRow:       { flexDirection: 'row', marginBottom: spacing.sm },
  dowText:      { width: CELL, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textMuted },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  cell:         { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: CELL / 2 },
  cellSelected: { backgroundColor: colors.primary600 },
  cellToday:    { borderWidth: 1.5, borderColor: colors.primary600 },
  cellText:     { fontSize: 14, color: colors.textPrimary },
  cellTextSel:  { color: colors.textOnDark, fontWeight: '600' },
  cellTextDis:  { color: colors.border },
});
