// @ts-nocheck
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BRAND = {
  navy: '#07103A',
  red: '#C8173A',
  gold: '#C9A84C',
  white: '#ffffff',
};

const PromoVideoBanner = ({ onPress }) => {
  const videoUrl = `${getApiBaseUrl()}/video/8477206-hd_1080_1920_24fps.mp4`;

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: ${BRAND.navy}; overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: cover; }
  </style>
</head>
<body>
  <video autoplay muted loop playsinline preload="metadata" src="${videoUrl}"></video>
</body>
</html>`,
    [videoUrl],
  );

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.videoHost} pointerEvents="none">
        <WebView
          source={{ html }}
          style={styles.webview}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          androidLayerType="hardware"
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
        />
        <View style={styles.videoTint} />
      </View>

      <View style={styles.foreground} pointerEvents="none">
        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>SPECIAL OFFER</Text>
          <Text style={styles.title}>Premium Frozen{'\n'}Selections</Text>
          <Text style={styles.sub}>Up to 20% off this week</Text>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Shop Now  →</Text>
          </View>
        </View>
        <View style={styles.iconBlock}>
          <Text style={styles.snowflake}>❄️</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 130,
    backgroundColor: BRAND.navy,
  },
  videoHost: {
    ...StyleSheet.absoluteFillObject,
  },
  webview: {
    flex: 1,
    backgroundColor: BRAND.navy,
    opacity: 0.95,
  },
  videoTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 16, 58, 0.45)',
  },
  foreground: {
    flexDirection: 'row',
    minHeight: 130,
    zIndex: 2,
  },
  textBlock: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: BRAND.gold,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 24,
    marginBottom: 6,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.red,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.white,
    letterSpacing: 0.5,
  },
  iconBlock: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snowflake: {
    fontSize: 52,
  },
});

export default PromoVideoBanner;
