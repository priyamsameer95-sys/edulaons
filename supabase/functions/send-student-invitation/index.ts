import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentInvitationRequest {
  studentEmail: string;
  studentName: string;
  caseId: string;
  partnerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, caseId, partnerName }: StudentInvitationRequest = await req.json();

    console.log(`Sending invitation to student: ${studentEmail}`);

    const emailResponse = await resend.emails.send({
      from: "EduFund <onboarding@resend.dev>",
      to: [studentEmail],
      subject: "Welcome to EduFund - Your Education Loan Application",
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
              .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to EduFund! 🎓</h1>
              </div>
              <div class="content">
                <p>Dear ${studentName},</p>
                
                <p>Great news! ${partnerName} has submitted your education loan application to EduFund. We're excited to help you achieve your educational goals.</p>
                
                <div class="info-box">
                  <strong>Your Application Details:</strong><br>
                  Case ID: <strong>${caseId}</strong>
                </div>
                
                <p>To complete your application, please:</p>
                <ol>
                  <li>Click the button below to access your dashboard</li>
                  <li>Review and verify your application details</li>
                  <li>Upload any required documents</li>
                  <li>Track your application status in real-time</li>
                </ol>
                
                <center>
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.lovable.app'}/student" class="button">
                    Access Your Dashboard
                  </a>
                </center>
                
                <p>If you have any questions or need assistance, our support team is here to help!</p>
                
                <p>Best regards,<br>The EduFund Team</p>
              </div>
              <div class="footer">
                <p>This email was sent by EduFund. Please do not reply to this email.</p>
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
    console.error("Error in send-student-invitation function:", error);
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
