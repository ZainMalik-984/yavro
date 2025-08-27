import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioException


class SMSService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")

        if not all([self.account_sid, self.auth_token, self.from_number]):
            logging.warning("Twilio credentials not found. SMS disabled.")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)

    def send_sms(self, to_number: str, message: str) -> bool:
        if not self.client:
            logging.warning("SMS not sent - Twilio not configured")
            return False

        try:
            formatted_number = ''.join(
                c for c in to_number if c.isdigit() or c == '+')
            if not formatted_number.startswith('+'):
                # Handle Pakistani numbers (+92)
                if (formatted_number.startswith('0') and
                        len(formatted_number) == 11):
                    # Remove leading 0 and add +92 
                    # (e.g., 03104488799 -> +923104488799)
                    formatted_number = '+92' + formatted_number[1:]
                elif (formatted_number.startswith('92') and
                        len(formatted_number) == 12):
                    # Already has 92, just add + 
                    # (e.g., 923104488799 -> +923104488799)
                    formatted_number = '+' + formatted_number
                elif len(formatted_number) == 10:
                    # 10-digit number, add +92 
                    # (e.g., 3104488799 -> +923104488799)
                    formatted_number = '+92' + formatted_number
                else:
                    # Default to Pakistani format
                    formatted_number = '+92' + formatted_number
            print("HHHHHHHHHHHHHHHHHHH", formatted_number, self.from_number, message)
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=formatted_number
            )

            logging.info(f"SMS sent to {formatted_number}. SID: {message.sid}")
            return True

        except TwilioException as e:
            logging.error(f"Twilio SMS error: {str(e)}")
            return False
        except Exception as e:
            logging.error(f"Error sending SMS: {str(e)}")
            return False

    def send_reward_notification(self, phone_number: str, user_name: str,
                                 reward_type: str, tier_name: str,
                                 visit_count: int) -> bool:
        if reward_type == "free_coffee":
            message = (f"🎉 Congratulations {user_name}! You've earned a FREE COFFEE "
                       f"at {tier_name} tier (visit #{visit_count}). "
                       f"Come claim your reward!")
        elif reward_type == "discount":
            message = (f"🎉 Congratulations {user_name}! You've earned a DISCOUNT "
                       f"at {tier_name} tier (visit #{visit_count}). "
                       f"Come claim your reward!")
        elif reward_type == "spinner":
            message = (f"🎉 Congratulations {user_name}! You've unlocked the "
                       f"SPINNER WHEEL at {tier_name} tier (visit #{visit_count}). "
                       f"Come spin for your reward!")
        else:
            message = (f"🎉 Congratulations {user_name}! You've earned a reward "
                       f"at {tier_name} tier (visit #{visit_count}). "
                       f"Come claim your reward!")

        return self.send_sms(phone_number, message)

    def send_tier_progress_notification(self, phone_number: str, user_name: str,
                                        current_visits: int, next_tier_name: str,
                                        visits_remaining: int) -> bool:
        message = (f"Hi {user_name}! You're making great progress! "
                   f"You have {current_visits} visits. "
                   f"Just {visits_remaining} more visit{'s' if visits_remaining != 1 else ''} "
                   f"to reach {next_tier_name} tier! 🚀")

        return self.send_sms(phone_number, message)


sms_service = SMSService()
