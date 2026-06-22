import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const padding: Record<Size, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8,  paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
};

const fontSize: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    padding[size],
    variant === 'primary' && { backgroundColor: isDisabled ? colors.primary400 : colors.primary600 },
    variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary600 },
    variant === 'ghost'   && {},
    style as ViewStyle,
  ];

  const textColor =
    variant === 'primary' ? colors.textOnDark :
    variant === 'outline' ? colors.primary600 :
    colors.primary600;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? colors.textOnDark : colors.primary600} />
        : <Text style={[styles.label, { fontSize: fontSize[size], color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:  { borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600' },
});
