/**
 * Generates an executive-grade HTML email payload for password reset OTP delivery.
 * Matches your exact block margins, monospace borders, and custom shield warnings.
 */
export const passwordResetOtpEmailContent = (name:string, otp_code:string) => {
  return `
    <div style="background: #F7F9FB; padding: 40px 20px; font-family: 'Montserrat', Arial, sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; text-align: left;">
            
            <!-- Core Transaction Body -->
            <div style="padding: 32px 24px;">
                <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset Verification</h2>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 24px;">
                    Hello <strong>${name}</strong>, we received a request to override or modify the password credentials linked to your workstation account. 
                </p>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 16px;">
                    Kindly utilize the secure 6-digit verification code block assigned below to complete your system security reset:
                </p>

                <!-- Data Display Grid Block -->
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                    <div style="font-size: 14px; color: #4B5563; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">
                        Your Security OTP Code
                    </div>
                    <div style="font-family: monospace; background: #E5E7EB; padding: 8px 16px; border-radius: 6px; color: #111827; font-size: 28px; font-weight: 800; letter-spacing: 6px; display: inline-block;">
                        ${otp_code}
                    </div>
                </div>

                <!-- Amber Shield Protocol Warning -->
                <div style="border-left: 4px solid #D97706; background: #FEF3C7; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 18px; font-weight: 500;">
                        <strong>🔒 Expiration Gate:</strong> For your transactional safety, this token code expires in exactly <strong>5 minutes</strong>. If you did not initialize this request, your account remains secure; please disregard this notification layout block.
                    </p>
                </div>
            </div>

        </div>
    </div>
  `;
};
