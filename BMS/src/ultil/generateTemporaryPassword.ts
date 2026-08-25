import crypto from 'crypto';

/**
 * Generates a highly secure temporary password containing characters, numbers, and symbols.
 * 
 * @param length Total character count string width (Defaults to 10)
 * @returns Secure, readable uppercase temporary password
 */
export const generateTemporaryPassword = (length: number = 10): string => {
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%*';
  let password = '';
  
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const currentByte = randomBytes[i];
    if (currentByte === undefined) {
      continue;
    }

    const randomIndex = currentByte % allowedChars.length;
    password += allowedChars[randomIndex] ?? '';
  }

  return password.toUpperCase();
};
