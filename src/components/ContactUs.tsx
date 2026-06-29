/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Container,
  Grid,
  Input,
  Textarea,
  Badge,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface ContactUsProps {
  onNavigateHome: () => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onNavigateHome }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1200);
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={6}>
      <Container maxW="90%">
        {/* Navigation Breadcrumb */}
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

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1.1fr' }} gap={10}>
          {/* Left Column: Reach Out & Campus Information */}
          <VStack align="stretch" spaceY={6}>
            <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
              <VStack align="flex-start" spaceY={3} mb={6}>
                <Badge bg="rgba(198, 93, 58, 0.08)" color="#C65D3A" px={3} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                  CAMPUS OUTPOST HUB
                </Badge>
                <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
                  Contact JDH Kitchen
                </Heading>
                <Text fontSize="xs" color="gray.500" lineHeight="relaxed">
                  Have questions about our campus co-op threshold pools, custom catering packages, or active batch timing? Get in touch with our student coordination office directly.
                </Text>
              </VStack>

              <VStack align="stretch" spaceY={5} pt={2}>
                <HStack spaceX={4.5} align="flex-start">
                  <Box p={3} bg="#FFF8F0" borderRadius="2xl" color="#C65D3A" flexShrink={0}>
                    <MapPin size={20} />
                  </Box>
                  <VStack align="flex-start" spaceY={0.5}>
                    <Text fontSize="xs" fontWeight="bold" color="black">Delivery Locations</Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium">
                      Front of school (for off-klites) and Coe Villa (for hostelites).
                    </Text>
                    <Text fontSize="10px" color="#6B8E23" fontWeight="bold">
                      📍 Note: Delivery is conducted exclusively at these two pickup points.
                    </Text>
                  </VStack>
                </HStack>

                <HStack spaceX={4.5} align="flex-start">
                  <Box p={3} bg="#FFF8F0" borderRadius="2xl" color="#C65D3A" flexShrink={0}>
                    <Clock size={20} />
                  </Box>
                  <VStack align="flex-start" spaceY={0.5}>
                    <Text fontSize="xs" fontWeight="bold" color="black">Fulfillment & Collection Hours</Text>
                    <Text fontSize="xs" color="gray.500">
                      Thursdays & Sundays: 12:00 PM - 6:00 PM
                    </Text>
                    <Text fontSize="10px" color="gray.400">
                      (Subject to menu-specific pooling threshold achievements)
                    </Text>
                  </VStack>
                </HStack>

                <HStack spaceX={4.5} align="flex-start">
                  <Box p={3} bg="#FFF8F0" borderRadius="2xl" color="#C65D3A" flexShrink={0}>
                    <Phone size={20} />
                  </Box>
                  <VStack align="flex-start" spaceY={0.5}>
                    <Text fontSize="xs" fontWeight="bold" color="black">WhatsApp & Helpline</Text>
                    <Text fontSize="xs" color="gray.500">
                      +234 703 891 2407 (WhatsApp Dispatcher Line)
                    </Text>
                  </VStack>
                </HStack>

                <HStack spaceX={4.5} align="flex-start">
                  <Box p={3} bg="#FFF8F0" borderRadius="2xl" color="#C65D3A" flexShrink={0}>
                    <Mail size={20} />
                  </Box>
                  <VStack align="flex-start" spaceY={0.5}>
                    <Text fontSize="xs" fontWeight="bold" color="black">Email Inquiries</Text>
                    <Text fontSize="xs" color="gray.500">
                      coop@jdh-kitchen.com
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          </VStack>

          {/* Right Column: Contact Interactive Form */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            {success ? (
              <Box align="center" py={12}>
                <Box p={4} bg="green.50" borderRadius="full" w="fit-content" mb={4}>
                  <Sparkles size={36} color="#6B8E23" />
                </Box>
                <Heading as="h3" size="md" color="black" mb={2}>Message Queued Successfully!</Heading>
                <Text fontSize="xs" color="gray.500" maxW="sm" mb={6}>
                  We received your campus inquiry. A student coordinator will correspond with you via email or WhatsApp in under 4 hours.
                </Text>
                <Button size="sm" onClick={() => setSuccess(false)} bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                  Send Another Message
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <VStack align="stretch" spaceY={4}>
                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Full Name *</Text>
                    <Input
                      placeholder="e.g. Ebuka Adesina"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      bg="#FAFAF7"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      borderRadius="xl"
                      size="sm"
                      required
                      color="black"
                    />
                  </VStack>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Campus Email ID *</Text>
                    <Input
                      type="email"
                      placeholder="e.g. student@yoursenior.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      bg="#FAFAF7"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      borderRadius="xl"
                      size="sm"
                      required
                      color="black"
                    />
                  </VStack>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">Your Message / Inquiry *</Text>
                    <Textarea
                      placeholder="How can we help you? Let us know if you need help with threshold pooling or group student accounts..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      bg="#FAFAF7"
                      borderColor="gray.250"
                      _focus={{ borderColor: 'black' }}
                      borderRadius="2xl"
                      fontSize="xs"
                      rows={5}
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
                    <Send size={14} style={{ marginRight: '6px' }} />
                    Dispatch Message
                  </Button>
                </VStack>
              </form>
            )}
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};
