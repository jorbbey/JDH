/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Input,
  Textarea,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Utensils,
  Calendar,
  Users,
  Award,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cateringService, CateringDetailedItem } from '../services/catering';

interface CateringBookingProps {
  currentUser: any;
  onNavigateHome: () => void;
}

export const CateringBooking: React.FC<CateringBookingProps> = ({
  currentUser,
  onNavigateHome,
}) => {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState(25);
  const [instructions, setInstructions] = useState('');
  
  const [bookingHistory, setBookingHistory] = useState<CateringDetailedItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const savedPhone = phone || currentUser?.phone;
        if (savedPhone) {
          try {
            const data = await cateringService.getCateringRequestsByPhone(savedPhone);
            setBookingHistory(data);
            return;
          } catch (e) {
            console.error(e);
          }
        }

        // Check local storage enquiries
        const localData = localStorage.getItem('jdh_local_catering');
        if (localData) {
          try {
            const enquiries = JSON.parse(localData);
            const loaded: CateringDetailedItem[] = [];
            for (const item of enquiries) {
              const [nm, ph] = item.split('|');
              if (ph) {
                const results = await cateringService.getCateringRequestsByPhone(ph);
                loaded.push(...results);
              }
            }
            // de-duplicate
            const seen = new Set();
            const unique = loaded.filter(x => {
              if (seen.has(x.id)) return false;
              seen.add(x.id);
              return true;
            });
            setBookingHistory(unique);
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error fetching student catering log:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [currentUser, phone]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please provide your name for personal contact.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please provide your phone number for custom pricing.');
      return;
    }
    if (!eventName.trim() || !eventDate.trim() || !instructions.trim()) {
      setErrorMessage('Please fill in all requested fields marked with *');
      return;
    }
    if (guestCount < 10) {
      setErrorMessage('Minimum catering pooling starts at 10 guests.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await cateringService.submitCateringRequest({
        customer_name: fullName,
        customer_phone: phone,
        event_name: eventName,
        event_date: new Date(eventDate).toISOString(),
        estimated_guests: guestCount,
        special_instructions: instructions,
      });

      if (result) {
        setSuccessMessage('Catering request successfully queued! Our lecturer will review details and quote a custom price.');
        setEventName('');
        setEventDate('');
        setGuestCount(25);
        setInstructions('');
        
        // Refresh local cache & listing
        try {
          const localEnquiries = JSON.parse(localStorage.getItem('jdh_local_catering') || '[]');
          const token = `${fullName}|${phone}`;
          if (!localEnquiries.includes(token)) {
            localEnquiries.push(token);
            localStorage.setItem('jdh_local_catering', JSON.stringify(localEnquiries));
          }
        } catch (e) {
          console.error(e);
        }

        // Reload lists
        const updatedList = await cateringService.getCateringRequestsByPhone(phone);
        setBookingHistory(updatedList);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error scheduling event request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge bg="orange.50" color="orange.700" px={2} py={0.1} borderRadius="md" fontSize="9px">PENDING REVIEW</Badge>;
      case 'approved':
        return <Badge bg="green.50" color="green.750" px={2} py={0.1} borderRadius="md" fontSize="9px">QUOTED / APPROVED</Badge>;
      case 'rejected':
        return <Badge bg="red.50" color="red.700" px={2} py={0.1} borderRadius="md" fontSize="9px">DECLINED</Badge>;
      default:
        return <Badge bg="gray.50" color="gray.600" px={2} py={0.1} borderRadius="md" fontSize="9px">UNKNOWN</Badge>;
    }
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW="90%">
        {/* Navigation Breadcrumbs */}
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          _hover={{ bg: 'gray.100', color: 'black' }}
          onClick={onNavigateHome}
          borderRadius="xl"
          fontWeight="bold"
          mb={8}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Return to Home
        </Button>

        <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap={10}>
          
          {/* Left Booking Application Column */}
          <VStack align="stretch" spaceY={6}>
            <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              <VStack align="flex-start" spaceY={2.5} mb={6}>
                <Badge bg="#FFF8F0" color="#C65D3A" px={2.5} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                  STUDENT CO-OP CATERING
                </Badge>
                <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
                  Hostel Feast & Events Banquet Booking
                </Heading>
                <Text fontSize="xs" color="gray.500" lineHeight="relaxed">
                  Planning a birthday banquet, fellowship picnic, or a floor block feast? Submit your culinary requirements, guest size, and date. JDH Kitchen prepares special larger recipes at co-op factory prices.
                </Text>
              </VStack>

              {errorMessage && (
                <Box bg="red.50" color="red.700" p={3.5} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="red.300" fontSize="12px" fontWeight="bold" mb={4}>
                  <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
                  {errorMessage}
                </Box>
              )}

              {successMessage && (
                <Box bg="green.50" color="green.700" p={3.5} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="green.300" fontSize="12px" fontWeight="bold" mb={4}>
                  <Sparkles size={15} style={{ display: 'inline', marginRight: '6px' }} />
                  {successMessage}
                </Box>
              )}

              <form onSubmit={handleBooking}>
                <VStack align="stretch" spaceY={4}>
                  <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Full Name *</Text>
                      <Input
                        placeholder="e.g. Ebuka Adesina"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        bg="#FAFBF9"
                        borderColor="gray.250"
                        _focus={{ borderColor: 'black' }}
                        borderRadius="xl"
                        size="sm"
                        required
                        color="black"
                      />
                    </VStack>

                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">WhatsApp Phone *</Text>
                      <Input
                        placeholder="e.g. +234 703 891 2407"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        bg="#FAFBF9"
                        borderColor="gray.250"
                        _focus={{ borderColor: 'black' }}
                        borderRadius="xl"
                        size="sm"
                        required
                        color="black"
                      />
                    </VStack>
                  </Grid>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Event Occasion / Name *</Text>
                    <Input
                      placeholder="e.g. Moremi Hall block birthay banquet"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      bg="#FAFBF9"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      borderRadius="xl"
                      size="sm"
                      required
                      color="black"
                    />
                  </VStack>

                  <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">Desired Date & Time *</Text>
                      <Input
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        bg="#FAFBF9"
                        borderColor="gray.250"
                        _focus={{ borderColor: 'black' }}
                        borderRadius="xl"
                        size="sm"
                        required
                        color="black"
                      />
                    </VStack>

                    <VStack align="flex-start" spaceY={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600">Portions / Guest headcount *</Text>
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 10)}
                        bg="#FAFBF9"
                        borderColor="gray.250"
                        _focus={{ borderColor: 'black' }}
                        borderRadius="xl"
                        size="sm"
                        required
                        color="black"
                      />
                    </VStack>
                  </Grid>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Custom Meal list & instructions *</Text>
                    <Textarea
                      placeholder="e.g. We need 3 large pails of smokey Jollof rice, 40 pieces of peppered roasted turkey, sides of dodo, coleslaw, and 2 gallons of hibiscus mocktail..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      bg="#FAFBF9"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      borderRadius="2xl"
                      fontSize="xs"
                      rows={4}
                      required
                      color="black"
                    />
                  </VStack>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    bg="#C65D3A"
                    _hover={{ bg: '#A94B2B' }}
                    color="white"
                    size="md"
                    borderRadius="xl"
                    fontWeight="bold"
                    w="full"
                    mt={2}
                  >
                    Submit Proposals Details
                  </Button>
                </VStack>
              </form>
            </Box>
          </VStack>

          {/* Right Live Pricing History Column */}
          <VStack align="stretch" spaceY={6}>
            <Box bg="white" p={6} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              <Heading as="h3" size="sm" fontWeight="bold" color="black" pb={2.5} borderBottomWidth="1.5px" borderColor="gray.100" mb={4.5}>
                Your Event Contracts Ledger
              </Heading>

              {loadingHistory ? (
                <Text fontSize="xs" color="gray.450" align="center" py={6}>
                  Querying previous catering requests...
                </Text>
              ) : bookingHistory.length === 0 ? (
                <Text fontSize="xs" color="gray.450" align="center" py={8}>
                  No custom catering reservations submitted this semester. Use the form on the left!
                </Text>
              ) : (
                <VStack align="stretch" spaceY={4}>
                  {bookingHistory.map((booking) => (
                    <Box
                      key={booking.id}
                      bg="#FAFAF7"
                      p={4}
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="gray.220"
                    >
                      <VStack align="stretch" spaceY={2.5}>
                        <Flex justify="space-between" align="baseline">
                          <Heading as="h4" size="xs" fontWeight="bold" color="black" lineClamp={1} maxW="180px">
                            {booking.event_name}
                          </Heading>
                          {getStatusBadge(booking.status)}
                        </Flex>

                        <Text fontSize="10px" color="gray.500" lineClamp={2}>
                          Requested: {booking.special_instructions}
                        </Text>

                        <Grid templateColumns="1fr 1fr" gap={2} pt={2} borderTopWidth="1px" borderColor="gray.100" fontSize="9px" color="gray.500">
                          <HStack spaceX={1}>
                            <Calendar size={11} />
                            <Text>{new Date(booking.event_date).toLocaleDateString()}</Text>
                          </HStack>
                          <HStack spaceX={1}>
                            <Users size={11} />
                            <Text>{booking.estimated_guests} Guests</Text>
                          </HStack>
                        </Grid>

                        {booking.quoted_price ? (
                          <Flex justify="space-between" align="center" bg="emerald.50" p={2.5} borderRadius="xl" mt={1}>
                            <Text fontSize="9px" color="emerald.850" fontWeight="bold">OFFICIAL PRICE QUOTE</Text>
                            <Text fontSize="sm" color="emerald.850" fontWeight="black">
                              ₦{booking.quoted_price.toLocaleString()}
                            </Text>
                          </Flex>
                        ) : (
                          <Text fontSize="9px" color="orange.600" italic mt={1} fontStyle="italic">
                            ⏳ Chef is computing ingredient costs...
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
          
        </Grid>
      </Container>
    </Box>
  );
};
