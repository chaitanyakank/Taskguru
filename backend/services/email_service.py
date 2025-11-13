import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")


def send_email(to_email: str, subject: str, message: str):
    print(f"📧 send_email called → to={to_email}, from={SENDER_EMAIL}")

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("❌ Missing SENDER_EMAIL or SENDER_PASSWORD in .env")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email

        html_part = MIMEText(message, "html", "utf-8")
        msg.attach(html_part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.Login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

        print(f"✅ Email sent successfully to {to_email}")

    except Exception as e:
        print(f"❌ Email sending failed: {e}")


if __name__ == "__main__":
    send_email(
        "yourtestemail@gmail.com",
        "TaskGuru Test Email",
        "<h2>Hello 👋</h2><p>This is a test email from TaskGuru backend. 🚀</p>"
    )
