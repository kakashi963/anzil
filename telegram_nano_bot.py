"""
Nano Banana Pro Telegram Bot (Universal + Image Edit)

Commands:
  /start          - Help
  /nano prompt    - Text → Image (any field)
  /nanoedit prompt (reply to a photo) - Image → Image edit
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
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")          # set on Railway
NANO_API_KEY   = os.getenv("NANO_API_KEY") or "a699600330d950661ab22188a29a1050"
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
        """Create generation task (TEXTTOIAMGE or IMAGETOIAMGE)."""
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
        max_wait: int = 300,
    ) -> str:
        """High-level: create task and poll until URL ready."""
        task_id = self._generate_task(prompt, type_=type_, image_urls=image_urls)
        start = 0
        while start < max_wait:
            data = self._get_status(task_id)
            flag = data.get("successFlag")
            if flag == 1:
                return data["response"]["resultImageUrl"]
            if flag in (2, 3):
                raise ValueError(data.get("errorMessage", "Generation failed"))
            await asyncio.sleep(5)
            start += 5
        raise TimeoutError("Generation timeout")


nano_api = NanoAPI(NANO_API_KEY)


# === HELP / START ===
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "🤖 *Nano Banana Pro Bot*\n\n"
        "Works for *any field*:\n"
        "• Product photos: `/nano studio photo of Nike running shoes on white background`\n"
        "• Architecture: `/nano modern glass house on a cliff at night`\n"
        "• Cars: `/nano red Lamborghini on wet road, cinematic lighting`\n"
        "• Portraits: `/nano realistic portrait of a man in Kerala, 50mm lens`\n\n"
        "*Commands:*\n"
        "• `/nano prompt` – text → image\n"
        "• Reply to a photo with `/nanoedit prompt` – edit/transform that image\n\n"
        "Try: `/nano Kerala beach at sunrise, ultra realistic 4K`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


# === TEXT → IMAGE ===
async def nano_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "Usage: `/nano your prompt`\nExample: `/nano product photo of a black gaming mouse on a wooden desk`",
            parse_mode="Markdown",
        )
        return

    prompt = " ".join(context.args)
    await update.message.reply_text(f"🎨 Generating:\n`{prompt}`", parse_mode="Markdown")

    try:
        image_url = await nano_api.run_job(prompt, type_="TEXTTOIAMGE")
        await update.message.reply_photo(
            photo=image_url,
            caption=f"✨ {prompt}",
        )
    except Exception as e:
        logger.exception("nano error")
        await update.message.reply_text(f"❌ Error: {e}")


# === IMAGE → IMAGE (edit / transform) ===
async def nanoedit_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Reply to a photo with /nanoedit new prompt to edit it."""
    if not update.message.reply_to_message or not update.message.reply_to_message.photo:
        await update.message.reply_text(
            "Reply to an image with `/nanoedit your prompt`.\n"
            "Example: reply to a selfie → `/nanoedit make this look like a movie poster`",
            parse_mode="Markdown",
        )
        return

    if not context.args:
        await update.message.reply_text(
            "Add a prompt.\nExample: `/nanoedit turn this into cyberpunk night scene`",
            parse_mode="Markdown",
        )
        return

    prompt = " ".join(context.args)

    # get largest size of replied photo
    photo = update.message.reply_to_message.photo[-1]
    file = await photo.get_file()
    image_url = file.file_path  # Telegram CDN URL

    await update.message.reply_text(
        f"🖼 Editing image with prompt:\n`{prompt}`", parse_mode="Markdown"
    )

    try:
        result_url = await nano_api.run_job(
            prompt, type_="IMAGETOIAMGE", image_urls=[image_url]
        )
        await update.message.reply_photo(
            photo=result_url,
            caption=f"✨ Edited: {prompt}",
        )
    except Exception as e:
        logger.exception("nanoedit error")
        await update.message.reply_text(f"❌ Error: {e}")


def main():
    if not TELEGRAM_TOKEN:
        print("❌ TELEGRAM_TOKEN not set")
        return

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("nano", nano_cmd))
    app.add_handler(CommandHandler("nanoedit", nanoedit_cmd))

    print("🤖 Universal Nano Banana Pro Bot running...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
