/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Stack,
  Alert,
} from '@chakra-ui/react';
import { X, Mail, Lock, User, Phone, MapPin, KeyRound, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  const handleQuickAdminPrefill = () => {
    setEmail('admin@jdhkitchen.com');
    setPassword('admin123');
    setTab('login');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === 'login') {
        let { data, error } = await authService.signIn(email, password);
        
        // If the sign in failed and the email has "admin" in it, we automatically create the account on standard credential error
        if (error && email.toLowerCase().includes('admin')) {
          console.info('Admin sign-in failed, attempting silent sign-up bypass...');
          const adminName = email === 'admin@jdhkitchen.com' ? 'Executive Chef Admin' : 'Campus Kitchen Administrator';
          const signupRes = await authService.signUp(
            email,
            password,
            adminName,
            '+234 801 111 2222',
            'Kitchen HQ',
            'Suite A'
          );

          if (!signupRes.error) {
            // Sign up was successful, now let's retry signing in!
            const retryRes = await authService.signIn(email, password);
            data = retryRes.data;
            error = retryRes.error;
          }
        }

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Signed in successfully!');
          const profile = await authService.getCurrentProfile();
          if (profile) {
            onAuthSuccess(profile);
            setTimeout(() => {
              onClose();
            }, 600);
          }
        }
      } else {
        const { data, error } = await authService.signUp(
          email,
          password,
          fullName,
          phone,
          hostelName,
          roomNumber
        );

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created successfully!');
          // Auto sign-in
          const { data: signInData, error: signInErr } = await authService.signIn(email, password);
          if (!signInErr) {
            const profile = await authService.getCurrentProfile();
            if (profile) {
              onAuthSuccess(profile);
            }
          }
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1500}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={6}
      >
        {/* Backdrop overlay */}
        <Box
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.750"
          backdropFilter="blur(5px)"
          onClick={onClose}
        />

        {/* Modal Dialog Card */}
        <Box
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          bg="white"
          w="full"
          maxW="480px"
          borderRadius="3xl"
          shadow="2xl"
          overflow="hidden"
          position="relative"
          display="flex"
          flexDirection="column"
          maxH="90vh"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            boxSize="36px"
            p={0}
            color="gray.450"
            _hover={{ bg: 'gray.100', color: 'black' }}
            borderRadius="full"
            position="absolute"
            top={4}
            right={4}
            zIndex={10}
            onClick={onClose}
          >
            <X size={18} />
          </Button>

          {/* Body and Content scroll container */}
          <Box overflowY="auto" p={8}>
            <VStack spaceY={6} align="stretch">
              
              {/* Header Titles */}
              <VStack spaceY={2} align="center" textAlign="center" mt={2}>
                <Box p={3} borderRadius="2xl" bg="#FFF4F0" color="#C65D3A">
                  <KeyRound size={26} />
                </Box>
                <Heading as="h3" size="lg" fontWeight="black" color="black" letterSpacing="tight">
                  {tab === 'login' ? 'Welcome Back!' : 'Create New Account'}
                </Heading>
                <Text fontSize="xs" color="gray.500" maxW="300px">
                  {tab === 'login'
                    ? 'Access your receipts, faster pre-orders, and banquet services.'
                    : 'Get started and access your dedicated delivery portal.'}
                </Text>
              </VStack>

              {/* Tab Selector Buttons */}
              <HStack bg="#F5F5F3" p={1} borderRadius="xl" w="full">
                <Button
                  flex={1}
                  size="sm"
                  variant={tab === 'login' ? 'solid' : 'ghost'}
                  bg={tab === 'login' ? 'white' : 'transparent'}
                  color={tab === 'login' ? 'black' : 'gray.500'}
                  _hover={{ bg: tab === 'login' ? 'white' : 'gray.200' }}
                  borderRadius="lg"
                  fontWeight="bold"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg(null);
                  }}
                  shadow={tab === 'login' ? 'sm' : 'none'}
                >
                  Sign In
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  variant={tab === 'register' ? 'solid' : 'ghost'}
                  bg={tab === 'register' ? 'white' : 'transparent'}
                  color={tab === 'register' ? 'black' : 'gray.500'}
                  _hover={{ bg: tab === 'register' ? 'white' : 'gray.200' }}
                  borderRadius="lg"
                  fontWeight="bold"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg(null);
                  }}
                  shadow={tab === 'register' ? 'sm' : 'none'}
                >
                  Register
                </Button>
              </HStack>

              {/* Error messages */}
              {errorMsg && (
                <Box
                  bg="red.50"
                  color="red.700"
                  p={4.5}
                  borderRadius="2xl"
                  fontSize="xs"
                  fontWeight="medium"
                  borderWidth="1.5px"
                  borderColor="red.150"
                  display="flex"
                  alignItems="start"
                >
                  <ShieldAlert size={16} style={{ marginRight: '8px', marginTop: '1px', flexShrink: 0 }} />
                  <Text>{errorMsg}</Text>
                </Box>
              )}

              {/* Success messages */}
              {successMsg && (
                <Box
                  bg="green.50"
                  color="green.700"
                  p={4.5}
                  borderRadius="2xl"
                  fontSize="xs"
                  fontWeight="bold"
                  borderWidth="1.5px"
                  borderColor="green.150"
                >
                  {successMsg}
                </Box>
              )}

              {/* Auth Form Inputs */}
              <form onSubmit={handleSubmit}>
                <VStack spaceY={4} align="stretch">
                  
                  {/* Register Fields */}
                  {tab === 'register' && (
                    <>
                      <VStack align="flex-start" spaceY={1}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.600">
                          Full Name *
                        </Text>
                        <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                          <User size={16} color="gray" />
                          <Input
                            placeholder="Damilola Adebayo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            border="none"
                            outline="none"
                            p={0}
                            fontSize="sm"
                            height="auto"
                            bg="transparent"
                            _focus={{ boxShadow: 'none' }}
                            w="full"
                            required
                          />
                        </HStack>
                      </VStack>

                      <VStack align="flex-start" spaceY={1}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.600">
                          Phone Number (Optional)
                        </Text>
                        <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                          <Phone size={16} color="gray" />
                          <Input
                            placeholder="+234 812 345 6789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            border="none"
                            outline="none"
                            p={0}
                            fontSize="sm"
                            height="auto"
                            bg="transparent"
                            _focus={{ boxShadow: 'none' }}
                            w="full"
                          />
                        </HStack>
                      </VStack>

                      <HStack spaceX={3} w="full">
                        <VStack align="flex-start" spaceY={1} flex={1}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600">
                            Hostel Name
                          </Text>
                          <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                            <MapPin size={16} color="gray" />
                            <Input
                              placeholder="Moremi Hall"
                              value={hostelName}
                              onChange={(e) => setHostelName(e.target.value)}
                              border="none"
                              outline="none"
                              p={0}
                              fontSize="sm"
                              height="auto"
                              bg="transparent"
                              _focus={{ boxShadow: 'none' }}
                              w="full"
                            />
                          </HStack>
                        </VStack>

                        <VStack align="flex-start" spaceY={1} w="110px">
                          <Text fontSize="xs" fontWeight="bold" color="gray.600">
                            Room
                          </Text>
                          <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                            <Input
                              placeholder="B204"
                              value={roomNumber}
                              onChange={(e) => setRoomNumber(e.target.value)}
                              border="none"
                              outline="none"
                              p={0}
                              fontSize="sm"
                              height="auto"
                              bg="transparent"
                              _focus={{ boxShadow: 'none' }}
                              w="full"
                            />
                          </HStack>
                        </VStack>
                      </HStack>
                    </>
                  )}

                  {/* Standard Login / EmailAndPassword */}
                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      Email Address *
                    </Text>
                    <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                      <Mail size={16} color="gray" />
                      <Input
                        type="email"
                        placeholder="student@campus.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        border="none"
                        outline="none"
                        p={0}
                        fontSize="sm"
                        height="auto"
                        bg="transparent"
                        _focus={{ boxShadow: 'none' }}
                        w="full"
                        required
                      />
                    </HStack>
                  </VStack>

                  <VStack align="flex-start" spaceY={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      Secret Password *
                    </Text>
                    <HStack w="full" px={3} py={2.5} bg="white" borderWidth="1.5px" borderColor="gray.200" borderRadius="xl">
                      <Lock size={16} color="gray" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        border="none"
                        outline="none"
                        p={0}
                        fontSize="sm"
                        height="auto"
                        bg="transparent"
                        _focus={{ boxShadow: 'none' }}
                        w="full"
                        required
                      />
                    </HStack>
                  </VStack>

                  <Button
                    type="submit"
                    w="full"
                    h="48px"
                    bg="black"
                    _hover={{ bg: 'gray.800' }}
                    color="white"
                    borderRadius="2xl"
                    fontWeight="black"
                    fontSize="sm"
                    loadingText="Processing..."
                    isLoading={isLoading}
                    mt={4}
                  >
                    {tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                  </Button>

                  {/* Staff Info Note */}
                  <Box bg="gray.50" py={2.5} px={3.5} borderRadius="xl" mt={2}>
                    <Text fontSize="11px" color="gray.500" textAlign="center" lineHeight="short">
                      💡 <strong>Staff Members:</strong> Sign in with your administrator email profile (e.g. including 'admin') to access full inventory, menu and tracking.
                    </Text>
                  </Box>

                  {/* Quick Admin Access Bypass/Shortcut */}
                  <Button
                    type="button"
                    onClick={handleQuickAdminPrefill}
                    variant="outline"
                    size="sm"
                    h="38px"
                    bg="#FFF4F0"
                    color="#C65D3A"
                    borderColor="#FFDED4"
                    _hover={{ bg: "#FFF0EB" }}
                    borderRadius="xl"
                    fontWeight="black"
                    fontSize="11px"
                    w="full"
                    mt={1}
                  >
                    ⚡ PREFILL DEMO ADMIN CREDENTIALS
                  </Button>

                </VStack>
              </form>

            </VStack>
          </Box>
        </Box>
      </Box>
    </AnimatePresence>
  );
};
