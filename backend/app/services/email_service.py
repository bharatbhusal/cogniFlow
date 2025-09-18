import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from app.config.env import get_settings
from app.utils.logger import log

settings = get_settings()


def generate_email_html(subject: str, text: str) -> str:
    """Generate HTML template for emails"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{subject}</title>
        <style>
            @media only screen and (max-width: 600px) {{
                .container {{
                    padding: 16px !important;
                }}
                .main-content {{
                    font-size: 1em !important;
                }}
                .footer {{
                    font-size: 0.95em !important;
                }}
            }}
        </style>
    </head>
    <body style="margin:0; padding:0; background:#f6f8fa;">
        <div class="container" style="max-width: 520px; margin: 32px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(30,40,90,0.07); padding: 40px;">
            <div style="text-align: center;">
                <h2 style="color: #1a237e; margin-bottom: 8px; font-size: 1.7em; letter-spacing: 0.5px; font-family: 'Segoe UI', Arial, sans-serif;">{subject}</h2>
            </div>
            <div class="main-content" style="color: #333; font-size: 1.08em; margin: 28px 0 36px 0; line-height: 1.7; font-family: 'Segoe UI', Arial, sans-serif;">
                {text.replace('\n', '<br>')}
            </div>
            <footer class="footer" style="border-top: 1px solid #e3e8f0; padding-top: 18px; text-align: center; color: #888; font-family: 'Segoe UI', Arial, sans-serif;">
                <p style="margin: 0 0 4px 0;">Best regards,</p>
                <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a237e;">CogniFlow – AI Document Intelligence</p>
                <a href="mailto:superadmin@bharatbhusal.com" style="display: inline-block; margin-top: 10px; color: #fff; background: #1a237e; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-size: 1em; font-weight: 500;">Contact Support</a>
                <div style="margin-top: 18px; font-size: 0.92em; color: #b0b0b0;">&copy; {datetime.now().year} CogniFlow</div>
            </footer>
        </div>
    </body>
    </html>
    """


class EmailService:
    """Email service for sending OTP and other notifications"""
    
    @staticmethod
    async def send_email(to: str, subject: str, text: str) -> None:
        """Send email using SMTP"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = settings.SMTP_MAIL_ID
            message["To"] = to

            # Create HTML and plain text parts
            text_part = MIMEText(text, "plain")
            html_part = MIMEText(generate_email_html(subject, text), "html")

            # Add parts to message
            message.attach(text_part)
            message.attach(html_part)

            # Create SMTP session based on port
            log(f"Attempting to send email to {to} via {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            
            if settings.SMTP_PORT == 465:
                # Port 465 uses SSL from the start
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                    log("SSL connection established, attempting login...")
                    server.login(settings.SMTP_MAIL_ID, settings.SMTP_PASSWORD)
                    log("Login successful, sending message...")
                    server.send_message(message)
            else:
                # Port 587 uses STARTTLS
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                    log("SMTP connection established, upgrading to TLS...")
                    server.starttls()  # Enable security
                    log("TLS enabled, attempting login...")
                    server.login(settings.SMTP_MAIL_ID, settings.SMTP_PASSWORD)
                    log("Login successful, sending message...")
                    server.send_message(message)

            log("Email delivery successful", to)

        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP Authentication failed for {to}: {str(e)}"
            log(error_msg)
            raise Exception(f"Email authentication failed - check SMTP credentials: {str(e)}")
        except smtplib.SMTPConnectError as e:
            error_msg = f"SMTP Connection failed for {to}: {str(e)}"
            log(error_msg)
            raise Exception(f"Email server connection failed: {str(e)}")
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"SMTP Recipients refused for {to}: {str(e)}"
            log(error_msg)
            raise Exception(f"Email recipient rejected: {str(e)}")
        except smtplib.SMTPServerDisconnected as e:
            error_msg = f"SMTP Server disconnected for {to}: {str(e)}"
            log(error_msg)
            raise Exception(f"Email server unexpectedly closed connection: {str(e)}")
        except Exception as e:
            error_msg = f"Failed to send email to {to}: {str(e)}"
            log(error_msg)
            raise Exception(f"Email sending failed: {str(e)}")

    @staticmethod
    async def send_otp_email(to: str, otp: str, purpose: str = "verification") -> None:
        """Send OTP verification email"""
        subject = f"Email Verification - CogniFlow"
        text = f"Your email verification OTP is: {otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this {purpose}, please ignore this email."
        
        await EmailService.send_email(to, subject, text)

    @staticmethod
    async def send_welcome_email(to: str, name: str = "") -> None:
        """Send welcome email after successful registration"""
        subject = "Welcome to CogniFlow!"
        text = f"Hello {name},\n\nWelcome to CogniFlow! Your account has been successfully created.\n\nYou can now start uploading documents and creating intelligent workflows.\n\nGet started by creating your first project!"
        
        await EmailService.send_email(to, subject, text)