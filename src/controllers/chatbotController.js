const chatbotService = require('../services/chatbotService');

const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await chatbotService.getBotReply(message);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({ reply: "Đã xảy ra lỗi!" });
  }
};

module.exports = {
  handleChat,
};
