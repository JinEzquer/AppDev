// @ts-nocheck
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../utils';

/** Outline icons built with Views (no emoji, no icon font). */

export function HomeIcon({ color = COLORS.navy2, size = 24 }) {
  const s = size;
  return (
    <View style={[ico.box, { width: s, height: s }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.42,
          borderRightWidth: s * 0.42,
          borderBottomWidth: s * 0.32,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.58,
          height: s * 0.38,
          borderWidth: 2,
          borderColor: color,
          borderTopWidth: 0,
          marginTop: -1,
        }}
      />
    </View>
  );
}

export function HeartIcon({ color = COLORS.textMuted, size = 22, filled = false }) {
  const s = size;
  const c = filled ? COLORS.red : color;
  return (
    <View style={[ico.box, { width: s, height: s * 0.9 }]}>
      <View
        style={[
          ico.heartLobe,
          {
            width: s * 0.36,
            height: s * 0.36,
            left: s * 0.12,
            top: s * 0.08,
            borderColor: c,
            backgroundColor: filled ? c : 'transparent',
          },
        ]}
      />
      <View
        style={[
          ico.heartLobe,
          {
            width: s * 0.36,
            height: s * 0.36,
            right: s * 0.12,
            top: s * 0.08,
            borderColor: c,
            backgroundColor: filled ? c : 'transparent',
          },
        ]}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.22,
          borderRightWidth: s * 0.22,
          borderTopWidth: s * 0.28,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: filled ? c : 'transparent',
          marginTop: s * 0.22,
        }}
      />
      {!filled ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: s * 0.44,
            height: 2,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      ) : null}
    </View>
  );
}

export function CartIcon({ color = COLORS.textMuted, size = 24 }) {
  const s = size;
  return (
    <View style={[ico.box, { width: s, height: s + 4 }]}>
      <View style={{ flexDirection: 'row', width: s * 0.5, justifyContent: 'space-between', marginBottom: 1 }}>
        <View style={[ico.handleLeg, { backgroundColor: color, height: s * 0.22 }]} />
        <View style={[ico.handleLeg, { backgroundColor: color, height: s * 0.22 }]} />
      </View>
      <View
        style={{
          width: s * 0.62,
          height: s * 0.48,
          borderWidth: 2,
          borderColor: color,
          borderTopWidth: 2,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      <View style={ico.wheels}>
        <View style={[ico.wheel, { backgroundColor: color }]} />
        <View style={[ico.wheel, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProfileIcon({ color = COLORS.textMuted, size = 24 }) {
  const s = size;
  return (
    <View style={[ico.box, { width: s, height: s }]}>
      <View
        style={{
          width: s * 0.38,
          height: s * 0.38,
          borderRadius: s * 0.19,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.72,
          height: s * 0.38,
          borderWidth: 2,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: s * 0.36,
          borderBottomRightRadius: s * 0.36,
          marginTop: 2,
        }}
      />
    </View>
  );
}

const ico = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  heartLobe: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  handleLeg: { width: 2, borderRadius: 1 },
  wheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 2,
  },
  wheel: { width: 4, height: 4, borderRadius: 2 },
});
