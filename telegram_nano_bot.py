"""
Smart Nano Banana Pro Bot

Behaviors:
- /start, /help, /about
- /nano prompt        -> text -> image  (explicit)
- reply photo + /nanoedit prompt -> image -> image  (explicit)
- plain text message  -> treated as /nano
- reply to photo with plain text -> treated as /nanoedit
"""

import asyncio
import logging
import os
from typing import Optional

import requests
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# === CONFIG ===
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
NANO_API_KEY   = os.getenv("NANO_API_KEY", "a699600330d950661ab22188a29a1050")
NANO_BASE_URL  = "https://api.nanobananaapi.ai/api/v1/nanobanana"

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


class NanoAPI:
    def __init__(self, api_key: str):
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def _generate_task(
        self,
        prompt: str,
        type_: str = "TEXTTOIAMGE",
        num_images: int = 1,
        image_urls: Optional[list] = None,
    ) -> str:
        data = {
            "prompt": prompt,
            "type": type_,
            "numImages": num_images,
            "callBackUrl": "https://httpbin.org/post",
        }
        if image_urls:
            data["imageUrls"] = image_urls

        resp = requests.post(
            f"{NANO_BASE_URL}/generate",
            headers={**self.headers, "Content-Type": "application/json"},
            json=data,
            timeout=60,
        )
        result = resp.json()
        logger.info("GENERATE result: %s", result)
        if result.get("code") != 200:
            raise ValueError(result.get("msg", "Unknown error"))
        return result["data"]["taskId"]

    def _get_status(self, task_id: str) -> dict:
        resp = requests.get(
            f"{NANO_BASE_URL}/record-info?taskId={task_id}",
            headers=self.headers,
            timeout=60,
        )
        data = resp.json().get("data", {})
        logger.info("STATUS %s: %s", task_id, data)
        return data

    async def run_job(
        self,
        prompt: str,
        type_: str = "TEXTTOIAMGE",
        image_urls: Optional[list] = None,
        max_wait: int = 240,
    ) -> str:
        task_id = self._generate_task(prompt, type_=type_, image_urls=image_urls)
        waited = 0
        while waited < max_wait:
            data = self._get_status(task_id)
            flag = data.get("successFlag")
            if flag == 1:
                return data["response"]["resultImageUrl"]
            if flag in (2, 3):
                raise ValueError(data.get("errorMessage", "Generation failed"))
            await asyncio.sleep(4)
            waited += 4
        raise TimeoutError("Generation timeout")


nano_api = NanoAPI(NANO_API_KEY)

HELP_TEXT = (
    "🤖 *Smart Nano Banana Pro Bot*\n\n"
    "How to use:\n"
    "• Just *send a message* → I generate an image.\n"
    "   `Kerala beach cyberpunk city at night`\n"
    "• Send a *photo*, then reply to it with text → I edit that image.\n"
    "   `make this look like a movie poster`\n\n"
    "Commands (optional):\n"
    "• `/nano prompt` – force text → image\n"
    "• `/nanoedit prompt` (reply to photo) – force image edit\n"
    "• `/help` – show this help\n"
)

# === BASIC COMMANDS ===

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")


async def about_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "ℹ️ *About*\n\n"
        "• Model: Nano Banana Pro (Gemini 3 Pro Image)\n"
        "• Modes: text→image, image→image\n"
        "• You can just chat naturally, no need to type commands."
    )
    await update.message.reply_text(text, parse_mode="Markdown")


# === CORE HELPERS ===

async def text_to_image(update: Update, prompt: str):
    await update.message.reply_text(f"🎨 Generating:\n`{prompt}`", parse_mode="Markdown")
    try:
        url = await nano_api.run_job(prompt, type_="TEXTTOIAMGE")
        await update.message.reply_photo(photo=url, caption=f"✨ {prompt}")
    except Exception as e:
        logger.exception("text_to_image error")
        await update.message.reply_text(f"❌ Error: {e}")


async def image_to_image(update: Update, prompt: str):
    msg = update.message
    if not msg.reply_to_message or not msg.reply_to_message.photo:
        await msg.reply_text(
            "Reply to a *photo* with your edit text.\n"
            "Example: reply → `make this look like a movie poster`",
            parse_mode="Markdown",
        )
        return

    photo = msg.reply_to_message.photo[-1]
    file = await photo.get_file()
    image_url = file.file_path

    await msg.reply_text(
        f"🖼 Editing image with prompt:\n`{prompt}`", parse_mode="Markdown"
    )

    try:
        result_url = await nano_api.run_job(
            prompt, type_="IMAGETOIAMGE", image_urls=[image_url]
        )
        await msg.reply_photo(photo=result_url, caption=f"✨ Edited: {prompt}")
    except Exception as e:
        logger.exception("image_to_image error")
        await msg.reply_text(f"❌ Error: {e}")


# === EXPLICIT COMMANDS (still available) ===

async def nano_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "Usage: `/nano your prompt`", parse_mode="Markdown"
        )
        return
    prompt = " ".join(context.args)
    await text_to_image(update, prompt)


async def nanoedit_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "Usage (reply to photo): `/nanoedit your prompt`", parse_mode="Markdown"
        )
        return
    prompt = " ".join(context.args)
    await image_to_image(update, prompt)


# === SMART HANDLER (no command needed) ===

async def smart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    - If message is text and NOT a command:
        - If it's a reply to a photo -> treat as nanoedit
        - Else -> treat as nano (text->image)
    """
    msg = update.message
    if not msg or not msg.text:
        return

    # ignore commands (handled separately)
    if msg.text.startswith("/"):
        return

    prompt = msg.text.strip()
    # If replying to a photo -> edit it
    if msg.reply_to_message and msg.reply_to_message.photo:
        await image_to_image(update, prompt)
    else:
        await text_to_image(update, prompt)


def main():
    if not TELEGRAM_TOKEN:
        print("❌ TELEGRAM_TOKEN not set")
        return

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("about", about_cmd))
    app.add_handler(CommandHandler("nano", nano_cmd))
    app.add_handler(CommandHandler("nanoedit", nanoedit_cmd))

    # Smart free‑text handler
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, smart_handler))

    print("🤖 Smart Nano Banana Pro Bot running...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
