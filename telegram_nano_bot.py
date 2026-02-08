"""
Nano Banana Pro Telegram Bot - Railway Ready
@yourusername Nano Kerala anime → sends image instantly
"""

import asyncio
import logging
import os
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from PIL import Image
import io
import time

# Config (Railway sets via vars)
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
NANO_API_KEY = os.getenv("NANO_API_KEY", "a699600330d950661ab22188a29a1050")
NANO_BASE_URL = "https://api.nanobananaapi.ai/api/v1/nanobanana"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

class NanoAPI:
    def __init__(self):
        self.headers = {"Authorization": f"Bearer {NANO_API_KEY}"}
    
    def generate(self, prompt):
        data = {"prompt": prompt, "type": "TEXTTOIAMGE", "numImages": 1, "callBackUrl": "https://httpbin.org/post"}
        resp = requests.post(f"{NANO_BASE_URL}/generate", headers={**self.headers, "Content-Type": "application/json"}, json=data)
        result = resp.json()
        if result["code"] != 200: raise ValueError(result["msg"])
        return result["data"]["taskId"]
    
    def status(self, task_id):
        resp = requests.get(f"{NANO_BASE_URL}/record-info?taskId={task_id}", headers=self.headers)
        return resp.json()["data"]

    async def generate_image(self, prompt, update):
        """Full generate + poll"""
        await update.message.reply_text(f"🎨 *Generating:* `{prompt[:50]}...`", parse_mode="Markdown")
        
        task_id = self.generate(prompt)
        logger.info(f"Task {task_id} for {prompt}")
        
        for i in range(60):  # 5min
            status = self.status(task_id)
            flag = status.get("successFlag")
            
            if flag == 1:
                url = status["response"]["resultImageUrl"]
                await update.message.reply_photo(url, caption=f"✨ *{prompt}*\n\nNano Banana Pro (Gemini 3 Pro)", parse_mode="Markdown")
                return
            elif flag in [2, 3]:
                await update.message.reply_text(f"❌ Failed: {status.get('errorMessage', 'Unknown')}")
                return
            await asyncio.sleep(5)
        
        await update.message.reply_text("⏰ Timeout - try shorter prompt")

nano_api = NanoAPI()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🚀 *Nano Banana Pro Bot*\n\n"
        "/nano *prompt* → AI anime/game art\n\n"
        "*Your style:*\n"
        "`/nano Kerala Gojo sunset`\n"
        "`/nano GTA Kollam cyberpunk`\n"
        "`/nano Solo Leveling robot`\n\n"
        "Gemini 3 Pro ✨",
        parse_mode="Markdown"
    )

async def nano_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args: 
        await update.message.reply_text("❌ `/nano Kerala anime robot`", parse_mode="Markdown")
        return
    prompt = " ".join(context.args)
    await nano_api.generate_image(prompt, update)

def main():
    if not TELEGRAM_TOKEN:
        print("❌ Set TELEGRAM_TOKEN env var!")
        return
    
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("nano", nano_cmd))
    
    print("🤖 Bot started on Railway!")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
