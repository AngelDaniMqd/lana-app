import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Animated, Pressable } from 'react-native';
import { Box, HStack, VStack, Text, Button, ButtonText } from '@gluestack-ui/themed';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    title: 'Toma el control de tu dinero hoy mismo',
    description:
      'Registra tus ingresos y egresos fácilmente, clasifícalos por categoría y mantén el control total de tus finanzas.',
    image: require('../assets/onboarding1.png'),
  },
  {
    title: 'Mantente dentro de tu presupuesto sin esfuerzo',
    description:
      'Define presupuestos mensuales por categoría y recibe alertas antes de pasarte. Sin sorpresas a fin de mes.',
    image: require('../assets/onboarding2.png'),
  },
  {
    title: 'Deja que Lana App trabaje por ti',
    description:
      'Recibe recordatorios para pagos fijos y avisos cuando tu presupuesto esté en riesgo. Todo por SMS o correo electrónico.',
    image: require('../assets/onboarding3.png'),
  },
];

export default function OnboardingScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const insets = useSafeAreaInsets();

  // Escala animada para zoom
  const scale = useRef(new Animated.Value(1.1)).current;
  const [tappedZoom, setTappedZoom] = useState(false);

  useEffect(() => {
    // Cada que cambie el slide, resetea y anima un zoom suave
    setTappedZoom(false);
    scale.setValue(1.1);
    Animated.timing(scale, {
      toValue: 1.22,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const toggleZoom = () => {
    const to = tappedZoom ? 1.22 : 1.35;
    setTappedZoom(!tappedZoom);
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Zona visual superior con imagen grande que rebasa bordes */}
      <Box
        flex={1}
        alignItems="center"
        justifyContent="flex-start"
        // más alto para que luzca la imagen
        pt={16}
      >
        <Box
          w="100%"
          // ~55% de alto de pantalla para imagen protagonista
          h={SCREEN_HEIGHT * 0.55}
          borderRadius="$2xl"
          // Dejamos visible para que la imagen “rebose” el borde
          overflow="visible"
          alignItems="center"
          justifyContent="center"
        >
          <Pressable onPress={toggleZoom} style={{ width: '100%', height: '100%' }}>
            <Animated.Image
              source={slide.image}
              // ALT no aplica en nativo, pero lo dejamos por claridad
              accessible
              accessibilityLabel={`Ilustración ${index + 1}`}
              style={{
                position: 'absolute',
                // Más grande que el contenedor para que sobresalga
                width: SCREEN_WIDTH * 1.25,
                height: SCREEN_HEIGHT * 0.60,
                // Centro visual
                left: -(SCREEN_WIDTH * 0.125),
                top: -(SCREEN_HEIGHT * 0.03),
                transform: [{ scale }],
                borderRadius: 24,
              }}
              resizeMode="cover"
            />
          </Pressable>
        </Box>
      </Box>

      {/* Panel inferior fijo */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        px={24}
        pb={insets.bottom + 24}
        pt={20}
        bg="$white"
        borderTopLeftRadius="$2xl"
        borderTopRightRadius="$2xl"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: -2 }}
        shadowOpacity={0.06}
        shadowRadius={8}
        elevation={8}
      >
        <HStack justifyContent="center" space="$1" alignItems="center" mb="$4">
          {slides.map((_, i) => (
            <Box
              key={i}
              w={8}
              h={8}
              borderRadius={999}
              bg={i === index ? '$red600' : '$coolGray300'}
              mx={2}
            />
          ))}
        </HStack>

        <VStack space="$4" alignItems="center">
          <Text fontSize={24} fontWeight="$bold" color="$black" textAlign="center">
            {slide.title}
          </Text>
          <Text fontSize={16} color="$coolGray600" lineHeight={24} textAlign="center">
            {slide.description}
          </Text>
        </VStack>

        <Button
          bg="$red600"
          borderRadius="$xl"
          h={56}
          mt={32}
          onPress={() => {
            if (index < slides.length - 1) {
              setIndex((i) => i + 1);
            } else {
              onDone?.();
            }
          }}
        >
          <ButtonText fontSize={18} fontWeight="$semibold" color="$white">
            {index < slides.length - 1 ? 'Siguiente' : 'Comenzar'}
          </ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
