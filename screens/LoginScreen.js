import React, { useState } from 'react';
import { Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, HStack, VStack, Text, Button, ButtonText,
  Input, InputField, FormControl, FormControlLabel,
  FormControlLabelText, Checkbox, CheckboxIndicator,
  CheckboxIcon, CheckboxLabel, CheckIcon,
  ScrollView, Pressable,
  FormControlError, FormControlErrorText,
  ArrowLeftIcon, EyeIcon, EyeOffIcon
} from '@gluestack-ui/themed';
import API_ROUTES from '../api';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ onBack, onRegister, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'El correo no es válido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          correo: email,
          contrasena: password
        }).toString()
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setLoading(false);
          onLogin?.();
        }, 1200);
      } else {
        let errorMsg = 'Usuario no registrado o correo/contraseña incorrectos';
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail && errorData.detail[0]?.msg) {
            errorMsg = errorData.detail[0].msg;
          }
        } catch (e) {
          // Si no se puede parsear el error, se usa el mensaje por defecto
        }
        setLoading(false);
        Alert.alert('Error', errorMsg, [{ text: 'Aceptar' }]);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Error de conexión con el servidor');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      {/* StatusBar y fondo debajo */}
      <StatusBar style="dark" translucent />
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={Platform.OS === 'android' ? 24 : 44}
        bg="$white"
        zIndex={1}
      />

      {/* Modal de carga */}
      <Modal isVisible={loading || success} backdropOpacity={0.3}>
        <Box
          bg="$white"
          p="$8"
          borderRadius={20}
          alignItems="center"
          justifyContent="center"
        >
          {success ? (
            <>
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              <Text fontSize="$lg" color="$green700" mt="$4">¡Ingreso exitoso!</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#e11d48" />
              <Text fontSize="$lg" color="$red600" mt="$4">Ingresando...</Text>
            </>
          )}
        </Box>
      </Modal>

      {/* Header */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        px="$6"
        py="$4"
        borderBottomWidth="$1"
        borderBottomColor="$coolGray100"
        bg="$white"
      >
        <Pressable onPress={onBack} p="$2">
          <ArrowLeftIcon size="xl" color="$black" />
        </Pressable>
        <Text fontSize="$2xl" fontWeight="$bold" color="$black">
          Lana App
        </Text>
        <Box w="$10" />
      </HStack>

      {/* Contenido centrado y con más aire */}
      <ScrollView
        flex={1}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Box w="100%" style={{ maxWidth: 520, alignSelf: 'center' }}>
          <VStack space="$8" mb="$4" alignItems="center">
            <Text fontSize="$4xl" fontWeight="$bold" color="$black" textAlign="center">
              Inicia sesión
            </Text>
            <VStack space="$2" alignItems="center">
              <Text fontSize="$md" color="$coolGray600">¿No tienes una cuenta?</Text>
              <Pressable onPress={onRegister}>
                <Text fontSize="$md" color="$blue600" fontWeight="$semibold">
                  Regístrate aquí
                </Text>
              </Pressable>
            </VStack>
          </VStack>

          <VStack space="$6">
            {/* Correo */}
            <FormControl isInvalid={!!errors.email}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">
                  Correo
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.email ? "$red500" : "$coolGray300"}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{
                  borderColor: errors.email ? "$red500" : "$red600",
                  borderWidth: "$2",
                }}
              >
                <InputField
                  placeholder="abc@gmail.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
              </Input>
              {errors.email && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">
                    {errors.email}
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Contraseña */}
            <FormControl isInvalid={!!errors.password}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">
                  Contraseña
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.password ? "$red500" : "$coolGray300"}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{
                  borderColor: errors.password ? "$red500" : "$red600",
                  borderWidth: "$2",
                }}
              >
                <InputField
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
                <Pressable onPress={() => setShowPassword((s) => !s)} p="$3" mr="$2">
                  {showPassword ? (
                    <EyeOffIcon size="md" color="$coolGray400" />
                  ) : (
                    <EyeIcon size="md" color="$coolGray400" />
                  )}
                </Pressable>
              </Input>
              {errors.password && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">
                    {errors.password}
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Recordarme / Olvido */}
            <HStack justifyContent="space-between" alignItems="center" mt="$2">
              <HStack space="$2" alignItems="center">
                <Checkbox
                  value="remember"
                  isChecked={remember}
                  onChange={setRemember}
                  size="md"
                >
                  <CheckboxIndicator
                    borderColor="$red600"
                    $checked={{ bg: "$red600", borderColor: "$red600" }}
                  >
                    <CheckboxIcon as={CheckIcon} color="$white" />
                  </CheckboxIndicator>
                  <CheckboxLabel ml="$2">
                    <Text fontSize="$md" color="$black" fontWeight="$medium">Recordarme</Text>
                  </CheckboxLabel>
                </Checkbox>
              </HStack>
              <Pressable>
                <Text fontSize="$md" color="$blue600" fontWeight="$semibold">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </HStack>

            {/* Botón principal */}
            <Button
              bg={loading ? "$red800" : "$red600"}
              borderRadius="$xl"
              size="xl"
              mt="$6"
              shadowColor="$red600"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.25}
              shadowRadius={10}
              elevation={6}
              onPress={handleSubmit}
              isDisabled={loading}
            >
              <ButtonText fontSize="$lg" fontWeight="$bold" color="$white">
                Ingresar
              </ButtonText>
            </Button>

            {errors.api && (
              <FormControlError mt="$2">
                <FormControlErrorText color="$red500" fontSize="$sm">
                  {errors.api}
                </FormControlErrorText>
              </FormControlError>
            )}

            {/* Divider + Google */}
            <HStack alignItems="center" mt="$10" mb="$6">
              <Box flex={1} h="$0.5" bg="$coolGray300" />
              <Text fontSize="$xs" color="$coolGray500" fontWeight="$medium" px="$4" letterSpacing="$lg">
                O CONTINÚA CON
              </Text>
              <Box flex={1} h="$0.5" bg="$coolGray300" />
            </HStack>

            <Button
              variant="outline"
              borderWidth="$1"
              borderColor="$coolGray300"
              borderRadius="$xl"
              size="xl"
              bg="$white"
              $pressed={{ bg: "$coolGray50", borderColor: "$coolGray400" }}
            >
              <HStack space="$3" alignItems="center">
                <Text fontSize="$xl" fontWeight="$bold" color="$red500">G</Text>
                <ButtonText color="$black" fontSize="$md" fontWeight="$semibold">
                  Continúa con Google
                </ButtonText>
              </HStack>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
