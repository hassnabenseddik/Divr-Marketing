"""
Resend email integration for Divr.

Sends branded confirmation emails to form submitters and a notification
to the admin. All sends are non-blocking: if Resend errors, we log and
swallow so the form submission (which already succeeded + persisted) is
never rolled back.
"""

from __future__ import annotations

import asyncio
import logging
import os
from html import escape
from typing import Any

import resend


logger = logging.getLogger(__name__)


# ---------- config ----------
def _sender_display() -> str:
    """Resend prefers the 'Display Name <address>' form — better inbox UX."""
    addr = os.environ.get("RESEND_SENDER_EMAIL", "divr@divrworld.com")
    return f"Divr <{addr}>"


def _admin_email() -> str | None:
    return os.environ.get("ADMIN_NOTIFICATION_EMAIL") or os.environ.get(
        "RESEND_SENDER_EMAIL"
    )


def _configured() -> bool:
    key = os.environ.get("RESEND_API_KEY")
    if key:
        resend.api_key = key
        return True
    return False


# ---------- brand-styled email shell ----------
# Table-based, inline CSS only — maximum email-client compatibility.
_BRAND_NAVY = "#0B1C2D"
_BRAND_NAVY_DEEP = "#081523"
_BRAND_LIME = "#B7F34A"
_BRAND_CREAM = "#F6F1E8"


def _shell(*, preheader: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Divr</title>
</head>
<body style="margin:0;padding:0;background:{_BRAND_NAVY_DEEP};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:{_BRAND_CREAM};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{_BRAND_NAVY_DEEP};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:{_BRAND_NAVY};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:28px;font-weight:800;letter-spacing:-0.02em;color:{_BRAND_LIME};">Divr</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px 40px;font-size:16px;line-height:1.65;color:{_BRAND_CREAM};">
              {body_html}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:{_BRAND_NAVY_DEEP};border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(246,241,232,0.45);">
              Divr is a registered marketplace platform. Payments protected by Stripe.<br>
              All diving operations and safety remain the responsibility of dive centers and operators.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _para(text: str) -> str:
    return f'<p style="margin:0 0 16px 0;">{escape(text)}</p>'


def _bullets(items: list[str]) -> str:
    lis = "".join(
        f'<li style="margin:0 0 8px 0;padding-left:0;">{escape(i)}</li>' for i in items
    )
    return (
        f'<ul style="margin:0 0 20px 18px;padding:0;color:rgba(246,241,232,0.85);">{lis}</ul>'
    )


def _signoff(closing: str) -> str:
    return (
        f'<p style="margin:24px 0 4px 0;">{escape(closing)},</p>'
        f'<p style="margin:0;color:{_BRAND_LIME};font-weight:600;">Hassna</p>'
        f'<p style="margin:0 0 0 0;color:rgba(246,241,232,0.55);">Founder, Divr</p>'
    )


# ---------- user confirmation templates ----------
def _waitlist_html(first_name: str) -> str:
    body = (
        _para(f"Hi {first_name},")
        + _para("Thanks for joining Divr.")
        + _para(
            "You're now on our early access list. You'll be the first to know when we launch "
            "with verified operators and matching trips in your region."
        )
        + '<p style="margin:20px 0 10px 0;font-weight:600;">What happens next:</p>'
        + _bullets(
            [
                "We'll notify you as soon as trips go live",
                "You'll get early booking access before public launch",
                "No spam, just updates that matter",
            ]
        )
        + _para("Questions? Reply to this email.")
        + _signoff("See you underwater")
    )
    return _shell(preheader="You're on the Divr early access list.", body_html=body)


def _operator_html(first_name: str, business_name: str) -> str:
    body = (
        _para(f"Hi {first_name},")
        + _para("Thanks for applying to join Divr as a founding operator.")
        + _para(
            f"We've received your application for {business_name} and we're reviewing it now."
        )
        + '<p style="margin:20px 0 10px 0;font-weight:600;">What happens next:</p>'
        + _bullets(
            [
                "We review applications within 48 hours",
                "If selected, we'll schedule a quick call to onboard you",
                "You'll get zero commission on your first 10 bookings, plus priority placement at launch",
            ]
        )
        + _para("Questions? Reply to this email.")
        + _signoff("Talk soon")
    )
    return _shell(preheader="We received your Divr application.", body_html=body)


def _guide_html(first_name: str) -> str:
    body = (
        _para(f"Hi {first_name},")
        + _para("Thanks for applying to join Divr as a founding guide.")
        + _para("We've received your application and we're reviewing it now.")
        + '<p style="margin:20px 0 10px 0;font-weight:600;">What happens next:</p>'
        + _bullets(
            [
                "We review applications within 48 hours",
                "If selected, we'll help you list your first packages",
                "You'll get zero commission on your first 10 bookings, plus priority placement at launch",
            ]
        )
        + _para("Questions? Reply to this email.")
        + _signoff("Talk soon")
    )
    return _shell(preheader="We received your Divr application.", body_html=body)


# ---------- admin notification template ----------
def _notification_html(
    *,
    first_name: str,
    last_name: str,
    email: str,
    country: str,
    form_type: str,
    timestamp: str,
    extras: dict[str, Any] | None = None,
) -> str:
    rows = [
        ("Form type", form_type),
        ("Name", f"{first_name} {last_name}".strip()),
        ("Email", email),
        ("Country", country),
    ]
    if extras:
        for k, v in extras.items():
            if v:
                rows.append((k, str(v)))
    rows.append(("Submitted", timestamp))

    row_html = "".join(
        f"""<tr>
              <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(246,241,232,0.55);font-size:13px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">{escape(k)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:{_BRAND_CREAM};font-size:15px;">{escape(v)}</td>
            </tr>"""
        for k, v in rows
    )

    body = (
        f'<p style="margin:0 0 16px 0;font-size:14px;color:rgba(246,241,232,0.6);text-transform:uppercase;letter-spacing:0.12em;">New submission</p>'
        f'<p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:{_BRAND_CREAM};">{escape(form_type.title())} form</p>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.02);border-radius:12px;overflow:hidden;">{row_html}</table>'
        f'<p style="margin:28px 0 0 0;"><a href="https://divr.world/admin" style="display:inline-block;padding:12px 22px;border-radius:999px;background:{_BRAND_LIME};color:{_BRAND_NAVY};font-weight:600;text-decoration:none;">View in Admin →</a></p>'
    )
    return _shell(preheader=f"New {form_type} submission on Divr.", body_html=body)


# ---------- send helpers (fire-and-forget) ----------
async def _send(params: dict[str, Any]) -> None:
    """Run Resend's sync SDK in a thread so the FastAPI loop stays free."""
    try:
        if not _configured():
            logger.warning("RESEND_API_KEY not set — skipping email to %s", params.get("to"))
            return
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("resend sent id=%s to=%s", result.get("id"), params.get("to"))
    except Exception as e:  # noqa: BLE001 — any Resend/network failure is non-fatal
        logger.warning("resend send failed to=%s err=%s", params.get("to"), e)


def _fire(params: dict[str, Any]) -> None:
    """Non-blocking wrapper. Safe to call from inside a FastAPI route."""
    try:
        asyncio.create_task(_send(params))
    except RuntimeError:
        # no running loop — shouldn't happen inside an endpoint, but be defensive
        logger.warning("no running loop — dropping email to=%s", params.get("to"))


# ---------- public API ----------
def send_waitlist_confirmation(*, to: str, first_name: str) -> None:
    _fire(
        {
            "from": _sender_display(),
            "to": [to],
            "reply_to": os.environ.get("RESEND_SENDER_EMAIL", "divr@divrworld.com"),
            "subject": "You're on the Divr early access list",
            "html": _waitlist_html(first_name),
        }
    )


def send_operator_confirmation(*, to: str, first_name: str, business_name: str) -> None:
    _fire(
        {
            "from": _sender_display(),
            "to": [to],
            "reply_to": os.environ.get("RESEND_SENDER_EMAIL", "divr@divrworld.com"),
            "subject": "We received your Divr application",
            "html": _operator_html(first_name, business_name),
        }
    )


def send_guide_confirmation(*, to: str, first_name: str) -> None:
    _fire(
        {
            "from": _sender_display(),
            "to": [to],
            "reply_to": os.environ.get("RESEND_SENDER_EMAIL", "divr@divrworld.com"),
            "subject": "We received your Divr application",
            "html": _guide_html(first_name),
        }
    )


def send_admin_notification(
    *,
    form_type: str,
    first_name: str,
    last_name: str,
    email: str,
    country: str,
    timestamp: str,
    extras: dict[str, Any] | None = None,
) -> None:
    admin = _admin_email()
    if not admin:
        return
    subject = f"New Divr {form_type} submission — {first_name} {last_name}".strip()
    _fire(
        {
            "from": _sender_display(),
            "to": [admin],
            "reply_to": email,  # so admin can reply straight to the applicant
            "subject": subject,
            "html": _notification_html(
                first_name=first_name,
                last_name=last_name,
                email=email,
                country=country,
                form_type=form_type,
                timestamp=timestamp,
                extras=extras,
            ),
        }
    )
