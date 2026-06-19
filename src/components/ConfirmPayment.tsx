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
  const [copied, setCopied] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BANK_DETAILS = {
    bankName: 'Sterling Bank PLC',
    accountNumber: '1016839215',
    accountName: 'JDH Kitchen Co-Op Food Services',
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    if (!selectedFile) {
      setErrorMsg('Please upload a screenshot or photo of your bank transfer receipt.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload proof file to Supabase storage or get mock url
      const imageUrl = await paymentService.uploadProofImageFile(selectedFile);

      // 2. Submit payment proof to DB and transition order state
      await paymentService.submitPaymentProof({
        order_id: orderId,
        transaction_reference: txRef.trim() || undefined,
        proof_image_url: imageUrl,
      });

      // 3. Fire success transition callback
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading receipt. Please try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box minH="90vh" bg="#FAFAF7" py={4}>
      <Container maxW="90%">
        {/* Breadcrumb Header */}
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          _hover={{ bg: 'gray.100', color: 'black' }}
          onClick={onCancel}
          borderRadius="xl"
          fontWeight="bold"
          mb={8}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Back to Basket
        </Button>

        <VStack align="stretch" spaceY={8}>
          
          {/* Header Description */}
          <VStack align="flex-start" spaceY={2.5} bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <Badge bg="orange.50" color="orange.700" px={2.5} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
              DIRECT PERSONAL TRANSFER
            </Badge>
            <Heading as="h1" size="xl" fontWeight="black" color="black" letterSpacing="tight">
              Pay ₦{totalAmount.toLocaleString()} to Confirm Pre-Order
            </Heading>
            <Text fontSize="xs" color="gray.500" lineHeight="relaxed">
              To keep our food pricing at low street values, we coordinate orders on a direct personal basis without expensive payment gateways or corporate escrow. Simply make a direct deposit or transfer using your preferred banking app to the personal/cooperative bank account below, and upload the screenshot proof. Our student coordination team will manually check and verify the receipt privately!
            </Text>
          </VStack>

          {errorMsg && (
            <Box bg="red.50" color="red.700" p={4} borderRadius="xl" borderStyle="dashed" borderWidth="1.5px" borderColor="red.300" fontSize="12px" fontWeight="bold">
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', marginTop: '-3px' }} />
              {errorMsg}
            </Box>
          )}

          {/* Account Detail Box */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <VStack align="stretch" spaceY={5}>
              <Heading as="h3" size="sm" fontWeight="bold" color="black" pb={2} borderBottomWidth="1.5px" borderColor="gray.100">
                Co-Op Routing Destination
              </Heading>

              <Grid templateColumns={{ base: '1fr', md: '1.2fr 0.8fr' }} gap={6} alignItems="center">
                <VStack align="flex-start" spaceY={3}>
                  <HStack spaceX={3}>
                    <Building size={16} color="gray" />
                    <VStack align="flex-start" spaceY={0}>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold">RECIPIENT BANK</Text>
                      <Text fontSize="xs" fontWeight="bold" color="black">{BANK_DETAILS.bankName}</Text>
                    </VStack>
                  </HStack>

                  <HStack spaceX={3}>
                    <FileText size={16} color="gray" />
                    <VStack align="flex-start" spaceY={0}>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold">ACCOUNT NAME</Text>
                      <Text fontSize="xs" fontWeight="bold" color="black">{BANK_DETAILS.accountName}</Text>
                    </VStack>
                  </HStack>
                </VStack>

                <Box bg="#FAFAF7" p={4} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" align="center">
                  <Text fontSize="9px" color="gray.400" fontWeight="bold">SECURE ACCOUNT NUMBER</Text>
                  <Text fontSize="xl" fontWeight="black" color="black" my={1.5}>
                    {BANK_DETAILS.accountNumber}
                  </Text>
                  <Button
                    size="xs"
                    bg="black"
                    _hover={{ bg: 'gray.800' }}
                    color="white"
                    onClick={copyAccountNumber}
                    borderRadius="lg"
                    fontWeight="bold"
                    px={4}
                  >
                    <Copy size={12} style={{ marginRight: '6px' }} />
                    {copied ? 'Copied' : 'Copy Number'}
                  </Button>
                </Box>
              </Grid>
            </VStack>
          </Box>

          {/* Form Verification Submission */}
          <Box bg="white" p={8} borderRadius="3xl" borderWidth="1px" borderColor="gray.150" shadow="sm">
            <form onSubmit={handleSubmitProof}>
              <VStack align="stretch" spaceY={6}>
                <Heading as="h3" size="sm" fontWeight="bold" color="black" pb={2} borderBottomWidth="1.5px" borderColor="gray.100">
                  Submit Receipt Credentials
                </Heading>

                {/* Optional Sender Name/Tx Reference */}
                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">Sender Name / Transfer Reference (Optional)</Text>
                  <Input
                    placeholder="e.g. Adebayo Damilola - Sterling Transfer App"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    bg="#FAFAF7"
                    borderColor="gray.250"
                    _focus={{ borderColor: 'black' }}
                    borderRadius="xl"
                    size="md"
                    color="black"
                  />
                  <Text fontSize="10px" color="gray.400">Helps our admin pair the bank log to your record instantly.</Text>
                </VStack>

                {/* Drag and Drop File Input Uploader (Accessibility & Guidelines Compliant) */}
                <VStack align="flex-start" spaceY={1.5}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">Proof Image Document *</Text>
                  <Box
                    w="full"
                    py={10}
                    px={6}
                    bg={isDragOver ? '#FAFAF7' : 'white'}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={isDragOver ? '#C65D3A' : 'gray.250'}
                    borderRadius="2xl"
                    _hover={{ borderColor: 'black', bg: '#FAFAF7' }}
                    cursor="pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInputClick}
                    transition="all 0.2s ease"
                    align="center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <VStack spaceY={2}>
                      <Upload size={28} color={isDragOver ? '#C65D3A' : 'gray'} />
                      <Text fontSize="xs" fontWeight="bold" color="black">
                        {selectedFile ? 'Change Receipt File' : 'Drag & drop your screenshot here, or click to browse'}
                      </Text>
                      <Text fontSize="10px" color="gray.400">Supports PNG, JPG, or JPEG formats up to 5MB</Text>
                    </VStack>
                  </Box>

                  {/* Selected File Badge */}
                  {selectedFile && (
                    <Flex bg="emerald.50" color="emerald.700" p={3} borderRadius="xl" align="center" gap={2} mt={1} fontSize="11px" fontWeight="bold" w="full">
                      <CheckCircle size={14} />
                      <Text>Success: Selected File: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</Text>
                    </Flex>
                  )}
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
                  shadow="sm"
                  w="full"
                  mt={2}
                >
                  Confirm payment proof & Lock order
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
