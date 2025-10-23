import axios from "axios";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

class AlertService {
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = !!(this.telegramBotToken && this.telegramChatId);

    this.whatsappEnabled = process.env.WHATSAPP_ENABLED === "true";
    this.whatsappClient = null;
    this.whatsappReady = false;
    this.whatsappQRCode = null;
    this.whatsappQRCodeImage = null;

    if (!this.telegramEnabled) {
    }

    if (!this.whatsappEnabled) {
    }

    if (this.whatsappEnabled) {
      this.initializeWhatsApp();
    }
  }

  /**
   * Initialize WhatsApp client
   */
  async initializeWhatsApp() {
    try {
      this.whatsappClient = new Client({
        authStrategy: new LocalAuth({
          clientId: "flushjohn-crm",
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        },
        restartOnAuthFail: true,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
      });

      this.whatsappClient.on("qr", async (qr) => {
        qrcode.generate(qr, { small: true });

        this.whatsappQRCode = qr;
        try {
          this.whatsappQRCodeImage = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

        } catch (error) {}
      });

      this.whatsappClient.on("ready", async () => {
        this.whatsappReady = true;

        this.whatsappQRCode = null;
        this.whatsappQRCodeImage = null;

        try {
          const chats = await this.whatsappClient.getChats();

          chats.slice(0, 10).forEach((chat, index) => {
          });
          if (chats.length > 10) {
          }
        } catch (error) {
        }
      });

      this.whatsappClient.on("authenticated", () => {
      });

      this.whatsappClient.on("auth_failure", (msg) => {
      });

      this.whatsappClient.on("disconnected", (reason) => {
        this.whatsappReady = false;
      });

      await this.whatsappClient.initialize();
    } catch (error) {
    }
  }

  /**
   * Send alerts for a new lead
   */
  async sendLeadAlerts(lead) {
    const results = {
      telegram: { success: false, error: undefined },
      whatsapp: { success: false, error: undefined },
      timestamp: getCurrentDateTime().toISOString(),
    };

    if (this.telegramEnabled) {
      try {
        const telegramMessage = this.formatTelegramMessage(lead);
        const telegramResult = await this.sendTelegramMessage(telegramMessage);
        results.telegram = telegramResult;
      } catch (error) {
        results.telegram = {
          success: false,
          error: `Telegram API error: ${error.message}`,
        };
      }
    } else {
      results.telegram = {
        success: false,
        error: "Telegram alerts not configured",
      };
    }

    if (this.whatsappEnabled) {
      try {
        const whatsappMessage = this.formatWhatsAppMessage(lead);
        const whatsappResult = await this.sendWhatsAppMessage(whatsappMessage);
        results.whatsapp = whatsappResult;
      } catch (error) {
        results.whatsapp = {
          success: false,
          error: `WhatsApp error: ${error.message}`,
        };
      }
    } else {
      results.whatsapp = {
        success: false,
        error: "WhatsApp alerts not enabled",
      };
    }

    return results;
  }

  /**
   * Format message for Telegram
   */
  formatTelegramMessage(lead) {
    const {
      leadNo,
      leadSource,
      fName,
      lName,
      companyName,
      email,
      phone,
      leadStatus,
      assignedTo,
      products,
      createdAt,
    } = lead;

    const escapeMarkdown = (text) => {
      if (!text) return "";
      return String(text).replace(/[_*[\]()~`>#+=|{}]/g, "\\$&");
    };

    const customerInfo = [];
    if (fName || lName) {
      const fullName = `${fName || ""} ${lName || ""}`.trim();
      customerInfo.push(`👤 *${escapeMarkdown(fullName)}*`);
    }
    if (companyName) {
      customerInfo.push(`🏢 ${escapeMarkdown(companyName)}`);
    }
    if (email) {
      customerInfo.push(`📧 ${escapeMarkdown(email)}`);
    }
    if (phone) {
      customerInfo.push(`📞 ${escapeMarkdown(phone)}`);
    }

    let productsText = "";
    if (products && products.length > 0) {
      productsText = "\n\n🛍️ *Products:*\n";
      products.forEach((product, index) => {
        productsText += `${index + 1}. ${escapeMarkdown(product.name)} (Qty: ${
          product.qty
        }) - $${product.rate} = $${product.amount}\n`;
      });
    }

    const timestamp = new Date(createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const message = `🚨 *NEW LEAD CREATED* 🚨

🔢 Lead #${leadNo}
📊 Source: ${escapeMarkdown(leadSource)}

${customerInfo.join("\n")}

${this.getStatusEmoji(leadStatus)} Status: ${escapeMarkdown(leadStatus)}
👨‍💼 Assigned to: ${escapeMarkdown(assignedTo)}${productsText}

⏰ Created: ${timestamp}
---
🔗 CRM Link: View Lead #${leadNo}`;

    return message;
  }

  /**
   * Format message for WhatsApp
   */
  formatWhatsAppMessage(lead) {
    const {
      leadNo,
      leadSource,
      fName,
      lName,
      companyName,
      email,
      phone,
      leadStatus,
      assignedTo,
      products,
      createdAt,
    } = lead;

    const customerInfo = [];
    if (fName || lName) {
      const fullName = `${fName || ""} ${lName || ""}`.trim();
      customerInfo.push(`👤 ${fullName}`);
    }
    if (companyName) {
      customerInfo.push(`🏢 ${companyName}`);
    }
    if (email) {
      customerInfo.push(`📧 ${email}`);
    }
    if (phone) {
      customerInfo.push(`📞 ${phone}`);
    }

    let productsText = "";
    if (products && products.length > 0) {
      productsText = "\n\n🛍️ Products:\n";
      products.forEach((product, index) => {
        productsText += `${index + 1}. ${product.item} (Qty: ${
          product.qty
        }) - $${product.rate} = $${product.amount}\n`;
      });
    }

    const timestamp = new Date(createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const message = `🚨 NEW LEAD CREATED 🚨

🔢 Lead #${leadNo}
📊 Source: ${leadSource}

${customerInfo.join("\n")}

${this.getStatusEmoji(leadStatus)} Status: ${leadStatus}
👨‍💼 Assigned to: ${assignedTo}${productsText}

⏰ Created: ${timestamp}
---
🔗 CRM Link: View Lead #${leadNo}`;

    return message;
  }

  /**
   * Send message via Telegram Bot API
   */
  async sendTelegramMessage(message) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: "Markdown",
        }
      );

      if (response.data.ok) {
        return { success: true, error: undefined };
      } else {
        throw new Error(response.data.description || "Unknown error");
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send message via WhatsApp
   */
  async sendWhatsAppMessage(message) {
    if (!this.whatsappReady) {
      throw new Error("WhatsApp client not ready");
    }

    try {
      const phoneNumber =
        process.env.WHATSAPP_RECIPIENT_NUMBER ||
        process.env.WHATSAPP_PHONE_NUMBER;
      if (!phoneNumber) {
        throw new Error("WhatsApp recipient phone number not configured");
      }

      const chatId = `${phoneNumber.replace("+", "")}@c.us`;
      await this.whatsappClient.sendMessage(chatId, message);

      return { success: true, error: undefined };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get status emoji based on lead status
   */
  getStatusEmoji(status) {
    const statusEmojis = {
      New: "🆕",
      Hot: "🔥",
      Warm: "🌡️",
      Cold: "❄️",
      Qualified: "✅",
      Unqualified: "❌",
      Converted: "🎉",
      Lost: "💔",
    };
    return statusEmojis[status] || "📋";
  }

  /**
   * Extract lead number from message for logging
   */
  extractLeadNumber(message) {
    const match = message.match(/Lead #(\d+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Get WhatsApp QR code for web display
   */
  getWhatsAppQRCode() {
    return {
      hasQRCode: !!this.whatsappQRCode,
      qrCode: this.whatsappQRCode,
      qrCodeImage: this.whatsappQRCodeImage,
      isReady: this.whatsappReady,
      isEnabled: this.whatsappEnabled,
    };
  }

  /**
   * Test connection to both services
   */
  async testConnection() {
    const results = {
      telegram: { success: false, error: undefined },
      whatsapp: { success: false, error: undefined },
      timestamp: getCurrentDateTime().toISOString(),
    };

    if (this.telegramEnabled) {
      try {
        const testMessage =
          "🧪 FlushJohn CRM Test Message\n\nTelegram alerts are working correctly! ✅";
        await this.sendTelegramMessage(testMessage);
        results.telegram = { success: true, error: undefined };
      } catch (error) {
        results.telegram = { success: false, error: error.message };
      }
    } else {
      results.telegram = {
        success: false,
        error: "Telegram alerts not configured",
      };
    }

    if (this.whatsappEnabled) {
      try {
        const testMessage =
          "🧪 FlushJohn CRM Test Message\n\nWhatsApp alerts are working correctly! ✅";
        await this.sendWhatsAppMessage(testMessage);
        results.whatsapp = { success: true, error: undefined };
      } catch (error) {
        results.whatsapp = { success: false, error: error.message };
      }
    } else {
      results.whatsapp = {
        success: false,
        error: "WhatsApp alerts not enabled",
      };
    }

    return results;
  }
}

export default new AlertService();
