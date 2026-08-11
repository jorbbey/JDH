/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Copy,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Building,
} from 'lucide-react';
import { paymentService } from '../services/payment';
import { web3FormsService } from '../services/notification';


interface ConfirmPaymentProps {
  orderId: string;
  totalAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({
  orderId,
  totalAmount,
  onSuccess,
  onCancel,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BANK_DETAILS = {
    bankName: 'Opay',
    accountNumber: '6100712673',
    accountName: 'JDH World Best Foods',
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const copyOrderCode = () => {
    const formattedCode = `#${orderId.toUpperCase()}`;
    navigator.clipboard.writeText(formattedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const triggerFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Require either a receipt screenshot OR a sender name / reference
    if (!selectedFile && !txRef.trim()) {
      setErrorMsg('Please upload a screenshot receipt OR enter your bank sender name so we can verify your transfer.');
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl = null;
      if (selectedFile) {
        imageUrl = await paymentService.uploadProofImageFile(selectedFile);
      }

      // Submit payment proof to DB and transition order state
      await paymentService.submitPaymentProof({
        order_id: orderId,
        transaction_reference: txRef.trim() || 'Direct Transfer Confirmed',
        proof_image_url: imageUrl || undefined,
      });

      // Fire background order placed email notification (non-blocking)
      try {
        web3FormsService.sendOrderPlacedNotification(
          orderId,
          totalAmount,
          txRef.trim() || undefined,
          imageUrl || undefined
        ).catch(e => console.error('Background notification error:', e));
      } catch (notifyErr) {
        console.error('Error initiating order placed notification:', notifyErr);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error confirming payment. Please try again or contact support.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW={{ base: "100%", md: "95%", lg: "90%" }} px={{ base: 2.5, sm: 4, md: 6 }}>
        {/* Breadcrumb Header */}
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          _hover={{ bg: 'gray.100', color: 'black' }}
          onClick={onCancel}
          borderRadius="xl"
          fontWeight="bold"
          mb={6}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Back to Basket
        </Button>

        {/* Stepper Header */}
        <Flex justify="space-between" align="center" mb={8} bg="white" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.150" shadow="sm" overflowX="auto">
          <HStack spaceX={3} opacity={0.8} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="emerald.500" color="white" align="center" justify="center" fontWeight="black" fontSize="xs">
              ✓
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="black">Basket & Details</Text>
              <Text fontSize="9px" color="emerald.600" fontWeight="bold">Completed</Text>
            </VStack>
          </HStack>

          <Box h="1px" bg="gray.200" flex="1" mx={4} minW="30px" />

          <HStack spaceX={3} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="#C65D3A" color="white" align="center" justify="center" fontWeight="bold" fontSize="xs">
              2
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="black">Bank Transfer</Text>
              <Text fontSize="9px" color="#C65D3A" fontWeight="bold">Current Step</Text>
            </VStack>
          </HStack>

          <Box h="1px" bg="gray.200" flex="1" mx={4} minW="30px" />

          <HStack spaceX={3} opacity={0.6} flexShrink={0}>
            <Flex w={7} h={7} borderRadius="full" bg="gray.200" color="gray.600" align="center" justify="center" fontWeight="bold" fontSize="xs">
              3
            </Flex>
            <VStack align="flex-start" spaceY={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700">Get Pickup Code</Text>
              <Text fontSize="9px" color="gray.400">Final Step</Text>
            </VStack>
          </HStack>
        </Flex>

        <VStack align="stretch" spaceY={6}>
          {/* Main Title & Order Code Highlight */}
          <VStack align="flex-start" spaceY={4} bg="white" p={{ base: 5, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <Badge bg="orange.50" color="orange.800" px={3} py={1} borderRadius="lg" fontSize="10px" fontWeight="black">
              DIRECT BANK TRANSFER
            </Badge>
            <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
              Transfer ₦{totalAmount.toLocaleString()} to Confirm Your Order
            </Heading>
            <Text fontSize="xs" color="gray.600" lineHeight="relaxed">
              Complete your transfer using any mobile app (OPay, PalmPay, GTBank, Kuda, FirstBank, USSD, etc.).
            </Text>

            {/* UNMISSABLE ORDER CODE CARD */}
            <Box bg="#FFF3EB" borderWidth="2px" borderColor="#C65D3A" p={4} borderRadius="2xl" w="full" shadow="sm">
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <HStack spaceX={3}>
                  <Box bg="#C65D3A" color="white" p={2.5} borderRadius="xl" flexShrink={0}>
                    <Copy size={20} />
                  </Box>
                  <VStack align="flex-start" spaceY={0}>
                    <Text fontSize="10px" fontWeight="black" color="#C65D3A" letterSpacing="widest" textTransform="uppercase">
                      YOUR ORDER CODE
                    </Text>
                    <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="950" color="black" letterSpacing="wider" fontFamily="mono">
                      #{orderId.toUpperCase()}
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  size="sm"
                  bg="#C65D3A"
                  color="white"
                  _hover={{ bg: '#A94B2B' }}
                  onClick={copyOrderCode}
                  borderRadius="xl"
                  fontWeight="bold"
                  px={4}
                  py={2.5}
                >
                  <Copy size={14} style={{ marginRight: '6px' }} />
                  {copiedCode ? 'Copied!' : 'Copy Order Code'}
                </Button>
              </Flex>
              <Text fontSize="10px" color="gray.600" fontWeight="bold" mt={2}>
                💡 Tip: Put this order code in your bank transfer message so we find your money fast.
              </Text>
            </Box>
          </VStack>

          {errorMsg && (
            <Box bg="red.50" color="red.700" p={4} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="red.300" fontSize="12px" fontWeight="bold">
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', marginTop: '-3px' }} />
              {errorMsg}
            </Box>
          )}

          {/* STEP 1: Bank Account Details Card */}
          <Box bg="white" p={{ base: 5, md: 8 }} borderRadius="3xl" borderWidth="1.5px" borderColor="#C65D3A" shadow="md">
            <VStack align="stretch" spaceY={5}>
              <Flex justify="space-between" align="center" borderBottomWidth="1.5px" borderColor="gray.100" pb={3}>
                <HStack spaceX={2}>
                  <Badge bg="#C65D3A" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="10px" fontWeight="black">
                    STEP 1
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="bold" color="black">
                    Make Bank Transfer
                  </Heading>
                </HStack>
                <Text fontSize="11px" fontWeight="bold" color="gray.500">
                  Instant Verification
                </Text>
              </Flex>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                {/* Account Number Focus */}
                <Box bg="#FFF8F0" p={5} borderRadius="2xl" borderWidth="1.5px" borderColor="#F3D1C5" textAlign="center">
                  <Text fontSize="10px" color="gray.500" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
                    ACCOUNT NUMBER
                  </Text>
                  <Text fontSize={{ base: "2xl", sm: "3xl" }} fontWeight="950" color="black" my={1.5} letterSpacing="wider">
                    {BANK_DETAILS.accountNumber}
                  </Text>
                  <Button
                    size="sm"
                    bg="black"
                    _hover={{ bg: 'gray.800' }}
                    color="white"
                    onClick={copyAccountNumber}
                    borderRadius="xl"
                    fontWeight="bold"
                    px={5}
                    py={4}
                    w="full"
                  >
                    <Copy size={14} style={{ marginRight: '6px' }} />
                    {copiedAccount ? 'Copied to Clipboard!' : 'Copy Account Number'}
                  </Button>
                </Box>

                {/* Bank Name, Account Name & Amount */}
                <VStack align="stretch" justify="center" spaceY={3} bg="#FAFAF7" p={5} borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">BANK NAME:</Text>
                    <Badge bg="emerald.100" color="emerald.800" fontSize="xs" fontWeight="black" px={2.5} py={0.5} borderRadius="md">
                      {BANK_DETAILS.bankName.toUpperCase()}
                    </Badge>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">ACCOUNT NAME:</Text>
                    <Text fontSize="xs" fontWeight="black" color="black">{BANK_DETAILS.accountName}</Text>
                  </HStack>

                  <HStack justify="space-between" pt={2} borderTopWidth="1px" borderStyle="dashed" borderColor="gray.250">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">EXACT AMOUNT:</Text>
                    <HStack spaceX={2}>
                      <Text fontSize="md" fontWeight="900" color="#C65D3A">₦{totalAmount.toLocaleString()}</Text>
                      <Button size="xs" variant="outline" borderColor="gray.300" onClick={copyAmount} borderRadius="md">
                        {copiedAmount ? 'Copied' : 'Copy'}
                      </Button>
                    </HStack>
                  </HStack>
                </VStack>
              </Grid>
            </VStack>
          </Box>

          {/* STEP 2: Submit Proof / Reference */}
          <Box bg="white" p={{ base: 5, md: 8 }} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <form onSubmit={handleSubmitProof}>
              <VStack align="stretch" spaceY={6}>
                <HStack spaceX={2} borderBottomWidth="1.5px" borderColor="gray.100" pb={3}>
                  <Badge bg="black" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="10px" fontWeight="black">
                    STEP 2
                  </Badge>
                  <Heading as="h3" size="sm" fontWeight="bold" color="black">
                    Upload Receipt or Transfer Details
                  </Heading>
                </HStack>

                {/* Drag and Drop Screenshot Uploader */}
                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">Option A: Upload Screenshot Receipt</Text>
                  <Box
                    w="full"
                    py={8}
                    px={6}
                    bg={isDragOver ? '#FFF8F0' : '#FAFAF7'}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={isDragOver ? '#C65D3A' : 'gray.250'}
                    borderRadius="2xl"
                    _hover={{ borderColor: '#C65D3A', bg: '#FFF8F0' }}
                    cursor="pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInputClick}
                    transition="all 0.2s ease"
                    textAlign="center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <VStack spaceY={2}>
                      <Upload size={28} color={isDragOver ? '#C65D3A' : '#64748B'} />
                      <Text fontSize="xs" fontWeight="bold" color="black">
                        {selectedFile ? 'Change Receipt Screenshot' : 'Tap to select screenshot image, or drag & drop here'}
                      </Text>
                      <Text fontSize="10px" color="gray.400">Supports PNG, JPG, or JPEG formats up to 5MB</Text>
                    </VStack>
                  </Box>

                  {selectedFile && (
                    <Flex bg="emerald.50" color="emerald.800" p={3} borderRadius="xl" align="center" gap={2} mt={1} fontSize="11px" fontWeight="bold" w="full">
                      <CheckCircle size={14} color="#059669" />
                      <Text>Selected Screenshot: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</Text>
                    </Flex>
                  )}
                </VStack>

                {/* Sender Name / Bank Reference */}
                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">Option B: Bank Sender Name / Reference</Text>
                  <Input
                    placeholder="e.g. Ebuka Adesina (PalmPay Transfer)"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    bg="#FAFAF7"
                    borderColor="gray.250"
                    _focus={{ borderColor: 'black' }}
                    borderRadius="xl"
                    size="md"
                    color="black"
                  />
                  <Text fontSize="10px" color="gray.400">Enter the name on your bank account so our kitchen team can match your deposit.</Text>
                </VStack>

                {/* Submit Trigger Actions */}
                <Button
                  type="submit"
                  loading={isUploading}
                  bg="#C65D3A"
                  _hover={{ bg: '#A94B2B' }}
                  color="white"
                  size="lg"
                  borderRadius="2xl"
                  fontWeight="bold"
                  shadow="md"
                  w="full"
                  mt={2}
                  py={7}
                  px={10}
                  fontSize="md"
                >
                  <CheckCircle size={18} style={{ marginRight: '8px' }} />
                  I Have Transferred ₦{totalAmount.toLocaleString()} — Confirm Order
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
