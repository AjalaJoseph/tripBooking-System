export const staffWelcomeEmailContent = (data:any) =>{
   return `
    <div style="background: #F7F9FB; padding: 40px 20px; font-family: 'Montserrat', Arial, sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; text-align: left;">
            
            <!-- Core Transaction Body -->
            <div style="padding: 32px 24px;">
                <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Welcome to the Team!</h2>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 24px;">
                    Hello <strong>${data.staff_name}</strong>, your shop administrator <strong>${data.owner_name}</strong> has successfully created your management terminal profile. 
                </p>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 16px;">
                    Kindly utilize the secure credential parameters assigned below to sign into your workstation terminal:
                </p>

                <!-- Data Display Grid Block -->
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <div style="margin-bottom: 10px; font-size: 14px; color: #4B5563;">
                        <strong style="width: 130px; display: inline-block; color: #9CA3AF;">Username:</strong> 
                        <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 4px; color: #111827; font-weight: bold;">${data.staff_name}</span>
                    </div>
                    <div style="margin-bottom: 10px; font-size: 14px; color: #4B5563;">
                        <strong style="width: 130px; display: inline-block; color: #9CA3AF;">Login Email:</strong> 
                        <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 4px; color: #111827; font-weight: bold;">${data.staff_email}</span>
                    </div>
                    <div style="font-size: 14px; color: #4B5563;">
                        <strong style="width: 130px; display: inline-block; color: #9CA3AF;">Temporary Password:</strong> 
                        <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 4px; color: #111827; font-weight: bold;">${data.password}</span>
                    </div>
                </div>
                <!-- Amber Shield Protocol Warning -->
                <div style="border-left: 4px solid #D97706; background: #FEF3C7; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 18px; font-weight: 500;">
                        <strong>🔒 Security Shield:</strong> For your transactional safety, you will be required to change this default password to a private password upon your very first system sign-in session.
                    </p>
                </div>
            </div>

        </div>
    </div>
  `;
}