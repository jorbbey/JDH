/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
  Grid,
  Badge,
} from '@chakra-ui/react';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  FileText,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';
import { orderService, DetailedOrder } from '../services/orders';

interface OrderConfirmationProps {
  orderId: string;
  totalAmount: number;
  onNavigateTracking: () => void;
  onNavigateHome: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  totalAmount,
  onNavigateTracking,
  onNavigateHome,
}) => {
  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await orderService.getOrderById(orderId);
        if (data) {
          setOrder(data);
        }
      } catch (e) {
        console.error('Failed to load order for success screen:', e);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Derive codes
  const displayPickupCode = order?.pickup_code_direct || `ML-${orderId.slice(0, 5).toUpperCase()}`;

  // Direct Pickup Guidelines matching co-op schedules
  const pickupLocation = 'JDH Central Kitchen Hub, Student Union Building (SUB) Basement Wing A, Campus';
  const pickupTime = '1:00 PM - 5:00 PM';
  const pickupDate = 'Next Thursday / Sunday (Subject to order pooling confirmation)';

  return (
    <Box minH="95vh" bg="#FAFAF7" py={6} display="flex" alignItems="center">
      <Container maxW="90%">
        <Box bg="white" p={{ base: 6, md: 10 }} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="xl" align="center">
          
          {/* Animated Success Badge */}
          <Box p={4} bg="#FFF8F0" borderRadius="full" w="fit-content" mb={6}>
            <CheckCircle size={44} color="#C65D3A" className="animate-pulse" />
          </Box>

          <Heading as="h1" size="2xl" fontWeight="black" color="black" mb={2} letterSpacing="tight">
            Order Securely Placed!
          </Heading>
          
          <Badge bg="emerald.50" color="emerald.700" px={3} py={1} borderRadius="lg" fontSize="10.5px" fontWeight="bold" mb={6}>
            STATUS: PAYMENT UNDER VERIFICATION
          </Badge>

          <Text fontSize="xs" color="gray.600" mb={8} lineHeight="relaxed" maxW="xl">
            Thank you for dining with <strong>JDH Kitchen Cooperative</strong>. Your pre-order is registered successfully. All orders are compiled for collection from our central hub.
          </Text>

          {/* Core Collection Pass Panel Section */}
          <Box bg="#FFF8F0" p={6} borderRadius="3xl" borderWidth="1.5px" borderColor="#C65D3A" mb={8} textAlign="left">
            <VStack spaceY={4} align="stretch">
              <HStack spaceX={2.5}>
                <Lock size={16} color="#C65D3A" />
                <Heading as="h4" size="xs" fontWeight="black" color="#C65D3A" textTransform="uppercase" letterSpacing="wide">
                  Your Secured Collection Pass
                </Heading>
              </HStack>

              <Grid templateColumns={{ base: '1fr', md: '1.2fr 0.8fr' }} gap={6} pt={2} alignItems="center">
                <VStack align="stretch" spaceY={3.5}>
                  <HStack spaceX={3} align="flex-start">
                    <MapPin size={16} color="black" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <VStack align="flex-start" spaceY={0}>
                      <Text fontSize="9px" color="gray.450" fontWeight="bold">PICKUP LOCATION</Text>
                      <Text fontSize="xs" fontWeight="bold" color="black">{pickupLocation}</Text>
                    </VStack>
                  </HStack>

                  <HStack spaceX={3} align="flex-start">
                    <Calendar size={16} color="black" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <VStack align="flex-start" spaceY={0}>
                      <Text fontSize="9px" color="gray.450" fontWeight="bold">PICKUP DATE</Text>
                      <Text fontSize="xs" fontWeight="bold" color="black">{pickupDate}</Text>
                    </VStack>
                  </HStack>

                  <HStack spaceX={3} align="flex-start">
                    <Clock size={16} color="black" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <VStack align="flex-start" spaceY={0}>
                      <Text fontSize="9px" color="gray.450" fontWeight="bold">PICKUP TIME WINDOW</Text>
                      <Text fontSize="xs" fontWeight="bold" color="black">{pickupTime}</Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Pickup Code Display */}
                <Box bg="white" p={4.5} borderRadius="2xl" borderWidth="1.5px" borderColor="#C65D3A" align="center" shadow="sm">
                  <Text fontSize="8.5px" color="gray.400" fontWeight="bold" letterSpacing="wider">PICKUP CODE</Text>
                  <Text fontSize="3xl" fontWeight="black" color="#C65D3A" my={1.5}>
                    {displayPickupCode}
                  </Text>
                  <Text fontSize="9.5px" color="gray.600" fontWeight="bold" lineHeight="short">
                    Save this code. You will need it to collect your order.
                  </Text>
                </Box>
              </Grid>
            </VStack>
          </Box>

          {/* Checkout Totals Summary */}
          <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" mb={8} w="full">
            <VStack spaceY={2.5} align="stretch" fontSize="xs">
              <Flex justify="space-between" pb={2} borderBottomWidth="1px" borderColor="gray.100">
                <Text color="gray.400" fontWeight="bold">ORDER ID</Text>
                <Text color="black" fontWeight="mono" fontSize="11px">#{orderId.toUpperCase()}</Text>
              </Flex>
              <Flex justify="space-between" pt={1}>
                <Text color="gray.450" fontWeight="bold">SETTLED VALUE</Text>
                <Text color="#C65D3A" fontWeight="extrabold" fontSize="md">₦{totalAmount.toLocaleString()}</Text>
              </Flex>
            </VStack>
          </Box>

          {/* Quick Primary Actions */}
          <VStack align="stretch" spaceY={3}>
            {/* Urgent WhatsApp Hyperlink */}
            <Button
              as="a"
              href="https://chat.whatsapp.com/mock-jdh-kitchen-coop"
              target="_blank"
              rel="noopener noreferrer"
              bg="#25D366"
              _hover={{ bg: '#20BA5A' }}
              color="white"
              size="md"
              borderRadius="2xl"
              fontWeight="bold"
            >
              <MessageSquare size={16} style={{ marginRight: '8px' }} />
              Join Co-Op Dispatches WhatsApp
            </Button>

            <Grid templateColumns="1fr 1fr" gap={3}>
              <Button
                onClick={onNavigateTracking}
                variant="outline"
                borderColor="gray.250"
                color="black"
                _hover={{ bg: 'gray.50' }}
                size="md"
                borderRadius="2xl"
                fontWeight="bold"
              >
                <FileText size={15} style={{ marginRight: '6px' }} />
                View Receipts
              </Button>
              <Button
                onClick={onNavigateHome}
                bg="#C65D3A"
                _hover={{ bg: '#A94B2B' }}
                color="white"
                size="md"
                borderRadius="2xl"
                fontWeight="bold"
              >
                Return to Home
                <ArrowRight size={14} style={{ marginLeft: '6px' }} />
              </Button>
            </Grid>
          </VStack>

        </Box>
      </Container>
    </Box>
  );
};
