import chatbotService from "../services/chatbotService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const provinceMapping = {
  "tuyên quang": "Tuyên Quang",
  "hà giang": "Hà Giang",
  "cao bằng": "Cao Bằng",
  "lai châu": "Lai Châu",
  "lào cai": "Lào Cai",
  "yên bái": "Yên Bái",
  "thái nguyên": "Thái Nguyên",
  "bắc kạn": "Bắc Kạn",
  "điện biên": "Điện Biên",
  "lạng sơn": "Lạng Sơn",
  "sơn la": "Sơn La",
  "phú thọ": "Phú Thọ",
  "hòa bình": "Hòa Bình",
  "vĩnh phúc": "Vĩnh Phúc",
  "bắc ninh": "Bắc Ninh",
  "bắc giang": "Bắc Giang",
  "quảng ninh": "Quảng Ninh",
  "tp. hà nội": "TP. Hà Nội",
  "hà nội": "TP. Hà Nội",
  "tp. hải phòng": "TP. Hải Phòng",
  "hải dương": "Hải Dương",
  "hưng yên": "Hưng Yên",
  "thái bình": "Thái Bình",
  "ninh bình": "Ninh Bình",
  "hà nam": "Hà Nam",
  "nam định": "Nam Định",
  "thanh hóa": "Thanh Hóa",
  "nghệ an": "Nghệ An",
  "hà tĩnh": "Hà Tĩnh",
  "quảng trị": "Quảng Trị",
  "quảng bình": "Quảng Bình",
  "tp. huế": "TP. Huế",
  "tp. đà nẵng": "TP. Đà Nẵng",
  "quảng nam": "Quảng Nam",
  "quảng ngãi": "Quảng Ngãi",
  "kon tum": "Kon Tum",
  "gia lai": "Gia Lai",
  "bình định": "Bình Định",
  "đắk lắk": "Đắk Lắk",
  "phú yên": "Phú Yên",
  "khánh hòa": "Khánh Hoà",
  "ninh thuận": "Ninh Thuận",
  "lâm đồng": "Lâm Đồng",
  "đắk nông": "Đắk Nông",
  "bình thuận": "Bình Thuận",
  "đồng nai": "Đồng Nai",
  "bình phước": "Bình Phước",
  "tây ninh": "Tây Ninh",
  "long an": "Long An",
  "tp. hồ chí minh": "TP. Hồ Chí Minh",
  "tphcm": "TP. Hồ Chí Minh",
  "bà rịa - vũng tàu": "Bà Rịa - Vũng Tàu",
  "đồng tháp": "Đồng Tháp",
  "tiền giang": "Tiền Giang",
  "an giang": "An Giang",
  "kiên giang": "Kiên Giang",
  "vĩnh long": "Vĩnh Long",
  "bến tre": "Bến Tre",
  "trà vinh": "Trà Vinh",
  "tp. cần thơ": "TP. Cần Thơ",
  "sóc trăng": "Sóc Trăng",
  "hậu giang": "Hậu Giang",
  "cà mau": "Cà Mau",
  "bạc liêu": "Bạc Liêu",
};

const extractProvinceName = (text) => {
  text = text.toLowerCase();
  for (const key in provinceMapping) {
    if (text.includes(key)) {
      return provinceMapping[key];
    }
  }
  return null;
};

const extractProvinceNameFromText = (text) => {
  return extractProvinceName(text);
};

const extractHospitalKeyword = (text) => {
  const match = text.match(/bệnh viện\s*(.+?)\s*(ở|$)/i);
  return match ? match[1].trim() : null;
};

const extractDoctorKeyword = (text) => {
  const match = text.match(/bác sĩ\s*(.+?)\s*(ở|$)/i);
  return match ? match[1].trim() : null;
};

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

// const searchHospitalTool = {
//   functionDeclarations: [
//     {
//       name: "searchHospital",
//       description: "Tìm kiếm thông tin bác sĩ, bệnh viện theo từ khóa, tỉnh",
//       parameters: {
//         type: "object",
//         properties: {
//           keyword: { type: "string", description: "Tên bác sĩ/bệnh viện" },
//           // provinceId: { type: "integer" },
//           // specialtyId: { type: "integer" },
//           // hospitalId: { type: "integer" },
//         },
//       },
//     },
//   ],
// };

const searchHospitalTool = {
  functionDeclarations: [
    {
      name: "searchHospital",
      description: "Tìm bệnh viện theo tên hoặc theo tỉnh/thành",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Tên bệnh viện hoặc địa chỉ" },
          provinceId: { type: "integer", description: "ID tỉnh thành muốn tìm" }
        },
      },
    },
  ],
};

const searchDoctorTool = {
  functionDeclarations: [
    {
      name: "searchDoctor",
      description: "Tìm bác sĩ theo tên hoặc theo tỉnh/thành",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Tên bác sĩ hoặc địa chỉ" },
          provinceId: { type: "integer", description: "ID tỉnh thành muốn tìm" }
        },
      },
    },
  ],
};

const tools = [getNewAppointmentTool, getTopDoctorTool, searchHospitalTool, searchDoctorTool];

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

      case "searchDoctor":
        const searchResultDoctor = await chatbotService.searchDoctor(args);
        return JSON.stringify(searchResultDoctor);

      default:
        return JSON.stringify({ error: "Function not found" });
    }
  } catch (err) {
    console.error("ExecuteFunction error:", err);
    return JSON.stringify({ error: "Lỗi truy vấn database." });
  }
};


// const chatWithDatabase = async (req, res) => {
//   const { message, history = [], patientId, fullName, language } = req.body;
//   if (!patientId) return res.status(400).json({ text: "Thiếu patientId để truy vấn dữ liệu." });
//   const userName = fullName ? fullName.split(' ').slice(-1)[0] : 'bạn';
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//   const offTopicResponse = language === "vi"
//       ? `Tôi là trợ lý AI của **CareFlow** – tôi chỉ hỗ trợ **thông tin lịch khám, bác sĩ, bệnh viện** và **tư vấn sức khỏe**.  
//     Bạn có thể hỏi:  
//     • "Lịch khám của tôi là khi nào?"  
//     • "Bác sĩ nào nổi bật?"  
//     • "Bệnh viện ở Hà Nội?"  
//     • "Cảm cúm nên uống thuốc gì?"  
//     Bạn cần hỗ trợ gì về sức khỏe hôm nay?`
//       : `Sorry, I'm the AI assistant for **CareFlow** – I only help with **booking appointments** and **health advice**.  
//     You can ask:  
//     • "When is my appointment?"  
//     • "Who are the top doctors?"  
//     • "Hospitals in Hanoi?"  
//     • "What should I take for a cold?"  
//     How can I assist with your health today?`;

//     let provinceName = extractProvinceNameFromText(message);
//     let keyword = extractHospitalKeyword(message);
//     const callArgs = { keyword, provinceName };
//     let keywordDoctor = extractDoctorKeyword(message);
//     const callArgsDoctor = { keywordDoctor, provinceName };

//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     systemInstruction: `
//       Bạn là trợ lý AI y tế của hệ thống CareFlow. Patient ID: ${patientId}.
//       Người dùng hiện tại: **${fullName || 'bạn'}** (gọi tên thân thiện, ví dụ: "bạn Minh", "chị Lan").

//       === CÁCH XƯNG HÔ ===
//         - Gọi người dùng bằng tên (nếu có) khi trò chuyện lần đầu các lượt thoại sau không cần: "bạn ${userName}", "chị ${userName}", "anh ${userName}".
//         - Nếu không có tên và các lượt thoại sau → dùng "bạn".
//         - Trả lời tự nhiên, gần gũi như bác sĩ quen, (thỉnh thoảng thêm icon phù hợp nhưng lưu ý không thêm icon quá nhiều và thường xuyên).

//       === CHỦ ĐỀ ĐƯỢC PHÉP ===
//       1. Nếu người dùng hỏi về:
//         - Lịch khám, đặt lịch → gọi getNewAppointment(patientId)
//         - Bác sĩ nổi bật → gọi getTopDoctor(limit)
//         - Tìm bệnh viện, bệnh viện theo địa chỉ → gọi searchHospital(${callArgs})
//         - Tìm bác sĩ, bác sĩ theo địa chỉ → gọi searchDoctor(${callArgsDoctor})
//       2. Nếu người dùng hỏi về:
//         - Triệu chứng bệnh
//         - Cách phòng ngừa
//         - Thuốc, thực phẩm nên/tránh
//         - Kiến thức y tế chung
//         → Trả lời trực tiếp, ngắn gọn, dễ hiểu, bằng tiếng Việt (nếu language = "vi") hoặc tiếng Anh (nếu "en").
//       3. Hướng dẫn cách đặt lịch khám CareFlow
//       → Trả lời trực tiếp, mô tả các bước rõ ràng giống hệt như sau:
//           - Tìm kiếm và lựa chọn bác sĩ hoặc bệnh viện muốn khám
//           - Chọn thời gian khám phù hợp
//           - Xác nhận thông tin đặt lịch
//           - Nhấn nút "Đặt lịch"
//           - Nhận thông báo và nhắc hẹn qua email

      
//       === CHỦ ĐỀ BỊ CẤM ===
//         - Thời tiết, giá vàng, bóng đá, chính trị, giải trí, tin tức chung
//         - Bất kỳ câu hỏi nào KHÔNG liên quan đến sức khỏe hoặc đặt khám
      
//       === QUY TẮC TRẢ LỜI ===
//         1. Nếu câu hỏi thuộc chủ đề được phép → trả lời bình thường
//         2. Nếu câu hỏi KHÔNG liên quan → trả lời chính xác như sau:
//           """
//           ${offTopicResponse}
//           """

//         === VÍ DỤ ===
//           User: "Hôm nay trời mưa không?" → "${offTopicResponse}"
//           User: "Kết quả bóng đá?" → "${offTopicResponse}"
//           User: "Giá vàng hôm nay?" → "${offTopicResponse}"

//       === NGÔN NGỮ ===
//       - language = "vi" → trả lời tiếng Việt
//       - language = "en" → trả lời tiếng Anh

//       === LƯU Ý ===
//       - Không hỏi lại "ID bệnh nhân là gì?"
//       - Nếu không có dữ liệu → "Hiện tại không tìm thấy kết quả."
//       - Luôn trả lời tự nhiên, thân thiện, như bác sĩ tư vấn.
//       - **Khi trả lời kiến thức y tế chung có liên quan (triệu chứng, thuốc, phòng ngừa), luôn thêm câu: "Lưu ý lời khuyên này không thể thay thế bác sĩ."**
//     `.trim()

//   });

//   // **Chỉ lấy 10 tin nhắn gần nhất để giảm token**
//   const limitedHistory = history.slice(-10);

//   const contents = [
//     { role: "model", parts: [{ text: `Patient ID: ${patientId}. Dùng ID này để tra cứu lịch khám.` }] },
//     ...limitedHistory.map(msg => ({
//       role: msg.from === "user" ? "user" : "model",
//       parts: [{ text: msg.text }]
//     })),
//     { role: "user", parts: [{ text: message }] }
//   ];

//   try {
//     const result1 = await model.generateContent({ contents, tools });

//     const response1 = result1.response;
//     const functionCall = response1.candidates?.[0]?.content?.parts?.[0]?.functionCall;

//     // Nếu text bình thường → trả về luôn
//     if (!functionCall) return res.status(200).json({ text: response1.text() });

//     const call = { ...functionCall, args: { ...functionCall.args, patientId } };

//     const functionResult = await executeFunction(call.name, call.args);
//     let parsedResult;
//     try { parsedResult = JSON.parse(functionResult); } 
//     catch { parsedResult = { text: functionResult }; }

//     const result2 = await model.generateContent({
//       contents: [
//         ...contents,
//         { role: "model", parts: [{ functionCall: call }] },
//         { role: "function", parts: [{ functionResponse: { name: call.name, response: parsedResult } }] }
//       ],
//       tools
//     });

//     return res.status(200).json({ text: result2.response.text() });

//   } catch (err) {
//     if (err.status === 429) {
//       console.warn("Gemini API quota exceeded. Retry later.");
//       return res.status(429).json({ text: "Hệ thống quá tải. Vui lòng thử lại sau vài giây." });
//     }
//     console.error("Gemini/DB error:", err);
//     return res.status(500).json({ text: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau." });
//   }
// };

// const chatWithDatabase = async (req, res) => {
//   const { message, history = [], patientId, fullName, conversationId,language } = req.body;
// //   if (!patientId) return res.status(400).json({ text: "Thiếu patientId để truy vấn dữ liệu." });
//   const userName = fullName ? fullName.split(' ').slice(-1)[0] : 'bạn';
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//   const offTopicResponse = language === "vi"
//       ? `Tôi là trợ lý AI của **CareFlow** – tôi chỉ hỗ trợ **thông tin lịch khám, bác sĩ, bệnh viện** và **tư vấn sức khỏe**.  
//     Bạn có thể hỏi:  
//     • "Lịch khám của tôi là khi nào?"  
//     • "Bác sĩ nào nổi bật?"  
//     • "Bệnh viện ở Hà Nội?"  
//     • "Cảm cúm nên uống thuốc gì?"  
//     Bạn cần hỗ trợ gì về sức khỏe hôm nay?`
//       : `Sorry, I'm the AI assistant for **CareFlow** – I only help with **booking appointments** and **health advice**.  
//     You can ask:  
//     • "When is my appointment?"  
//     • "Who are the top doctors?"  
//     • "Hospitals in Hanoi?"  
//     • "What should I take for a cold?"  
//     How can I assist with your health today?`;

//     let provinceName = extractProvinceNameFromText(message);
//     let keyword = extractHospitalKeyword(message);
//     const callArgs = { keyword, provinceName };
//     let keywordDoctor = extractDoctorKeyword(message);
//     const callArgsDoctor = { keywordDoctor, provinceName };

//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     systemInstruction: `
//       Bạn là trợ lý AI y tế của hệ thống CareFlow. Patient ID: ${patientId}.
//       Người dùng hiện tại: **${fullName || 'bạn'}** (gọi tên thân thiện, ví dụ: "bạn Minh", "chị Lan").

//       === CÁCH XƯNG HÔ ===
//         - Gọi người dùng bằng tên (nếu có) khi trò chuyện lần đầu các lượt thoại sau không cần: "bạn ${userName}", "chị ${userName}", "anh ${userName}".
//         - Nếu không có tên và các lượt thoại sau → dùng "bạn".
//         - Trả lời tự nhiên, gần gũi như bác sĩ quen, (thỉnh thoảng thêm icon phù hợp nhưng lưu ý không thêm icon quá nhiều và thường xuyên).

//       === CHỦ ĐỀ ĐƯỢC PHÉP ===
//       1. Nếu người dùng hỏi về:
//         - Lịch khám, đặt lịch → gọi getNewAppointment(patientId)
//         - Bác sĩ nổi bật → gọi getTopDoctor(limit)
//         - Tìm bệnh viện, bệnh viện theo địa chỉ → gọi searchHospital(${callArgs})
//         - Tìm bác sĩ, bác sĩ theo địa chỉ → gọi searchDoctor(${callArgsDoctor})
//       2. Nếu người dùng hỏi về:
//         - Triệu chứng bệnh
//         - Cách phòng ngừa
//         - Thuốc, thực phẩm nên/tránh
//         - Kiến thức y tế chung
//         → Trả lời trực tiếp, ngắn gọn, dễ hiểu, bằng tiếng Việt (nếu language = "vi") hoặc tiếng Anh (nếu "en").
//       3. Hướng dẫn cách đặt lịch khám CareFlow
//       → Trả lời trực tiếp, mô tả các bước rõ ràng giống hệt như sau:
//           - Tìm kiếm và lựa chọn bác sĩ hoặc bệnh viện muốn khám
//           - Chọn thời gian khám phù hợp
//           - Xác nhận thông tin đặt lịch
//           - Nhấn nút "Đặt lịch"
//           - Nhận thông báo và nhắc hẹn qua email

//       
//       === CHỦ ĐỀ BỊ CẤM ===
//         - Thời tiết, giá vàng, bóng đá, chính trị, giải trí, tin tức chung
//         - Bất kỳ câu hỏi nào KHÔNG liên quan đến sức khỏe hoặc đặt khám
//       
//       === QUY TẮC TRẢ LỜI ===
//         1. Nếu câu hỏi thuộc chủ đề được phép → trả lời bình thường
//         2. Nếu câu hỏi KHÔNG liên quan → trả lời chính xác như sau:
//           """
//           ${offTopicResponse}
//           """

//         === VÍ DỤ ===
//           User: "Hôm nay trời mưa không?" → "${offTopicResponse}"
//           User: "Kết quả bóng đá?" → "${offTopicResponse}"
//           User: "Giá vàng hôm nay?" → "${offTopicResponse}"

//       === NGÔN NGỮ ===
//       - language = "vi" → trả lời tiếng Việt
//       - language = "en" → trả lời tiếng Anh

//       === LƯU Ý ===
//       - Không hỏi lại "ID bệnh nhân là gì?"
//       - Nếu không có dữ liệu → "Hiện tại không tìm thấy kết quả."
//       - Luôn trả lời tự nhiên, thân thiện, như bác sĩ tư vấn.
//       - **Khi trả lời kiến thức y tế chung có liên quan (triệu chứng, thuốc, phòng ngừa), luôn thêm câu: "Lưu ý lời khuyên này không thể thay thế bác sĩ."**
//     `.trim()
//   });

//     // --- LOGIC XỬ LÝ VÀ LƯU TRỮ CUỘC TRÒ CHUYỆN ---
//     let currentConversationId;
//     let isNewConversation = false;
    
//     // 1. Lấy hoặc tạo Conversation mới
//     try {
//         const result = await chatbotService.getOrCreateConversation(conversationId, patientId, message);
//         currentConversationId = result.conversation.id;
//         isNewConversation = result.newConversation;
//     } catch (dbErr) {
//         console.error("Lỗi DB khi xử lý Conversation:", dbErr);
//         // Trả về lỗi nếu không thể tạo/cập nhật phiên trò chuyện
//         return res.status(500).json({ text: "Lỗi hệ thống: Không thể khởi tạo phiên trò chuyện." });
//     }

//     // 2. Lưu tin nhắn của Người dùng (User Message)
//     try {
//         await chatbotService.saveMessage(currentConversationId, patientId, 'user', message);
//     } catch (dbErr) {
//         console.error("Lỗi DB khi lưu User Message:", dbErr);
//     }

//   // **Chỉ lấy 10 tin nhắn gần nhất để giảm token**
//   const limitedHistory = history.slice(-10);

//   const contents = [
//     { role: "model", parts: [{ text: `Patient ID: ${patientId}. Dùng ID này để tra cứu lịch khám.` }] },
//     ...limitedHistory.map(msg => ({
//       role: msg.from === "user" ? "user" : "model",
//       parts: [{ text: msg.text }]
//     })),
//     { role: "user", parts: [{ text: message }] }
//   ];

//   try {
//     const result1 = await model.generateContent({ contents, tools });

//     const response1 = result1.response;
//     const functionCall = response1.candidates?.[0]?.content?.parts?.[0]?.functionCall;

//     let finalResponseText;

//     // Nếu text bình thường → trả về luôn
//     if (!functionCall) {
//         finalResponseText = response1.text();
//         // --- LOGIC LƯU PHẢN HỒI BOT (TEXT) ---
//         await chatbotService.saveMessage(currentConversationId, null, 'bot', finalResponseText);
//         return res.status(200).json({ 
//             text: finalResponseText,
//             conversationId: currentConversationId,
//             newConversation: isNewConversation,
//         });
//     }

//     const call = { ...functionCall, args: { ...functionCall.args, patientId } };

//     const functionResult = await executeFunction(call.name, call.args);
//     let parsedResult;
//     try { parsedResult = JSON.parse(functionResult); } 
//     catch { parsedResult = { text: functionResult }; }

//     const result2 = await model.generateContent({
//       contents: [
//         ...contents,
//         { role: "model", parts: [{ functionCall: call }] },
//         { role: "function", parts: [{ functionResponse: { name: call.name, response: parsedResult } }] }
//       ],
//       tools
//     });
    
//     finalResponseText = result2.response.text();
//     await chatbotService.saveMessage(currentConversationId, null, 'bot', finalResponseText);

//     return res.status(200).json({ 
//         text: finalResponseText,
//         conversationId: currentConversationId,
//         newConversation: isNewConversation,
//     });

//   } catch (err) {
//     if (err.status === 429) {
//       console.warn("Gemini API quota exceeded. Retry later.");
//       return res.status(429).json({ text: "Hệ thống quá tải. Vui lòng thử lại sau vài giây." });
//     }
//     console.error("Gemini/DB error:", err);
//     return res.status(500).json({ 
//         text: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
//         conversationId: currentConversationId, // Trả về ID phiên dù lỗi
//         newConversation: isNewConversation,
//     });
//   }
// };

const chatWithDatabase = async (req, res) => {
    const { message, history = [], patientId, fullName, conversationId, language } = req.body;
    
    // 1. XÁC ĐỊNH TRẠNG THÁI ĐĂNG NHẬP
    const isLoggedIn = !!patientId && patientId !== 0; 
    
    const userName = fullName ? fullName.split(' ').slice(-1)[0] : 'bạn';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const offTopicResponse = language === "vi"
        ? `Tôi là trợ lý AI của **CareFlow** - tôi chỉ hỗ trợ **thông tin lịch khám, bác sĩ, bệnh viện** và **tư vấn sức khỏe**. 
      Bạn có thể hỏi: 
      • "Lịch khám của tôi là khi nào?" 
      • "Bác sĩ nào nổi bật?" 
      • "Bệnh viện ở Hà Nội?" 
      • "Cảm cúm nên uống thuốc gì?" 
      Bạn cần hỗ trợ gì về sức khỏe hôm nay?`
            : `Sorry, I'm the AI assistant for **CareFlow** - I only help with **booking appointments** and **health advice**. 
      You can ask: 
      • "When is my appointment?" 
      • "Who are the top doctors?" 
      • "Hospitals in Hanoi?" 
      • "What should I take for a cold?" 
      How can I assist with your health today?`;

    let provinceName = extractProvinceNameFromText(message);
    let keyword = extractHospitalKeyword(message);
    const callArgs = { keyword, provinceName };
    let keywordDoctor = extractDoctorKeyword(message);
    const callArgsDoctor = { keywordDoctor, provinceName };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `
        Bạn là trợ lý AI y tế của hệ thống CareFlow. Patient ID: ${isLoggedIn ? patientId : 'Chế độ Khách (Guest)'}.
        Người dùng hiện tại: **${fullName || 'bạn'}** (gọi tên thân thiện, ví dụ: "bạn Minh", "chị Lan").

        === CÁCH XƯNG HÔ ===
        - Gọi người dùng bằng tên (nếu có) khi trò chuyện lần đầu các lượt thoại sau không cần: "bạn ${userName}", "chị ${userName}", "anh ${userName}".
        - Nếu không có tên và các lượt thoại sau → dùng "bạn".
        - Trả lời tự nhiên, gần gũi như bác sĩ quen, (thỉnh thoảng thêm icon phù hợp nhưng lưu ý không thêm icon quá nhiều và thường xuyên).

        === CHỦ ĐỀ ĐƯỢC PHÉP ===
        1. Nếu người dùng hỏi về:
        - Lịch khám, đặt lịch → gọi getNewAppointment(patientId)
        - Bác sĩ nổi bật → gọi getTopDoctor(limit)
        - Tìm bệnh viện, bệnh viện theo địa chỉ → gọi searchHospital(${callArgs})
        - Tìm bác sĩ, bác sĩ theo địa chỉ → gọi searchDoctor(${callArgsDoctor})
        2. Nếu người dùng hỏi về:
        - Triệu chứng bệnh
        - Cách phòng ngừa
        - Thuốc, thực phẩm nên/tránh
        - Kiến thức y tế chung
        → Trả lời trực tiếp, ngắn gọn, dễ hiểu, bằng tiếng Việt (nếu language = "vi") hoặc tiếng Anh (nếu "en").
        3. Hướng dẫn cách đặt lịch khám CareFlow
        → Trả lời trực tiếp, mô tả các bước rõ ràng giống hệt như sau:
        - Tìm kiếm và lựa chọn bác sĩ hoặc bệnh viện muốn khám
        - Chọn thời gian khám phù hợp
        - Xác nhận thông tin đặt lịch
        - Nhấn nút "Đặt lịch"
        - Nhận thông báo và nhắc hẹn qua email

      
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
        - Không hỏi lại "ID bệnh nhân là gì?" "ID bệnh viện là gì?" "ID bác sĩ là gì?"
        - Nếu không có dữ liệu → "Hiện tại không tìm thấy kết quả."
        - Luôn trả lời tự nhiên, thân thiện, như bác sĩ tư vấn.
        - **Khi trả lời kiến thức y tế chung có liên quan (triệu chứng, thuốc, phòng ngừa), luôn thêm câu: "Lưu ý lời khuyên này không thể thay thế bác sĩ."**
        `.trim()
    });

    // --- LOGIC XỬ LÝ VÀ LƯU TRỮ CUỘC TRÒ CHUYỆN ---
    let currentConversationId = conversationId;
    let isNewConversation = false;
    
    // 2. CHỈ LẤY/TẠO VÀ LƯU CONVERSATION KHI ĐĂNG NHẬP
    if (isLoggedIn) {
        // 1. Lấy hoặc tạo Conversation mới
        try {
            const result = await chatbotService.getOrCreateConversation(conversationId, patientId, message);
            currentConversationId = result.conversation.id;
            isNewConversation = result.newConversation;
        } catch (dbErr) {
            console.error("Lỗi DB khi xử lý Conversation:", dbErr);
            // Trả về lỗi nếu không thể tạo/cập nhật phiên trò chuyện
            return res.status(500).json({ text: "Lỗi hệ thống: Không thể khởi tạo phiên trò chuyện." });
        }

        // 2. Lưu tin nhắn của Người dùng (User Message)
        try {
            await chatbotService.saveMessage(currentConversationId, patientId, 'user', message);
        } catch (dbErr) {
            console.error("Lỗi DB khi lưu User Message:", dbErr);
        }
    } else {
        // Nếu chưa đăng nhập, đảm bảo ID được đặt lại là null
        currentConversationId = null;
        isNewConversation = false;
    }


    // **Chỉ lấy 10 tin nhắn gần nhất để giảm token**
    const limitedHistory = history.slice(-10);

    // 3. CẬP NHẬT CONTEXT VÀO CONTENTS CHO GEMINI
    const systemContext = isLoggedIn 
        ? `Patient ID: ${patientId}. Dùng ID này để tra cứu lịch khám.` 
        : `Bạn đang ở chế độ khách. Chỉ trả lời các câu hỏi kiến thức y tế chung, bác sĩ, bệnh viện.`;
        
    const contents = [
        { role: "model", parts: [{ text: systemContext }] },
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

        let finalResponseText;

        // Nếu text bình thường → trả về luôn
        if (!functionCall) {
            finalResponseText = response1.text();
            // --- LOGIC LƯU PHẢN HỒI BOT (CHỈ LƯU KHI ĐĂNG NHẬP) ---
            if (isLoggedIn) {
                await chatbotService.saveMessage(currentConversationId, null, 'bot', finalResponseText);
            }
            return res.status(200).json({ 
                text: finalResponseText,
                conversationId: currentConversationId, // Sẽ là null nếu chưa đăng nhập
                newConversation: isNewConversation,
            });
        }
        
        // 4. XỬ LÝ KHI CÓ FUNCTION CALL (NGƯỜI DÙNG LÀ KHÁCH HỎI LỊCH KHÁM)
        if (functionCall && !isLoggedIn && functionCall.name === 'getNewAppointment') {
            finalResponseText = language === "vi" 
                ? `Xin lỗi, bạn cần **Đăng nhập** để tôi có thể tra cứu thông tin lịch khám cá nhân của bạn.`
                : `Sorry, you need to be **logged in** for me to retrieve your personal appointment information.`;

            // Không lưu tin nhắn nếu không đăng nhập
            return res.status(200).json({ 
                text: finalResponseText,
                conversationId: null, // Bắt buộc là null
                newConversation: false,
            });
        }
        
        // Xử lý Function Call (chỉ chạy nếu cần và đã đăng nhập hoặc hàm không cần patientId)
        const call = { 
            ...functionCall, 
            args: { 
                ...functionCall.args, 
                // Chỉ thêm patientId vào args nếu đã đăng nhập
                ...(isLoggedIn ? { patientId } : {}) 
            } 
        };

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
        
        finalResponseText = result2.response.text();

        // LOGIC LƯU PHẢN HỒI BOT (CHỈ LƯU KHI ĐĂNG NHẬP)
        if (isLoggedIn) {
            await chatbotService.saveMessage(currentConversationId, null, 'bot', finalResponseText);
        }

        return res.status(200).json({ 
            text: finalResponseText,
            conversationId: currentConversationId,
            newConversation: isNewConversation,
        });

    } catch (err) {
        if (err.status === 429) {
            console.warn("Gemini API quota exceeded. Retry later.");
            return res.status(429).json({ text: "Hệ thống quá tải. Vui lòng thử lại sau vài giây." });
        }
        console.error("Gemini/DB error:", err);
        return res.status(500).json({ 
            text: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
            conversationId: isLoggedIn ? currentConversationId : null, // Trả về ID phiên nếu có thể, hoặc null nếu là khách
            newConversation: isNewConversation,
        });
    }
};

// Lấy danh sách conversation
const getAllConversations = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                errCode: 1,
                errMessage: "Missing userId"
            });
        }

        const result = await chatbotService.getAllConversationsService(userId);
        return res.status(200).json(result);

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: "Error from server"
        });
    }
};


// Lấy chi tiết 1 conversation
const getConversationDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await chatbotService.getConversationDetailService(id);
        return res.status(200).json(result);

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: "Error from server"
        });
    }
};

export default { chatWithDatabase, getAllConversations, getConversationDetail };
