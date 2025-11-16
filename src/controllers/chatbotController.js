import chatbotService from "../services/chatbotService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Định nghĩa Tool
const getNewAppointmentTool = {
  functionDeclarations: [
    {
      name: "getNewAppointment",
      description: "Truy xuất thông tin lịch khám mới nhất (đang chờ hoặc đã xác nhận) của bệnh nhân. Cần patientId.",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "integer",
            description: "ID duy nhất của bệnh nhân để tra cứu lịch khám."
          },
        },
        required: ["patientId"],
      },
    },
  ],
};

const getTopDoctorTool = {
  functionDeclarations: [
    {
      name: "getTopDoctor",
      description: "Lấy danh sách top bác sĩ theo số lượt booking",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Số lượng bác sĩ muốn lấy",
          },
        },
        required: ["limit"],
      },
    },
  ],
};

const searchHospitalTool = {
  functionDeclarations: [
    {
      name: "searchHospital",
      description: "Tìm kiếm bác sĩ, bệnh viện, chuyên khoa theo từ khóa, tỉnh, bệnh viện hoặc chuyên khoa",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Tên bác sĩ/bệnh viện/chuyên khoa" },
          provinceId: { type: "integer" },
          specialtyId: { type: "integer" },
          hospitalId: { type: "integer" },
        },
      },
    },
  ],
};

const tools = [getNewAppointmentTool, getTopDoctorTool, searchHospitalTool];

// Thực thi function
const executeFunction = async (functionName, args) => {
  try {
    switch (functionName) {
      case "getNewAppointment":
        const appointment = await chatbotService.getNewAppointment(args.patientId);
        return JSON.stringify(appointment || { message: "Hiện tại bạn chưa có lịch khám nào." });

      case "getTopDoctor":
        const topDoctors = await chatbotService.getTopDoctorHome(args.limit || 5);
        return JSON.stringify(topDoctors);

      case "searchHospital":
        const searchResult = await chatbotService.searchAll(args);
        return JSON.stringify(searchResult);

      default:
        return JSON.stringify({ error: "Function not found" });
    }
  } catch (err) {
    console.error("ExecuteFunction error:", err);
    return JSON.stringify({ error: "Lỗi truy vấn database." });
  }
};


const chatWithDatabase = async (req, res) => {
  const { message, history = [], patientId, fullName, language } = req.body;
  if (!patientId) return res.status(400).json({ text: "Thiếu patientId để truy vấn dữ liệu." });
  const userName = fullName ? fullName.split(' ').slice(-1)[0] : 'bạn';
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const offTopicResponse = language === "vi"
      ? `Xin lỗi, tôi là trợ lý AI của **CareFlow** – tôi chỉ hỗ trợ **thông tin lịch khám** và **tư vấn sức khỏe**.  
    Bạn có thể hỏi:  
    • "Lịch khám của tôi là khi nào?"  
    • "Bác sĩ nào nổi bật?"  
    • "Bệnh viện ở Hà Nội?"  
    • "Cảm cúm nên uống thuốc gì?"  
    Bạn cần hỗ trợ gì về sức khỏe hôm nay?`
      : `Sorry, I'm the AI assistant for **CareFlow** – I only help with **booking appointments** and **health advice**.  
    You can ask:  
    • "When is my appointment?"  
    • "Who are the top doctors?"  
    • "Hospitals in Hanoi?"  
    • "What should I take for a cold?"  
    How can I assist with your health today?`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `
      Bạn là trợ lý AI y tế của hệ thống CareFlow. Patient ID: ${patientId}.
      Người dùng hiện tại: **${fullName || 'bạn'}** (gọi tên thân thiện, ví dụ: "bạn Minh", "chị Lan").

      === CÁCH XƯNG HÔ ===
        - Luôn gọi người dùng bằng tên (nếu có): "bạn ${userName}", "chị ${userName}", "anh ${userName}".
        - Nếu không có tên → dùng "bạn".
        - Trả lời tự nhiên, gần gũi như bác sĩ quen.

      === CHỦ ĐỀ ĐƯỢC PHÉP ===
      1. Nếu người dùng hỏi về:
        - Lịch khám, đặt lịch → gọi getNewAppointment(patientId)
        - Bác sĩ nổi bật → gọi getTopDoctor(limit)
        - Tìm bệnh viện, bác sĩ, chuyên khoa → gọi searchHospital(...)
      2. Nếu người dùng hỏi về:
        - Triệu chứng bệnh
        - Cách phòng ngừa
        - Thuốc, thực phẩm nên/tránh
        - Kiến thức y tế chung
        → Trả lời trực tiếp, ngắn gọn, dễ hiểu, bằng tiếng Việt (nếu language = "vi") hoặc tiếng Anh (nếu "en").
      
      === CHỦ ĐỀ BỊ CẤM ===
        - Thời tiết, giá vàng, bóng đá, chính trị, giải trí, tin tức chung
        - Bất kỳ câu hỏi nào KHÔNG liên quan đến sức khỏe hoặc đặt khám
      
      === QUY TẮC TRẢ LỜI ===
        1. Nếu câu hỏi thuộc chủ đề được phép → trả lời bình thường
        2. Nếu câu hỏi KHÔNG liên quan → trả lời chính xác như sau:
          """
          ${offTopicResponse}
          """

        === VÍ DỤ ===
          User: "Hôm nay trời mưa không?" → "${offTopicResponse}"
          User: "Kết quả bóng đá?" → "${offTopicResponse}"
          User: "Giá vàng hôm nay?" → "${offTopicResponse}"

      === NGÔN NGỮ ===
      - language = "vi" → trả lời tiếng Việt
      - language = "en" → trả lời tiếng Anh

      === LƯU Ý ===
      - Không hỏi lại "ID bệnh nhân là gì?"
      - Nếu không có dữ liệu → "Hiện tại không tìm thấy kết quả."
      - Luôn trả lời tự nhiên, thân thiện, như bác sĩ tư vấn.
      - **Khi trả lời kiến thức y tế chung có liên quan (triệu chứng, thuốc, phòng ngừa), luôn thêm câu: "Lời khuyên này không thay thế bác sĩ. Vui lòng đi khám nếu triệu chứng kéo dài."**
    `.trim()
  });

  // **Chỉ lấy 10 tin nhắn gần nhất để giảm token**
  const limitedHistory = history.slice(-10);

  const contents = [
    { role: "model", parts: [{ text: `Patient ID: ${patientId}. Dùng ID này để tra cứu lịch khám.` }] },
    ...limitedHistory.map(msg => ({
      role: msg.from === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];

  try {
    const result1 = await model.generateContent({ contents, tools });

    const response1 = result1.response;
    const functionCall = response1.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    // Nếu text bình thường → trả về luôn
    if (!functionCall) return res.status(200).json({ text: response1.text() });

    const call = { ...functionCall, args: { ...functionCall.args, patientId } };

    const functionResult = await executeFunction(call.name, call.args);
    let parsedResult;
    try { parsedResult = JSON.parse(functionResult); } 
    catch { parsedResult = { text: functionResult }; }

    const result2 = await model.generateContent({
      contents: [
        ...contents,
        { role: "model", parts: [{ functionCall: call }] },
        { role: "function", parts: [{ functionResponse: { name: call.name, response: parsedResult } }] }
      ],
      tools
    });

    return res.status(200).json({ text: result2.response.text() });

  } catch (err) {
    if (err.status === 429) {
      console.warn("Gemini API quota exceeded. Retry later.");
      return res.status(429).json({ text: "Hệ thống quá tải. Vui lòng thử lại sau vài giây." });
    }
    console.error("Gemini/DB error:", err);
    return res.status(500).json({ text: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau." });
  }
};

export default { chatWithDatabase };
