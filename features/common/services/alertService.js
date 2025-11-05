import axios from "axios";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

class AlertService {
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = !!(this.telegramBotToken && this.telegramChatId);

    if (!this.telegramEnabled) {
    }
  }

  /**
   * Send alerts for a new lead
   */
  async sendLeadAlerts(lead) {
    const results = {
      telegram: { success: false, error: undefined },
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
   * Test connection to Telegram service
   */
  async testConnection() {
    const results = {
      telegram: { success: false, error: undefined },
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

    return results;
  }
}

export default new AlertService();
