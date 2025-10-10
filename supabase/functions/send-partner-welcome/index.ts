import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerWelcomeRequest {
  partnerEmail: string;
  partnerName: string;
  partnerCode: string;
  temporaryPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerEmail, partnerName, partnerCode, temporaryPassword }: PartnerWelcomeRequest = await req.json();

    console.log(`Sending welcome email to partner: ${partnerEmail}`);

    const emailResponse = await resend.emails.send({
      from: "EduFund <onboarding@resend.dev>",
      to: [partnerEmail],
      subject: "Welcome to EduFund Partner Program! 🤝",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .credentials-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
              .credential-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; }
              .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to EduFund! 🎉</h1>
              </div>
              <div class="content">
                <p>Dear ${partnerName},</p>
                
                <p>Congratulations! Your partner account has been successfully created. We're thrilled to have you join the EduFund partner network.</p>
                
                <div class="credentials-box">
                  <strong>Your Login Credentials:</strong>
                  <div class="credential-item">
                    <strong>Partner Code:</strong> ${partnerCode}
                  </div>
                  <div class="credential-item">
                    <strong>Email:</strong> ${partnerEmail}
                  </div>
                  <div class="credential-item">
                    <strong>Temporary Password:</strong> ${temporaryPassword}
                  </div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong><br>
                  Please change your password immediately after your first login. Never share your credentials with anyone.
                </div>
                
                <p>As an EduFund partner, you can:</p>
                <ul>
                  <li>Submit and track student loan applications</li>
                  <li>Manage your student portfolio</li>
                  <li>Access real-time application status updates</li>
                  <li>Upload and verify documents</li>
                  <li>Track your commission and payouts</li>
                </ul>
                
                <center>
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.lovable.app'}/login" class="button">
                    Login to Your Dashboard
                  </a>
                </center>
                
                <p>If you need any assistance or have questions, our support team is always ready to help!</p>
                
                <p>Best regards,<br>The EduFund Team</p>
              </div>
              <div class="footer">
                <p>This email contains sensitive information. Please keep it secure.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partner-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
