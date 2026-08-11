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
  Copy,
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPickup, setCopiedPickup] = useState(false);

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

  const copyOrderCode = () => {
    navigator.clipboard.writeText(`#${orderId.toUpperCase()}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyPickupCode = () => {
    navigator.clipboard.writeText(displayPickupCode);
    setCopiedPickup(true);
    setTimeout(() => setCopiedPickup(false), 2000);
  };

  // Direct Delivery Guidelines matching co-op schedules
  const deliveryLocation = order?.hostel_name || 'Front of school / Coke Villa / SICT gate';
  const pickupTime = '10:00 AM';
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
            Order Placed Successfully!
          </Heading>
          
          <Badge bg="emerald.50" color="emerald.700" px={3} py={1} borderRadius="lg" fontSize="10.5px" fontWeight="bold" mb={6}>
            STATUS: CHECKING YOUR PAYMENT
          </Badge>

          <Text fontSize="xs" color="gray.600" mb={8} lineHeight="relaxed" maxW="xl">
            Thank you for ordering from <strong>JDH Kitchen</strong>! We have received your order. We will bring your food to your selected pickup location.
          </Text>

          {/* UNMISSABLE ORDER CODE & PICKUP PASS CARD */}
          <Box bg="black" color="white" p={{ base: 5, md: 7 }} borderRadius="3xl" mb={8} textAlign="left" shadow="xl" position="relative" overflow="hidden">
            <VStack spaceY={5} align="stretch">
              <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="gray.800" pb={3} flexWrap="wrap" gap={2}>
                <HStack spaceX={2.5}>
                  <Box bg="#C65D3A" color="white" p={1.5} borderRadius="lg">
                    <Lock size={16} />
                  </Box>
                  <Heading as="h4" size="xs" fontWeight="black" color="white" textTransform="uppercase" letterSpacing="wider">
                    YOUR ORDER CODES (TAKE A SCREENSHOT NOW)
                  </Heading>
                </HStack>
                <Badge bg="orange.500" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="9px" fontWeight="black">
                  KEEP FOR PICKUP
                </Badge>
              </Flex>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                {/* 1. ORDER REFERENCE CODE */}
                <Box bg="gray.900" p={5} borderRadius="2xl" borderWidth="1.5px" borderColor="#C65D3A" textAlign="center">
                  <Text fontSize="9px" color="orange.300" fontWeight="black" letterSpacing="widest" textTransform="uppercase">
                    ORDER CODE
                  </Text>
                  <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="950" color="white" my={1.5} letterSpacing="wider" fontFamily="mono">
                    #{orderId.toUpperCase()}
                  </Text>
                  <Button
                    size="xs"
                    bg="#C65D3A"
                    _hover={{ bg: '#A94B2B' }}
                    color="white"
                    onClick={copyOrderCode}
                    borderRadius="xl"
                    fontWeight="bold"
                    px={4}
                    py={2}
                    w="full"
                  >
                    <Copy size={12} style={{ marginRight: '6px' }} />
                    {copiedCode ? 'Copied!' : 'Copy Order Code'}
                  </Button>
                </Box>

                {/* 2. PICKUP PASS CODE */}
                <Box bg="gray.900" p={5} borderRadius="2xl" borderWidth="1.5px" borderColor="emerald.500" textAlign="center">
                  <Text fontSize="9px" color="emerald.300" fontWeight="black" letterSpacing="widest" textTransform="uppercase">
                    FOOD PICKUP CODE
                  </Text>
                  <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="950" color="emerald.400" my={1.5} letterSpacing="wider" fontFamily="mono">
                    {displayPickupCode}
                  </Text>
                  <Button
                    size="xs"
                    bg="emerald.600"
                    _hover={{ bg: 'emerald.700' }}
                    color="white"
                    onClick={copyPickupCode}
                    borderRadius="xl"
                    fontWeight="bold"
                    px={4}
                    py={2}
                    w="full"
                  >
                    <Copy size={12} style={{ marginRight: '6px' }} />
                    {copiedPickup ? 'Copied!' : 'Copy Pickup Code'}
                  </Button>
                </Box>
              </Grid>

              {/* Delivery Details Details */}
              <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr 1fr' }} gap={3} pt={2} borderTopWidth="1px" borderColor="gray.850">
                <HStack spaceX={2.5} align="center">
                  <MapPin size={14} color="#C65D3A" style={{ flexShrink: 0 }} />
                  <VStack align="flex-start" spaceY={0}>
                    <Text fontSize="8.5px" color="gray.400" fontWeight="bold">LOCATION</Text>
                    <Text fontSize="11px" fontWeight="bold" color="white">{deliveryLocation}</Text>
                  </VStack>
                </HStack>

                <HStack spaceX={2.5} align="center">
                  <Calendar size={14} color="#C65D3A" style={{ flexShrink: 0 }} />
                  <VStack align="flex-start" spaceY={0}>
                    <Text fontSize="8.5px" color="gray.400" fontWeight="bold">DELIVERY SCHEDULE</Text>
                    <Text fontSize="11px" fontWeight="bold" color="white">{pickupDate}</Text>
                  </VStack>
                </HStack>

                <HStack spaceX={2.5} align="center">
                  <Clock size={14} color="#C65D3A" style={{ flexShrink: 0 }} />
                  <VStack align="flex-start" spaceY={0}>
                    <Text fontSize="8.5px" color="gray.400" fontWeight="bold">TIME WINDOW</Text>
                    <Text fontSize="11px" fontWeight="bold" color="white">{pickupTime}</Text>
                  </VStack>
                </HStack>
              </Grid>
            </VStack>
          </Box>

          {/* Checkout Totals Summary */}
          <Box bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" mb={8} w="full">
            <VStack spaceY={2.5} align="stretch" fontSize="xs">
              <Flex justify="space-between" pb={2} borderBottomWidth="1px" borderColor="gray.100">
                <Text color="gray.500" fontWeight="bold">TOTAL SETTLED AMOUNT</Text>
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

            <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
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
