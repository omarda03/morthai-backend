import { createPaymentRequest, generatePaymentForm, verifyHash, handlePaymentData } from '../utils/paymentHelper.js';
import { Reservation } from '../models/Reservation.js';
import { Offre } from '../models/Offre.js';
import { sendGiftCardEmail } from '../services/emailService.js';

/**
 * Create payment request for a reservation
 */
export const createPayment = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { firstName, lastName, email, phone, amount, reference } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, phone, amount' 
      });
    }

    // Get reservation to get reference if not provided
    let reservationReference = reference;
    if (!reservationReference && reservationId) {
      try {
        const reservation = await Reservation.getById(reservationId);
        if (reservation && reservation.reference) {
          reservationReference = reservation.reference;
        } else {
          // Use reservation UUID as fallback
          reservationReference = reservationId;
        }
      } catch (err) {
        console.warn('Could not fetch reservation for reference:', err);
        reservationReference = reservationId;
      }
    }

    if (!reservationReference) {
      return res.status(400).json({ 
        error: 'Reference or reservationId is required' 
      });
    }

    // Get CMI credentials from environment
    const clientId = process.env.CMI_CLIENT_ID;
    const storeKey = process.env.CMI_STORE_KEY;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:3001';

    console.log('Payment request environment check:', {
      hasClientId: !!clientId,
      hasStoreKey: !!storeKey,
      baseUrl,
      backendUrl,
      nodeEnv: process.env.NODE_ENV
    });

    if (!clientId || !storeKey) {
      console.error('CMI credentials missing:', {
        CMI_CLIENT_ID: clientId ? 'SET' : 'MISSING',
        CMI_STORE_KEY: storeKey ? 'SET' : 'MISSING'
      });
      return res.status(500).json({ 
        error: 'CMI payment gateway credentials not configured. Please check CMI_CLIENT_ID and CMI_STORE_KEY environment variables.',
        details: {
          hasClientId: !!clientId,
          hasStoreKey: !!storeKey
        }
      });
    }

    // Payment URLs - ensure HTTPS in production
    const urls = {
      successUrl: `${baseUrl}/payment/success`,
      failUrl: `${baseUrl}/payment/fail`,
      callbackUrl: `${backendUrl}/api/payment/callback`,
      shopUrl: baseUrl
    };

    console.log('Payment URLs configured:', urls);

    // Use reservation reference or UUID as order ID
    const orderReference = reservationReference;

    try {
      // Create payment request data
      const paymentData = createPaymentRequest(
        {
          firstName,
          lastName,
          email,
          phone,
          amount,
          reference: orderReference,
          address: '',
          postalCode: ''
        },
        clientId,
        storeKey,
        urls
      );

      console.log('Payment data created successfully for reference:', orderReference);

      // Generate payment form HTML
      const formHtml = generatePaymentForm(paymentData);

      res.json({
        status: 200,
        form: formHtml,
        paymentData: paymentData // For debugging purposes, remove in production
      });
    } catch (paymentError) {
      console.error('Error creating payment request data:', paymentError);
      throw paymentError;
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 500,
      error: error.message || 'An error occurred while creating payment request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Create payment request for an offer
 */
export const createOfferPayment = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { firstName, lastName, email, phone, amount, reference } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, phone, amount' 
      });
    }

    // Get offer to get reference if not provided
    let offerReference = reference;
    if (!offerReference && offerId) {
      try {
        const offer = await Offre.getById(offerId);
        if (offer && offer.codeunique) {
          offerReference = offer.codeunique;
        } else {
          // Use offer UUID as fallback
          offerReference = offerId;
        }
      } catch (err) {
        console.warn('Could not fetch offer for reference:', err);
        offerReference = offerId;
      }
    }

    if (!offerReference) {
      return res.status(400).json({ 
        error: 'Reference or offerId is required' 
      });
    }

    // Get CMI credentials from environment
    const clientId = process.env.CMI_CLIENT_ID;
    const storeKey = process.env.CMI_STORE_KEY;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:3001';

    console.log('Offer payment request environment check:', {
      hasClientId: !!clientId,
      hasStoreKey: !!storeKey,
      baseUrl,
      backendUrl,
      nodeEnv: process.env.NODE_ENV
    });

    if (!clientId || !storeKey) {
      console.error('CMI credentials missing for offer payment:', {
        CMI_CLIENT_ID: clientId ? 'SET' : 'MISSING',
        CMI_STORE_KEY: storeKey ? 'SET' : 'MISSING'
      });
      return res.status(500).json({ 
        error: 'CMI payment gateway credentials not configured. Please check CMI_CLIENT_ID and CMI_STORE_KEY environment variables.',
        details: {
          hasClientId: !!clientId,
          hasStoreKey: !!storeKey
        }
      });
    }

    // Payment URLs - ensure HTTPS in production
    const urls = {
      successUrl: `${baseUrl}/payment/success`,
      failUrl: `${baseUrl}/payment/fail`,
      callbackUrl: `${backendUrl}/api/payment/callback`,
      shopUrl: baseUrl
    };

    console.log('Offer payment URLs configured:', urls);

    // Use offer reference or UUID as order ID
    const orderReference = offerReference;

    try {
      // Create payment request data
      const paymentData = createPaymentRequest(
        {
          firstName,
          lastName,
          email,
          phone,
          amount,
          reference: orderReference,
          address: '',
          postalCode: ''
        },
        clientId,
        storeKey,
        urls
      );

      console.log('Offer payment data created successfully for reference:', orderReference);

      // Generate payment form HTML
      const formHtml = generatePaymentForm(paymentData);

      res.json({
        status: 200,
        form: formHtml,
        paymentData: paymentData // For debugging purposes, remove in production
      });
    } catch (paymentError) {
      console.error('Error creating offer payment request data:', paymentError);
      throw paymentError;
    }
  } catch (error) {
    console.error('Error creating offer payment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 500,
      error: error.message || 'An error occurred while creating payment request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Handle CMI payment callback (server-to-server)
 */
export const paymentCallback = async (req, res) => {
  try {
    const storeKey = process.env.CMI_STORE_KEY;

    if (!storeKey) {
      console.error('CMI_STORE_KEY not configured');
      return res.status(500).send('FAILURE');
    }

    // Verify hash
    const verification = verifyHash(req.body, storeKey);
    
    const { oid, amount, ProcReturnCode, Response, OrderId } = req.body;
    
    console.log('Payment callback received:', {
      orderId: oid,
      amount,
      ProcReturnCode,
      Response,
      OrderId,
      verification
    });

    if (verification !== 'FAILURE') {
      // Try to find reservation first
      let reservation = null;
      let offer = null;
      
      try {
        // First try as UUID (direct lookup for reservation)
        if (oid) {
          reservation = await Reservation.getById(oid);
          
          // If not found by UUID, try to find by reference
          if (!reservation && oid.startsWith('MOR-')) {
            // Query by reference
            const reservations = await Reservation.getAll({ search: oid });
            if (reservations && reservations.length > 0) {
              reservation = reservations[0];
            }
          }

          // If not a reservation, try as offer
          if (!reservation) {
            // Try as offer UUID
            offer = await Offre.getById(oid);
            
            // If not found by UUID, try by codeunique
            if (!offer) {
              offer = await Offre.getByCode(oid);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching reservation/offer:', err);
      }

      if (reservation) {
        // Update reservation status based on payment result
        if (verification === 'POSTAUTH' && ProcReturnCode === '00') {
          // Payment successful
          await Reservation.update(reservation.reservation_uuid, {
            StatusRes: 'confirmed',
            ModePaiement: 'en_ligne'
          });
          console.log(`✅ Payment successful for reservation ${reservation.reservation_uuid}`);
        } else if (verification === 'APPROVED') {
          // Payment approved but may need further action
          await Reservation.update(reservation.reservation_uuid, {
            StatusRes: 'pending',
            ModePaiement: 'en_ligne'
          });
          console.log(`⚠️ Payment approved for reservation ${reservation.reservation_uuid}, but needs verification`);
        }
      } else if (offer) {
        // Update offer status based on payment result
        if (verification === 'POSTAUTH' && ProcReturnCode === '00') {
          // Payment successful - offer is completed
          console.log(`✅ Payment successful for offer ${offer.offre_uuid}`);
          
          // Update offer status to confirmed
          try {
            await Offre.update(offer.offre_uuid, {
              Status: 'confirmé'
            });
            
            // Send gift card email to recipient
            try {
              const emailResult = await sendGiftCardEmail(offer, 'fr');
              if (emailResult.success) {
                console.log(`✅ Gift card email sent successfully to ${offer.EmailBeneficiaire}`);
              } else {
                console.error(`❌ Failed to send gift card email: ${emailResult.error}`);
              }
            } catch (emailError) {
              console.error('Error sending gift card email:', emailError);
              // Don't fail the payment callback if email fails
            }
          } catch (updateError) {
            console.error('Error updating offer status:', updateError);
            // Don't fail the payment callback if update fails
          }
        } else if (verification === 'APPROVED') {
          console.log(`⚠️ Payment approved for offer ${offer.offre_uuid}, but needs verification`);
        }
      } else {
        console.warn(`⚠️ Reservation/Offer not found for order ID: ${oid}`);
      }

      // CMI expects "OK" response for successful callback processing
      res.status(200).send('OK');
    } else {
      console.error('❌ Payment callback hash verification failed');
      res.status(400).send('FAILURE');
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).send('ERROR');
  }
};

/**
 * Verify payment from redirect (success/fail page)
 */
export const verifyPayment = async (req, res) => {
  try {
    const storeKey = process.env.CMI_STORE_KEY;

    if (!storeKey) {
      return res.status(500).json({ 
        error: 'CMI payment gateway not configured' 
      });
    }

    // Verify hash from query parameters
    const verification = verifyHash(req.query, storeKey);
    
    const { oid, amount, ProcReturnCode, Response, OrderId } = req.query;
    
    return res.json({
      success: verification !== 'FAILURE',
      verification,
      orderId: oid,
      amount,
      procReturnCode: ProcReturnCode,
      response: Response,
      cmiOrderId: OrderId
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

