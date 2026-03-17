function validateName(name) {
  if (typeof name !== 'string') return false;

  const trimmed = name.trim();

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;

  return nameRegex.test(trimmed);
}

function validateProductName(productName) {
  if (typeof productName !== 'string' || productName.trim().length < 3 || productName.length > 100) {
    return false;
  }
  
  // Regex pattern based on examples:
  // - Words: [A-Za-z0-9'-]+ (alphanumeric, hyphen, apostrophe)
  // - Optional parens: \s*\([^)]*\)? (allows specs like "(Size 10, Black)")
  // - Overall: ^(word+( optional_parens word*))$
  const pattern = /^[A-Za-z0-9'-]+(?:\s+[A-Za-z0-9'-]+)*(?:\s*\([^)]*\))?(?:\s+[A-Za-z0-9'-]+)*$/;
  
  return pattern.test(productName.trim());
}

function validateIndianPhone(phoneNumber) {
  if (typeof phoneNumber !== 'string' || !phoneNumber) {
    return false;
  }

  const cleanedNumber = phoneNumber.replace(/[\s\-()]/g, '');

  const pattern1 = /^[6-9]\d{9}$/;

  const pattern2 = /^\+91[6-9]\d{9}$/;

  const pattern3 = /^91[6-9]\d{9}$/;

  const pattern4 = /^0[6-9]\d{9}$/;

  return (
    pattern1.test(cleanedNumber) ||
    pattern2.test(cleanedNumber) ||
    pattern3.test(cleanedNumber) ||
    pattern4.test(cleanedNumber)
  );
}

function validateEmail(email) {
  if (typeof email !== 'string' || !email) {
    return false;
  }

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return false;
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(trimmedEmail)) {
    return false;
  }

  const parts = trimmedEmail.split('@');

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;

  if (localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  if (localPart.includes('..')) {
    return false;
  }

  if (domainPart.length === 0 || domainPart.length > 255) {
    return false;
  }

  if (
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    domainPart.startsWith('-') ||
    domainPart.endsWith('-')
  ) {
    return false;
  }

  if (domainPart.includes('..')) {
    return false;
  }

  if (!domainPart.includes('.')) {
    return false;
  }

  return true;
}

function validateIndianPincode(pincode) {
  if (pincode === null || pincode === undefined) {
    return false;
  }

  const pincodeStr = String(pincode).trim();

  if (!pincodeStr) {
    return false;
  }

  const pincodePattern = /^[1-9][0-9]{5}$/;

  if (!pincodePattern.test(pincodeStr)) {
    return false;
  }

  const firstDigit = parseInt(pincodeStr[0]);

  if (firstDigit < 1 || firstDigit > 9) {
    return false;
  }

  return true;
}

function validateBusinessName(businessName) {
  if (typeof businessName !== 'string') {
    return false;
  }

  const trimmedName = businessName.trim();

  if (trimmedName.length === 0) {
    return false;
  }

  if (trimmedName.length < 2) {
    return false;
  }

  if (trimmedName.length > 150) {
    return false;
  }

  if (!/[a-zA-Z]/.test(trimmedName)) {
    return false;
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s&\-'.,()]+$/;
  if (!validCharactersRegex.test(trimmedName)) {
    return false;
  }

  if (/\s{3,}/.test(trimmedName)) {
    return false;
  }

  if (/^[^a-zA-Z0-9]|[^a-zA-Z0-9)]$/.test(trimmedName)) {
    return false;
  }

  return true;
}

function validateIndianGST(gstNumber) {
  if (typeof gstNumber !== 'string') {
    return false;
  }

  const gst = gstNumber.trim().toUpperCase();

  if (gst.length === 0) {
    return false;
  }

  if (gst.length !== 15) {
    return false;
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(gst)) {
    return false;
  }

  const stateCode = parseInt(gst.substring(0, 2));
  const validStateCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 97, 99,
  ];

  if (!validStateCodes.includes(stateCode)) {
    return false;
  }

  const panPart = gst.substring(2, 12);

  const typeOfHolder = panPart.charAt(0);
  const validTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];

  if (!validTypes.includes(typeOfHolder)) {
    return false;
  }

  return true;
}

function validateAddress(address) {
  if (typeof address !== 'string') {
    return false;
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    return false;
  }

  if (trimmedAddress.length < 10) {
    return false;
  }

  if (trimmedAddress.length > 500) {
    return false;
  }

  if (!/[a-zA-Z]/.test(trimmedAddress)) {
    return false;
  }

  if (!/[0-9]/.test(trimmedAddress)) {
    return false;
  }

  return true;
}

function greeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

function validatePrice(price) {
  const num = Number(price);
  return !isNaN(num) && num >= 0;
}

export {
  validateName,
  validateIndianPhone,
  validateEmail,
  validateIndianPincode,
  validateBusinessName,
  validateIndianGST,
  validateAddress,
  greeting,
  validatePrice,
  validateProductName,
};
