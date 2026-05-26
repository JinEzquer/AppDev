// @ts-nocheck
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { COLORS } from '../utils';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
/** Cart tab center (4 tabs, index 2). */
const CART_TARGET = { x: SCREEN_W * 0.625 - 14, y: SCREEN_H - 88 };

const CartFlyContext = createContext(null);

export function CartFlyProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const flyToCart = useCallback(({ x, y }) => {
    position.setValue({ x: x - 14, y: y - 14 });
    scale.setValue(1);
    opacity.setValue(1);
    setVisible(true);

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: CART_TARGET.x, y: CART_TARGET.y },
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.2,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(380),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        opacity.setValue(0);
        scale.setValue(1);
      }
    });
  }, [opacity, position, scale]);

  return (
    <CartFlyContext.Provider value={{ flyToCart }}>
      {children}
      {visible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            flyStyles.dot,
            {
              opacity,
              transform: [
                ...position.getTranslateTransform(),
                { scale },
              ],
            },
          ]}
        />
      ) : null}
    </CartFlyContext.Provider>
  );
}

export function useCartFly() {
  const ctx = useContext(CartFlyContext);
  return ctx ?? { flyToCart: () => {} };
}

const flyStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    borderWidth: 3,
    borderColor: COLORS.white,
    zIndex: 9999,
    elevation: 20,
  },
});
