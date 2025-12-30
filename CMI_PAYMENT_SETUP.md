# CMI Payment Gateway Configuration

This guide will help you configure the CMI (Credit Mutuel International) payment gateway for online reservations.

## Problem

If you see the error: **"CMI payment gateway credentials not configured"** when trying to pay online, you need to add the CMI credentials to your `.env` file.

## Solution

1. **Open your `.env` file** in `morthai-backend/` directory

2. **Add the following variables** to your `.env` file:

```env
# CMI Payment Gateway
CMI_CLIENT_ID=
CMI_STORE_KEY=
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

3. **Save the file**

4. **Restart your backend server**:

```bash
cd morthai-backend
npm run dev
```

## Complete .env Example

Here's what your complete `.env` file should look like:

```env
# Database Configuration


# Authentication
JWT_SECRET=morthai-secret-key-2025

# CMI Payment Gateway
CMI_CLIENT_ID=
CMI_STORE_KEY=
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# UltraMsg WhatsApp API (optional)
ULTRAMSG_INSTANCE_ID=your_instance_id
ULTRAMSG_TOKEN=your_token
```

## Verify Configuration

After adding the credentials and restarting the server:

1. Try to make a reservation with "Pay Online" option
2. If configured correctly, you should be redirected to CMI payment page
3. If you still see the error, check:
   - The `.env` file is in the `MTS-backend/` directory
   - No typos in variable names (they are case-sensitive)
   - The backend server was restarted after adding credentials

## Temporary Workaround

If you don't want to configure CMI right now, users can still make reservations by selecting **"Payer au Spa"** (Pay at Spa) option. The reservation will be created successfully and can be paid for at the spa location.

## Production Environment

For production, you should:
- Use HTTPS URLs in `BASE_URL` and `BACKEND_URL`
- Store credentials securely (use environment variables, not hardcoded values)
- Use production CMI credentials (contact CMI for production credentials)

## Exemple de Calcul de Hash CMI

Pour intégrer un autre compte CMI dans un autre site web, voici un exemple détaillé du calcul de hash avec des valeurs concrètes.

### Données d'exemple

```javascript
// Données de paiement
const postData = {
  clientid: "600000000",
  amount: "500.00",
  okUrl: "https://monsite.com/payment/success",
  failUrl: "https://monsite.com/payment/fail",
  TranType: "PreAuth",
  callbackUrl: "https://monsite.com/api/payment/callback",
  shopurl: "https://monsite.com",
  currency: "504",
  rnd: "1704123456789",
  storetype: "3D_PAY_HOSTING",
  hashAlgorithm: "ver3",
  lang: "fr",
  refreshtime: "5",
  BillToName: "Jean Dupont",
  BillToCompany: "",
  BillToStreet1: "123 Rue Example",
  BillToCity: "Casablanca",
  BillToStateProv: "",
  BillToPostalCode: "20000",
  BillToCountry: "504",
  email: "jean.dupont@example.com",
  tel: "0612345678",
  encoding: "UTF-8",
  oid: "CMD-2024-001",
  AutoRedirect: "true"
};

// Clé secrète CMI (Store Key)
const storeKey = "VOTRE_CLE_SECRETE_CMI_123456789";
```

### Étape 1 : Trier les paramètres par ordre alphabétique (insensible à la casse)

Les paramètres doivent être triés par ordre alphabétique, en ignorant la casse. Les paramètres `hash` et `encoding` sont exclus du calcul.

**Paramètres triés :**
```
AutoRedirect
BillToCity
BillToCompany
BillToCountry
BillToName
BillToPostalCode
BillToStateProv
BillToStreet1
callbackUrl
clientid
currency
email
failUrl
hashAlgorithm
lang
oid
okUrl
refreshtime
rnd
shopurl
storetype
tel
TranType
```

### Étape 2 : Construire la chaîne de hash

Pour chaque paramètre (sauf `hash` et `encoding`), ajouter la valeur échappée suivie de `|` :

**Règles d'échappement :**
- `\` devient `\\`
- `|` devient `\|`

**Chaîne de hash construite :**
```
true|Casablanca||504|Jean Dupont|20000||123 Rue Example|https://monsite.com/api/payment/callback|600000000|504|jean.dupont@example.com|https://monsite.com/payment/fail|ver3|fr|CMD-2024-001|https://monsite.com/payment/success|5|1704123456789|https://monsite.com|3D_PAY_HOSTING|0612345678|PreAuth|500.00|VOTRE_CLE_SECRETE_CMI_123456789
```

### Étape 3 : Calculer le hash SHA512

```javascript
const crypto = require('crypto');

const hashString = "true|Casablanca||504|Jean Dupont|20000||123 Rue Example|https://monsite.com/api/payment/callback|600000000|504|jean.dupont@example.com|https://monsite.com/payment/fail|ver3|fr|CMD-2024-001|https://monsite.com/payment/success|5|1704123456789|https://monsite.com|3D_PAY_HOSTING|0612345678|PreAuth|500.00|VOTRE_CLE_SECRETE_CMI_123456789";

// Générer le hash SHA512 en hexadécimal
const hashHex = crypto.createHash('sha512').update(hashString).digest('hex');
// Résultat : "a1b2c3d4e5f6..." (128 caractères hex)

// Convertir de hex à binaire puis en Base64
const binaryHash = Buffer.from(hashHex, 'hex');
const base64Hash = binaryHash.toString('base64');
// Résultat final : "obLD1O5v..." (88 caractères Base64)
```

### Code JavaScript complet

```javascript
const crypto = require('crypto');

function generateCMIHash(postData, storeKey) {
  // 1. Obtenir toutes les clés des paramètres
  const postParams = Object.keys(postData);
  
  // 2. Trier alphabétiquement (insensible à la casse)
  postParams.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  
  // 3. Construire la chaîne de hash
  let hashval = '';
  
  postParams.forEach(param => {
    const lowerParam = param.toLowerCase();
    
    // Ignorer hash et encoding
    if (lowerParam !== 'hash' && lowerParam !== 'encoding') {
      const paramValue = String(postData[param] || '').trim();
      
      // Échapper les caractères spéciaux
      const escapedValue = paramValue
        .replace(/\\/g, '\\\\')  // \ devient \\
        .replace(/\|/g, '\\|');   // | devient \|
      
      hashval += escapedValue + '|';
    }
  });
  
  // 4. Ajouter la clé secrète (échappée)
  const escapedStoreKey = storeKey
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|');
  
  hashval += escapedStoreKey;
  
  // 5. Générer le hash SHA512
  const hash = crypto.createHash('sha512').update(hashval).digest('hex');
  
  // 6. Convertir de hex à Base64
  const binaryHash = Buffer.from(hash, 'hex');
  const base64Hash = binaryHash.toString('base64');
  
  return base64Hash;
}

// Exemple d'utilisation
const postData = {
  clientid: "600000000",
  amount: "500.00",
  okUrl: "https://monsite.com/payment/success",
  failUrl: "https://monsite.com/payment/fail",
  TranType: "PreAuth",
  callbackUrl: "https://monsite.com/api/payment/callback",
  shopurl: "https://monsite.com",
  currency: "504",
  rnd: "1704123456789",
  storetype: "3D_PAY_HOSTING",
  hashAlgorithm: "ver3",
  lang: "fr",
  refreshtime: "5",
  BillToName: "Jean Dupont",
  BillToCompany: "",
  BillToCity: "Casablanca",
  BillToPostalCode: "20000",
  BillToCountry: "504",
  email: "jean.dupont@example.com",
  tel: "0612345678",
  encoding: "UTF-8",
  oid: "CMD-2024-001",
  AutoRedirect: "true"
};

const storeKey = "VOTRE_CLE_SECRETE_CMI_123456789";
const hash = generateCMIHash(postData, storeKey);

console.log("Hash calculé:", hash);
// Ajouter le hash aux données
postData.HASH = hash;
```

### Points importants

1. **Ordre des paramètres** : Les paramètres doivent être triés par ordre alphabétique (insensible à la casse)
2. **Exclusion** : Les paramètres `hash` et `encoding` ne sont pas inclus dans le calcul
3. **Échappement** : Les caractères `\` et `|` doivent être échappés
4. **Clé secrète** : La clé secrète (Store Key) est ajoutée à la fin de la chaîne, après tous les paramètres
5. **Algorithme** : SHA512, puis conversion hex → binaire → Base64
6. **Valeurs vides** : Les valeurs vides sont représentées par une chaîne vide `""`

### Vérification du hash

Pour vérifier que votre hash est correct, vous pouvez utiliser l'outil de test CMI ou comparer avec le hash généré par votre backend. Le hash doit correspondre exactement à celui attendu par CMI.

## Support

For issues related to CMI payment gateway, refer to the `Readme.md` file in the root directory for detailed integration documentation.

