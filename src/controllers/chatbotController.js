const chatbotService = require('../services/chatbotService');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  const { message, history = [], patientId } = req.body;

  if (!patientId) return res.status(400).json({ text: "Thiếu patientId để truy vấn dữ liệu." });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `
      Bạn là trợ lý AI của hệ thống CareFlow.
      - Patient ID hiện tại: ${patientId}
      - Có các chức năng:
          + getNewAppointment(patientId)
          + getTopDoctor(limit)
          + searchHospital(keyword, provinceId, specialtyId, hospitalId)
      - Khi người dùng hỏi về lịch khám → gọi getNewAppointment
      - Khi hỏi bác sĩ nổi bật → gọi getTopDoctor
      - Khi hỏi thông tin bệnh viện, bác sĩ, chuyên khoa → gọi searchHospital
      - KHÔNG hỏi lại "ID bệnh nhân là gì?"
      - Trả lời ngắn gọn, tự nhiên, tiếng Việt
      - Nếu không có dữ liệu → trả lời "Hiện tại không tìm thấy kết quả."
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

module.exports = { chatWithDatabase };
