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
  Input,
  Badge,
  Alert,
} from '@chakra-ui/react';
import { Lock, Mail, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/auth';
import jdhLogo from '../assets/JDH_logo-trans.png';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // Check pre-configured credentials purely client-side!
    if (cleanEmail === 'admin@jdhkitchen.com' && password === 'admin123') {
      setSuccessMsg('Initializing Administrative Session...');
      setTimeout(() => {
        const mockAdminProfile = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'admin@jdhkitchen.com',
          full_name: 'Executive Chef Admin',
          role: 'admin',
          phone: '+234 801 111 2222',
          hostel_name: 'Kitchen HQ',
          room_number: 'Suite A'
        };
        // Persist session locally
        localStorage.setItem('jdh_admin_session', JSON.stringify(mockAdminProfile));
        onLoginSuccess(mockAdminProfile);
        setIsLoading(false);
      }, 500);
    } else {
      setErrorMsg('Invalid administrative credentials. Access denied.');
      setIsLoading(false);
    }
  };

  const handleQuickPrefill = () => {
    setEmail('admin@jdhkitchen.com');
    setPassword('admin123');
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" display="flex" alignItems="center" py={12}>
      <Container maxW="md">
        <VStack spaceY={6} align="stretch">
          
          {/* Brand Presentation */}
          <VStack spaceY={2} align="center" textAlign="center">
            <Box h="72px" display="flex" alignItems="center" overflow="hidden" mb={2}>
              <Box as="img" src={jdhLogo} alt="JDH Kitchen Logo" h="full" w="auto" objectFit="contain" />
            </Box>
            <Badge bg="red.50" color="red.700" px={3} py={1} borderRadius="lg" fontSize="10px" fontWeight="bold">
              🔒 CLOSED KITCHEN PORTAL
            </Badge>
            <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
              JDH Kitchen Administration
            </Heading>
            <Text fontSize="xs" color="gray.500" maxW="sm">
              Log in with your credential token to manage menus, audit direct transfers, and oversee pooling goals.
            </Text>
          </VStack>

          {/* Form */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="xl">
            {errorMsg && (
              <Box bg="red.50" color="red.700" p={4} borderRadius="2xl" fontSize="xs" fontWeight="semibold" mb={4} display="flex" gap={2}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <Text>{errorMsg}</Text>
              </Box>
            )}

            {successMsg && (
              <Box bg="green.50" color="green.750" p={4} borderRadius="2xl" fontSize="xs" fontWeight="semibold" mb={4}>
                <Text>{successMsg}</Text>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack spaceY={4} align="stretch">
                <VStack align="flex-start" spaceY={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">Admin Email Address</Text>
                  <HStack w="full" bg="#FAFAF7" px={3} borderRadius="xl" borderHeight="1px" borderColor="gray.250">
                    <Mail size={16} color="gray" />
                    <Input
                      type="email"
                      placeholder="admin@jdhkitchen.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      variant="unstyled"
                      py={3}
                      size="sm"
                      required
                      color="black"
                      bg="transparent"
                      border="none"
                      _focus={{ boxShadow: 'none' }}
                    />
                  </HStack>
                </VStack>

                <VStack align="flex-start" spaceY={1}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">Access Key Token</Text>
                  <HStack w="full" bg="#FAFAF7" px={3} borderRadius="xl" borderHeight="1px" borderColor="gray.250">
                    <Lock size={16} color="gray" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant="unstyled"
                      py={3}
                      size="sm"
                      required
                      color="black"
                      bg="transparent"
                      border="none"
                      _focus={{ boxShadow: 'none' }}
                    />
                  </HStack>
                </VStack>

                <Button
                  type="submit"
                  loading={isLoading}
                  bg="black"
                  _hover={{ bg: 'gray.800' }}
                  color="white"
                  size="md"
                  borderRadius="xl"
                  fontWeight="bold"
                  w="full"
                  mt={2}
                >
                  Confirm Administrative Session
                  <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                </Button>

                {/* Micro Demo Credentials Prefill for evaluation */}
                <Button
                  onClick={handleQuickPrefill}
                  variant="outline"
                  borderColor="red.300"
                  color="red.700"
                  _hover={{ bg: 'red.50' }}
                  size="xs"
                  borderRadius="lg"
                  fontWeight="black"
                  py={3}
                  letterSpacing="wide"
                >
                  PREFILL DEMO ADMIN CREDENTIALS
                </Button>
              </VStack>
            </form>
          </Box>

          {/* Home Nav */}
          <Button
            variant="ghost"
            size="sm"
            color="gray.600"
            _hover={{ bg: 'gray.100', color: 'black' }}
            onClick={onNavigateHome}
            borderRadius="xl"
            fontWeight="bold"
            alignSelf="center"
          >
            <ArrowLeft size={14} style={{ marginRight: '6px' }} />
            Public Home Address
          </Button>

        </VStack>
      </Container>
    </Box>
  );
};
