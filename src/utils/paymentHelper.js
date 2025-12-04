import crypto from 'crypto';

/**
 * Sanitize payment data for CMI gateway
 * @param {string} string - String to sanitize
 * @param {boolean} isEmail - Whether the string is an email
 * @returns {string} Sanitized string
 */
export function handlePaymentData(string, isEmail = false) {
  // Character replacement map (remove accents and special chars)
  const charMap = {
    'Š': 'S', 'š': 's', 'Ð': 'Dj', 'Ž': 'Z', 'ž': 'z',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A',
    'Å': 'A', 'Æ': 'A', 'Ç': 'C', 'È': 'E', 'É': 'E',
    'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I',
    'Ï': 'I', 'Ñ': 'N', 'Ń': 'N', 'Ò': 'O', 'Ó': 'O',
    'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U',
    'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'Þ': 'B',
    'ß': 'Ss', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
    'ä': 'a', 'å': 'a', 'æ': 'a', 'ç': 'c', 'è': 'e',
    'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i',
    'î': 'i', 'ï': 'i', 'ð': 'o', 'ñ': 'n', 'ń': 'n',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'þ': 'b', 'ÿ': 'y', 'ƒ': 'f',
    'ă': 'a', 'ș': 's', 'ț': 't', 'Ă': 'A', 'Ș': 'S', 'Ț': 'T'
  };
  
  let result = string;
  
  // Replace special characters
  for (const [char, replacement] of Object.entries(charMap)) {
    result = result.replace(new RegExp(char, 'g'), replacement);
  }
  
  // For emails, only allow specific characters
  if (isEmail) {
    result = result.replace(/[^a-zA-Z0-9@._-]/g, '');
  } else {
    // For other fields, remove or replace problematic characters
    result = result.replace(/[<>]/g, '');
  }
  
  return result;
}

/**
 * Generate CMI payment hash
 * @param {Object} postData - Payment data object
 * @param {string} storeKey - CMI store key
 * @returns {string} Base64 encoded hash
 */
export function generateHash(postData, storeKey) {
  // Get all parameter keys
  const postParams = Object.keys(postData);
  
  // Sort alphabetically (case-insensitive)
  postParams.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  
  // Build hash string
  let hashval = '';
  
  postParams.forEach(param => {
    const lowerParam = param.toLowerCase();
    
    // Skip hash and encoding parameters
    if (lowerParam !== 'hash' && lowerParam !== 'encoding') {
      const paramValue = String(postData[param] || '').trim();
      
      // Escape special characters
      const escapedValue = paramValue
        .replace(/\\/g, '\\\\')
        .replace(/\|/g, '\\|');
      
      hashval += escapedValue + '|';
    }
  });
  
  // Add store key (escaped)
  const escapedStoreKey = storeKey
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|');
  
  hashval += escapedStoreKey;
  
  // Generate SHA512 hash
  const hash = crypto.createHash('sha512').update(hashval).digest('hex');
  
  // Convert hex to binary and encode to Base64
  const binaryHash = Buffer.from(hash, 'hex');
  const base64Hash = binaryHash.toString('base64');
  
  return base64Hash;
}

/**
 * Verify CMI payment response hash
 * @param {Object} response - Payment response from CMI
 * @param {string} storeKey - CMI store key
 * @returns {string} Verification result: 'POSTAUTH', 'APPROVED', or 'FAILURE'
 */
export function verifyHash(response, storeKey) {
  const postParams = Object.keys(response);
  
  // Sort alphabetically (case-insensitive)
  postParams.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  
  let hashval = '';
  
  postParams.forEach(param => {
    const lowerParam = param.toLowerCase();
    
    // Skip hash and encoding
    if (lowerParam !== 'hash' && lowerParam !== 'encoding') {
      const paramValue = String(response[param] || '').trim();
      
      // Decode HTML entities and remove trailing newlines
      const decodedValue = paramValue
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n$/, '');
      
      // Escape special characters
      const escapedValue = decodedValue
        .replace(/\\/g, '\\\\')
        .replace(/\|/g, '\\|');
      
      hashval += escapedValue + '|';
    }
  });
  
  // Add store key (escaped)
  const escapedStoreKey = storeKey
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|');
  
  hashval += escapedStoreKey;
  
  // Generate hash
  const hash = crypto.createHash('sha512').update(hashval).digest('hex');
  const binaryHash = Buffer.from(hash, 'hex');
  const calculatedHash = binaryHash.toString('base64');
  
  const receivedHash = response.HASH || response.hash;
  
  if (calculatedHash === receivedHash) {
    // Hash is valid
    if (response.ProcReturnCode === '00') {
      return 'POSTAUTH'; // Payment successful
    } else {
      return 'APPROVED'; // Payment approved but may need further action
    }
  } else {
    return 'FAILURE'; // Hash verification failed
  }
}

/**
 * Create payment request data for CMI
 * @param {Object} orderData - Order/reservation data
 * @param {string} clientId - CMI client ID
 * @param {string} storeKey - CMI store key
 * @param {Object} urls - Payment URLs configuration
 * @returns {Object} Payment request data with hash
 */
export function createPaymentRequest(orderData, clientId, storeKey, urls) {
  const {
    firstName,
    lastName,
    email,
    phone,
    amount,
    reference,
    address = '',
    postalCode = ''
  } = orderData;

  const postData = {
    clientid: clientId,
    amount: amount.toString(),
    okUrl: urls.successUrl,
    failUrl: urls.failUrl,
    TranType: 'PreAuth',
    callbackUrl: urls.callbackUrl,
    shopurl: urls.shopUrl,
    currency: '504', // MAD - Moroccan Dirham
    rnd: Date.now().toString(),
    storetype: '3D_PAY_HOSTING',
    hashAlgorithm: 'ver3',
    lang: 'fr',
    refreshtime: '5',
    BillToName: handlePaymentData(`${firstName} ${lastName}`),
    BillToCompany: '',
    BillToStreet1: handlePaymentData(address),
    BillToCity: '',
    BillToStateProv: '',
    BillToPostalCode: handlePaymentData(postalCode),
    BillToCountry: '504', // Morocco
    email: handlePaymentData(email, true),
    tel: phone.replace(/\s/g, ''), // Remove spaces from phone
    encoding: 'UTF-8',
    oid: reference, // Order reference
    AutoRedirect: 'true'
  };
  
  // Generate hash
  postData.HASH = generateHash(postData, storeKey);
  
  return postData;
}

/**
 * Generate HTML form for CMI payment
 * @param {Object} postData - Payment request data
 * @returns {string} HTML form string
 */
export function generatePaymentForm(postData) {
  let formHtml = '<form action="https://payment.cmi.co.ma/fim/est3Dgate" method="POST" name="pay_form" id="cmi_payment_form">';
  
  Object.keys(postData).forEach(key => {
    formHtml += `<input type="hidden" name="${key}" value="${String(postData[key]).replace(/"/g, '&quot;')}">`;
  });
  
  formHtml += '</form>';
  formHtml += '<script>document.getElementById("cmi_payment_form").submit();</script>';
  
  return formHtml;
}

