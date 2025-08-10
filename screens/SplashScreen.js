import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Box, Center, Image
} from '@gluestack-ui/themed';

export default function SplashScreen() {
  return (
    <Box flex={1} bg="$white">
      <StatusBar style="dark" />
      <Center flex={1}>
        <Image 
          source={require('../assets/logo.png')}
          alt="Lana App Logo"
          w="$32"
          h="$32"
          resizeMode="contain"
        />
      </Center>
    </Box>
  );
}