from flask_mail import Mail, Message
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with app configuration"""
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp-mail.outlook.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    mail.init_app(app)
    logger.info("Email service initialized")

def create_confirmation_email_body(booking_data):
    """Create HTML email body for booking confirmation"""
    seat_info = booking_data.get('seat_info', {})

    # Format seat location
    if seat_info.get('side'):
        seat_location = f"Layer {seat_info['layer']} - {seat_info['side'].capitalize()} Side - Position {seat_info['position']}"
    else:
        seat_location = f"Layer {seat_info['layer']} - Position {seat_info['position']}"

    # Determine seat type description
    seat_type = seat_info.get('seat_type', 'regular')
    type_descriptions = {
        'regular_top': 'Regular Top Section',
        'perpendicular_front': 'Premium Perpendicular Front Section',
        'regular_bottom': 'Regular Bottom Section',
        'regular': 'Regular Section'
    }
    seat_type_desc = type_descriptions.get(seat_type, 'Regular Section')

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4CAF50;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 0 0 5px 5px;
            }}
            .booking-details {{
                background-color: white;
                padding: 15px;
                margin: 15px 0;
                border-left: 4px solid #4CAF50;
            }}
            .detail-row {{
                margin: 10px 0;
            }}
            .label {{
                font-weight: bold;
                color: #555;
            }}
            .value {{
                color: #333;
            }}
            .price {{
                font-size: 24px;
                color: #4CAF50;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #777;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Booking Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear {booking_data['user_name']},</p>
            <p>Thank you for your booking! We're excited to confirm your annual seat reservation.</p>

            <div class="booking-details">
                <h2>Booking Details</h2>

                <div class="detail-row">
                    <span class="label">Booking ID:</span>
                    <span class="value">#{booking_data['booking_id']}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Seat Location:</span>
                    <span class="value">{seat_location}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Seat Type:</span>
                    <span class="value">{seat_type_desc}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Annual Price:</span>
                    <span class="price">${seat_info['price']}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Customer Name:</span>
                    <span class="value">{booking_data['user_name']}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">{booking_data['user_email']}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Booking Date:</span>
                    <span class="value">{booking_data['booking_date']}</span>
                </div>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Your seat is now reserved for the year</li>
                <li>Payment status: Pending</li>
                <li>You will receive payment instructions separately</li>
            </ul>

            <p>If you have any questions or need to make changes to your booking, please contact us.</p>

            <p>Thank you for choosing our service!</p>

            <div class="footer">
                <p>This is an automated confirmation email.</p>
                <p>© 2024 Annual Seat Booking System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Plain text version
    text = f"""
    Booking Confirmation

    Dear {booking_data['user_name']},

    Thank you for your booking! We're excited to confirm your annual seat reservation.

    BOOKING DETAILS:
    ----------------
    Booking ID: #{booking_data['booking_id']}
    Seat Location: {seat_location}
    Seat Type: {seat_type_desc}
    Annual Price: ${seat_info['price']}
    Customer Name: {booking_data['user_name']}
    Email: {booking_data['user_email']}
    Booking Date: {booking_data['booking_date']}

    WHAT'S NEXT:
    - Your seat is now reserved for the year
    - Payment status: Pending
    - You will receive payment instructions separately

    If you have any questions or need to make changes to your booking, please contact us.

    Thank you for choosing our service!

    ---
    This is an automated confirmation email.
    © 2024 Annual Seat Booking System. All rights reserved.
    """

    return html, text

def send_booking_confirmation(booking_data):
    """
    Send booking confirmation email

    Args:
        booking_data: Dictionary containing:
            - booking_id: Booking ID
            - user_name: Customer name
            - user_email: Customer email
            - booking_date: Booking date
            - seat_info: Dictionary with seat details (layer, side, position, price, seat_type)

    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Validate required fields
        required_fields = ['booking_id', 'user_name', 'user_email', 'booking_date', 'seat_info']
        for field in required_fields:
            if field not in booking_data:
                raise ValueError(f"Missing required field: {field}")

        # Create email message
        subject = f"Booking Confirmation - Seat #{booking_data['booking_id']}"

        html_body, text_body = create_confirmation_email_body(booking_data)

        msg = Message(
            subject=subject,
            recipients=[booking_data['user_email']],
            body=text_body,
            html=html_body
        )

        # Send email
        mail.send(msg)

        logger.info(f"Confirmation email sent successfully to {booking_data['user_email']} for booking #{booking_data['booking_id']}")
        return True, "Email sent successfully"

    except Exception as e:
        error_msg = f"Failed to send confirmation email: {str(e)}"
        logger.error(error_msg)

        # Log error to file
        try:
            import os
            from datetime import datetime
            error_log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'erroremail.md')

            with open(error_log_path, 'a') as f:
                f.write(f"\n## Email Error - {datetime.now().isoformat()}\n\n")
                f.write(f"**Booking ID:** {booking_data.get('booking_id', 'N/A')}\n\n")
                f.write(f"**Recipient:** {booking_data.get('user_email', 'N/A')}\n\n")
                f.write(f"**Error:** {str(e)}\n\n")
                f.write(f"**Full Details:**\n```\n{error_msg}\n```\n\n")
                f.write("---\n")
        except Exception as log_error:
            logger.error(f"Failed to write error log: {str(log_error)}")

        return False, error_msg
