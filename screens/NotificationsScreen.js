import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box, VStack, HStack, Text, Icon, Pressable, Spinner
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getPagosProximos } from '../api';

// Calcula la próxima fecha (dd/mm/yyyy) dado un día del mes (1–31)
function computeNextDate(day) {
  const n = Math.min(Math.max(1, parseInt(String(day), 10) || 1), 31);
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), n);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today) next = new Date(now.getFullYear(), now.getMonth() + 1, n);
  const dd = String(next.getDate()).padStart(2, '0');
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const yyyy = next.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function NotificationsScreen({
  token,
  onBack = () => {},
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // pagos próximos
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPagosProximos(token);
      // Filtra SOLO pagos con dias_restantes <= 3 (3 días de anticipación)
      const proximos = Array.isArray(data?.proximos_pagos) ? data.proximos_pagos : [];
      const filtered = proximos
        .filter(p => Number(p.dias_restantes ?? 999) <= 3)
        .map(p => ({
          id: p.id,
          nombre: p.nombre,
          monto: Number(p.monto || 0),
          dia_pago: Number(p.dia_pago || 1),
          dias_restantes: Number(p.dias_restantes ?? 0),
          urgente: Boolean(p.urgente) || Number(p.dias_restantes ?? 99) <= 1,
          fecha_str: computeNextDate(p.dia_pago),
        }));
      setItems(filtered);
    } catch (e) {
      setItems([]);
      setError('No se pudieron cargar las notificaciones de pagos próximos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const totalEn3Dias = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.monto || 0), 0),
    [items]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Box flex={1} bg="$white">
        {/* Header */}
        <HStack
          px="$6"
          py="$4"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$coolGray100"
        >
          <Pressable
            onPress={onBack}
            rounded="$full"
            p="$2"
            bg="$coolGray100"
          >
            <Icon as={MaterialIcons} name="chevron-left" size={24} color="$black" />
          </Pressable>

          <Text fontSize="$xl" fontWeight="$bold" color="$black">
            Notificaciones
          </Text>

          {/* botón “refresh” simple */}
          <Pressable
            onPress={loadData}
            rounded="$full"
            p="$2"
            bg="$coolGray100"
          >
            <Icon as={MaterialIcons} name="refresh" size={22} color="$black" />
          </Pressable>
        </HStack>

        <VStack px="$6" py="$4" space="$4">
          {loading ? (
            <HStack alignItems="center" space="$2">
              <Spinner />
              <Text color="$coolGray600">Cargando…</Text>
            </HStack>
          ) : error ? (
            <Box
              bg="$red100"
              borderRadius="$xl"
              p="$4"
              borderWidth={1}
              borderColor="$red300"
            >
              <HStack alignItems="center" space="$3">
                <Icon as={MaterialIcons} name="error-outline" size={24} color="$red700" />
                <Text color="$red800">{error}</Text>
              </HStack>
            </Box>
          ) : items.length === 0 ? (
            <Box
              bg="$coolGray100"
              borderRadius="$xl"
              p="$4"
              borderWidth={1}
              borderColor="$coolGray200"
            >
              <HStack alignItems="center" space="$3">
                <Icon as={MaterialIcons} name="notifications-none" size={24} color="$coolGray700" />
                <Text color="$coolGray800">
                  No tienes pagos en los próximos 3 días.
                </Text>
              </HStack>
            </Box>
          ) : (
            <>
              {/* Resumen */}
              <Box
                bg="$coolGray100"
                borderRadius="$xl"
                p="$4"
                borderWidth={1}
                borderColor="$coolGray200"
              >
                <HStack alignItems="center" space="$3">
                  <Icon as={MaterialIcons} name="campaign" size={24} color="$black" />
                  <VStack>
                    <Text fontWeight="$bold" color="$black">
                      Pagos en los próximos 3 días: {items.length}
                    </Text>
                    <Text color="$coolGray700">
                      Monto total: MXN {totalEn3Dias.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Cards por pago */}
              {items.map((pago) => {
                const isUrgent = pago.urgente || pago.dias_restantes <= 1;
                const bg = isUrgent ? '$red100' : '$yellow100';
                const bdr = isUrgent ? '$red300' : '$yellow300';
                const ico = isUrgent ? 'notification-important' : 'notifications-active';
                const txt = isUrgent ? '$red900' : '$yellow900';
                const title = isUrgent ? '¡Pago urgente!' : '¡Próximo pago cercano!';

                return (
                  <Box
                    key={pago.id}
                    bg={bg}
                    borderRadius="$xl"
                    p="$4"
                    borderWidth={1}
                    borderColor={bdr}
                    style={{
                      shadowColor: '#000',
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 2,
                    }}
                  >
                    <HStack alignItems="center" space="$3">
                      <Icon as={MaterialIcons} name={ico} size={28} color={isUrgent ? '$red700' : '$yellow700'} />
                      <VStack flex={1}>
                        <Text fontWeight="$bold" color={txt} fontSize="$md" mb="$1">
                          {title}
                        </Text>
                        <Text color={txt}>
                          {pago.nombre} · MXN {Number(pago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text color={txt}>
                          {pago.dias_restantes <= 0
                            ? `Vence hoy (${pago.fecha_str}).`
                            : `Vence en ${pago.dias_restantes} ${pago.dias_restantes === 1 ? 'día' : 'días'} (${pago.fecha_str}).`}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </>
          )}
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
