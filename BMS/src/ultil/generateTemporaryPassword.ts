import crypto from 'crypto';

/**
 * Generates a highly secure temporary password containing characters, numbers, and symbols.
 * 
 * @param length Total character count string width (Defaults to 10)
 * @returns Secure, readable uppercase temporary password
 */
export const generateTemporaryPassword = (length: number = 10): string => {
  // 💡 Premium secure characters matrix: Mixed letters, numbers, and clear symbols
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%*';
  let password = '';
  
  // Calculate secure random bytes arrays natively in memory
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    // Map each secure byte cleanly back into our mixed character matrix pool
    const randomIndex = randomBytes[i] % allowedChars.length;
    password += allowedChars[randomIndex];
  }

  // Ensures everything remains uniform and highly legible
  return password.toUpperCase();
};
