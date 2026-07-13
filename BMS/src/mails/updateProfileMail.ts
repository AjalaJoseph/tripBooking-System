export const generateStaffUpdateProfile = (data:any) =>{
    return `
    <div style="background: #F7F9FB; padding: 40px 20px; font-family: 'Montserrat', Arial, sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; text-align: left;">
            
            <!-- Brand Header Bar -->
            <div style="background: #065F46; padding: 24px; color: white; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; text-align: center;">
                Biz<span style="color: #FFBF00;">Flow</span>
            </div>

            <!-- Core Transaction Body -->
            <div style="padding: 32px 24px;">
                <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Security Profile Update</h2>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 24px;">
                    Hello <strong>${data.staff_name}</strong>, this is an automated safety alert regarding your workstation management terminal profile.
                </p>
                
                <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 12px;">
                    Your store administrator, <strong>${data.owner_name}</strong>, has modified your account:
                </p>

                <!-- Modified Data Parameters list -->
                <div style="background: #F9FAFB; border-left: 4px solid #065F46; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                     <p style="color: #374151; font-size: 15px; line-height: 24px; margin-bottom: 12px;">
                    Your new profile account data are .
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 20px;">
                        <li style="margin-bottom: 8px; color: #111827; font-weight: 500;">Name: ${data.staff_name}</li>
                        <li style="margin-bottom: 8px; color: #111827; font-weight: 500;">Email: ${data.staff_email}</li>
                        <li style="margin-bottom: 8px; color: #111827; font-weight: 500;">Role: ${data.role}</li>
                    </ul>
                </div>

                <p style="color: #6B7280; font-size: 14px; line-height: 22px; margin-bottom: 24px;">
                    If you did not authorize these operational setting adjustments or suspect unauthorized access, contact your store supervisor immediately to protect terminal transactions.
                </p>

                <!-- Amber Shield Protocol Warning -->
                <div style="border-left: 4px solid #D97706; background: #FEF3C7; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 18px; font-weight: 500;">
                        <strong>🛡️ Protection Protocol:</strong> Your login path and active token keys remain strictly encrypted to safeguard terminal sales logs.
                    </p>
                </div>
            </div>

            <!-- Footer Bar Layout -->
            <div style="background: #F9FAFB; padding: 16px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB;">
                This is an automated system security alert from your BizFlow engine. <br/>
                &copy; ${new Date().getFullYear()} BizFlow. All rights reserved.
            </div>
        </div>
    </div>
  `;
}