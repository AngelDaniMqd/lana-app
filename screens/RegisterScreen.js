import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, HStack, VStack, Text, Button, ButtonText,
  Input, InputField, FormControl, FormControlLabel,
  FormControlLabelText, ScrollView, Pressable,
  FormControlError, FormControlErrorText,
  ArrowLeftIcon, EyeIcon, EyeOffIcon
} from '@gluestack-ui/themed';

export default function RegisterScreen({ onBack, onLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!lastName.trim())  newErrors.lastName  = 'Los apellidos son requeridos';
    if (!email.trim()) newErrors.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'El correo no es válido';
    if (!phone.trim()) newErrors.phone = 'El teléfono es requerido';
    else if (!/^\+?[\d\s-]{10,}$/.test(phone)) newErrors.phone = 'El teléfono no es válido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // aquí iría tu lógica real
      onLogin?.();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header fijo */}
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
        <Text fontSize="$2xl" fontWeight="$bold" color="$black">Lana App</Text>
        <Box w="$10" />
      </HStack>

      {/* Contenido centrado con más aire */}
      <ScrollView
        flex={1}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Box w="100%" style={{ maxWidth: 520, alignSelf: 'center' }}>
          <VStack space="$8" mb="$4" alignItems="center">
            <Text fontSize="$4xl" fontWeight="$bold" color="$black" textAlign="center">
              Registro
            </Text>
            <VStack space="$2" alignItems="center">
              <Text fontSize="$md" color="$coolGray600">¿Ya tienes una cuenta?</Text>
              <Pressable onPress={onLogin}>
                <Text fontSize="$md" color="$blue600" fontWeight="$semibold">Inicia sesión aquí</Text>
              </Pressable>
            </VStack>
          </VStack>

          <VStack space="$6">
            {/* Nombre */}
            <FormControl isInvalid={!!errors.firstName}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">
                  Nombre/s
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.firstName ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.firstName ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="Ingresa tu nombre"
                  value={firstName}
                  onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors({ ...errors, firstName: null }); }}
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
              </Input>
              {errors.firstName && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.firstName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Apellidos */}
            <FormControl isInvalid={!!errors.lastName}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">
                  Apellidos
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.lastName ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.lastName ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="Ingresa tus apellidos"
                  value={lastName}
                  onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors({ ...errors, lastName: null }); }}
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
              </Input>
              {errors.lastName && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.lastName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Correo */}
            <FormControl isInvalid={!!errors.email}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">Correo</FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.email ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.email ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="abc@gmail.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
              </Input>
              {errors.email && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.email}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Teléfono */}
            <FormControl isInvalid={!!errors.phone}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">Teléfono</FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.phone ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.phone ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="+52"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors({ ...errors, phone: null }); }}
                  keyboardType="phone-pad"
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
              </Input>
              {errors.phone && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.phone}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Contraseña */}
            <FormControl isInvalid={!!errors.password}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">Contraseña</FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.password ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.password ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: null }); }}
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
                <Pressable onPress={() => setShowPassword((s) => !s)} p="$3" mr="$2">
                  {showPassword ? <EyeOffIcon size="md" color="$coolGray400" /> : <EyeIcon size="md" color="$coolGray400" />}
                </Pressable>
              </Input>
              {errors.password && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.password}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Confirmar contraseña */}
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormControlLabel mb="$2">
                <FormControlLabelText fontSize="$md" fontWeight="$semibold" color="$black">
                  Confirma contraseña
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                size="xl"
                variant="outline"
                borderColor={errors.confirmPassword ? '$red500' : '$coolGray300'}
                borderWidth="$1"
                borderRadius="$lg"
                bg="$white"
                $focus={{ borderColor: errors.confirmPassword ? '$red500' : '$red600', borderWidth: '$2' }}
              >
                <InputField
                  placeholder="Confirma tu contraseña"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null }); }}
                  fontSize="$md"
                  px="$4"
                  color="$black"
                />
                <Pressable onPress={() => setShowConfirmPassword((s) => !s)} p="$3" mr="$2">
                  {showConfirmPassword ? <EyeOffIcon size="md" color="$coolGray400" /> : <EyeIcon size="md" color="$coolGray400" />}
                </Pressable>
              </Input>
              {errors.confirmPassword && (
                <FormControlError mt="$1">
                  <FormControlErrorText color="$red500" fontSize="$sm">{errors.confirmPassword}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Botón */}
            <Button
              bg="$red600"
              borderRadius="$xl"
              size="xl"
              mt="$6"
              shadowColor="$red600"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.25}
              shadowRadius={10}
              elevation={6}
              onPress={handleSubmit}
            >
              <ButtonText fontSize="$lg" fontWeight="$bold" color="$white">
                Registrarse
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
