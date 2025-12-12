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
  "tp. hà nội": "Hà Nội",
  "hn": "Hà Nội",
  "hà nội": "Hà Nội",
  "ha noi": "Hà Nội",
  "tp. hải phòng": "Hải Phòng",
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
  "tp. huế": "Huế",
  "tp. đà nẵng": "Đà Nẵng",
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
  "hồ chí minh": "Hồ Chí Minh",
  "tp.hồ chí minh": "Hồ Chí Minh",
  "tphcm": "Hồ Chí Minh",
  "hcm": "Hồ Chí Minh",
  "sài gòn": "Hồ Chí Minh",
  "sai gon": "Hồ Chí Minh",
  "sg": "Hồ Chí Minh",
  "thành phố hồ chí minh": "Hồ Chí Minh",
  "tp. hồ chí minh": "Hồ Chí Minh",
  "tphcm": "Hồ Chí Minh",
  "hcm": "Hồ Chí Minh",
  "Hồ Chí Minh": "Hồ Chí Minh",
  "Ho Chi Minh": "Hồ Chí Minh",
  "bà rịa - vũng tàu": "Bà Rịa - Vũng Tàu",
  "đồng tháp": "Đồng Tháp",
  "tiền giang": "Tiền Giang",
  "an giang": "An Giang",
  "kiên giang": "Kiên Giang",
  "vĩnh long": "Vĩnh Long",
  "bến tre": "Bến Tre",
  "trà vinh": "Trà Vinh",
  "cần thơ": "Cần Thơ",
  "sóc trăng": "Sóc Trăng",
  "hậu giang": "Hậu Giang",
  "cà mau": "Cà Mau",
  "bạc liêu": "Bạc Liêu",
};

// const extractProvinceName = (text) => {
//   text = text.toLowerCase();
//   for (const key in provinceMapping) {
//     if (text.includes(key)) {
//       return provinceMapping[key];
//     }
//   }
//   return null;
// };

const extractProvinceName = (text) => {
  const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const key in provinceMapping) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lowerText.includes(normalizedKey)) {
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
//       description: "Tìm bệnh viện theo tên hoặc theo tỉnh/thành",
//       parameters: {
//         type: "object",
//         properties: {
//           keyword: { type: "string", description: "Tên bệnh viện hoặc địa chỉ" },
//           provinceId: { type: "integer", description: "ID tỉnh thành muốn tìm" }
//         },
//       },
//     },
//   ],
// };

// const searchDoctorTool = {
//   functionDeclarations: [
//     {
//       name: "searchDoctor",
//       description: "Tìm bác sĩ theo tên hoặc theo tỉnh/thành",
//       parameters: {
//         type: "object",
//         properties: {
//           keyword: { type: "string", description: "Tên bác sĩ hoặc địa chỉ" },
//           provinceId: { type: "integer", description: "ID tỉnh thành muốn tìm" }
//         },
//       },
//     },
//   ],
// };

const searchHospitalTool = {
  functionDeclarations: [
    {
      name: "searchHospital",
      description: "Tìm bệnh viện theo tên bệnh viện hoặc theo tên tỉnh/thành phố (ví dụ: Hồ Chí Minh, Hà Nội, Đà Nẵng)",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Tên bệnh viện cụ thể (có thể để trống nếu chỉ tìm theo tỉnh)"
          },
          provinceName: {
            type: "string",
            description: "Tên tỉnh/thành phố cần tìm bệnh viện (ví dụ: 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng')"
          }
        },
        required: []
      },
    },
  ],
};

const searchDoctorTool = {
  functionDeclarations: [
    {
      name: "searchDoctor",
      description: "Tìm bác sĩ theo tên hoặc theo tên tỉnh/thành phố",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Tên bác sĩ (có thể để trống)"
          },
          provinceName: {
            type: "string",
            description: "Tên tỉnh/thành phố (ví dụ: 'Hồ Chí Minh')"
          }
        },
        required: []
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

      // case "searchHospital":
      //   const searchResult = await chatbotService.searchAll(args);
      //   return JSON.stringify(searchResult);

      // case "searchDoctor":
      //   const searchResultDoctor = await chatbotService.searchDoctor(args);
      //   return JSON.stringify(searchResultDoctor);
      case "searchHospital":
        const searchResult = await chatbotService.searchAll({
          keyword: args.keyword || "",
          provinceName: args.provinceName || null
        });
        return JSON.stringify(searchResult);

      case "searchDoctor":
        const searchResultDoctor = await chatbotService.searchDoctor({
          keyword: args.keyword || "",
          provinceName: args.provinceName || null
        });
        return JSON.stringify(searchResultDoctor);

      default:
        return JSON.stringify({ error: "Function not found" });
    }
  } catch (err) {
    console.error("ExecuteFunction error:", err);
    return JSON.stringify({ error: "Lỗi truy vấn database." });
  }
};


const chatWithDatabase = async (req, res) => {
    const { message, history = [], patientId, fullName, conversationId, language } = req.body;
    
    // 1. XÁC ĐỊNH TRẠNG THÁI ĐĂNG NHẬP
    const isLoggedIn = !!patientId && patientId !== 0; 
    
    const userName = fullName ? fullName.split(' ').slice(-1)[0] : 'bạn';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const offTopicResponse = language === "vi"
        ? `Tôi là trợ lý AI của **CareFlow** - tôi có thể hỗ trợ **thông tin lịch khám, bác sĩ, bệnh viện** và **tư vấn sức khỏe**. 
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

    const isFirstTurn = history.length === 0;
    
    const userSalutation = isFirstTurn && fullName
        ? (fullName.split(' ')[0] === 'Chị' || fullName.split(' ')[0] === 'Anh' ? `${fullName.split(' ')[0]} ${userName}` : `bạn ${userName}`)
        : 'bạn';

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `
        Bạn là trợ lý AI y tế của hệ thống CareFlow. Patient ID: ${isLoggedIn ? patientId : 'Chế độ Khách (Guest)'}.
        Người dùng hiện tại: **${fullName || 'bạn'}** (gọi tên thân thiện, ví dụ: "bạn Minh", "chị Lan").

        === CÁCH XƯNG HÔ ===
        Người dùng hiện tại: **${fullName || 'bạn'}**.
        === CÁCH XƯNG HÔ ===
        - **Luôn xưng hô với người dùng là "${userSalutation}" trong câu trả lời.** (Ví dụ: "Chào bạn Minh", "Chào bạn")
        - Trả lời tự nhiên, gần gũi như bác sĩ quen, (thỉnh thoảng thêm các icon phù hợp không trùng lặp icon quá nhiều nhưng lưu ý không thêm icon quá nhiều và thường xuyên).

        === CHỦ ĐỀ ĐƯỢC PHÉP ===
        1. Nếu người dùng hỏi về:
        - Lịch khám, đặt lịch → gọi getNewAppointment(patientId)
        - Bác sĩ nổi bật → gọi getTopDoctor(limit)
        - Tìm bệnh viện, bệnh viện theo địa chỉ → gọi searchHospital(${callArgs})
        KHI NGƯỜI DÙNG HỎI VỀ BỆNH VIỆN + CÓ TÊN TỈNH/THÀNH PHỐ (dù chỉ là "ở Hà Nội", "tại TPHCM", "ở đâu ở Đà Nẵng", "bệnh viện ở Hồ Chí Minh", v.v.):
        → BẮT BUỘC gọi tool searchHospital(${callArgs}) với:
          - keyword: để trống hoặc tên bệnh viện nếu có
          - provinceName: tên tỉnh/thành đã được extract (ví dụ: "Hồ Chí Minh", "Hà Nội", "Đà Nẵng")
        KHÔNG tự suy luận "không có bệnh viện" nếu chưa gọi tool.
        Nếu không chắc chắn → vẫn phải gọi tool trước.

        Khi liệt kê **BỆNH VIỆN** (từ searchHospital):
        - trả lời một cách thân thiện, tự nhiên, có thể xưng tên hoặc bạn
        • Tên bệnh viện phải là link Markdown: [Tên bệnh viện](${process.env.URL_REACT}/detail-hospital/ID_BỆNH_VIỆN)
        • Hiển thị thêm: địa chỉ đầy đủ, tỉnh/thành, các thông tin và mô tả của bệnh viện
        - Lưu ý: các thông tin cần trình bày rõ ràng, dễ nhìn, không viết liền mạch quá nhiều
        • Kết thúc: "Nhấn vào tên bệnh viện để xem chi tiết và đặt lịch nhé!"

        - Tìm bác sĩ, bác sĩ theo địa chỉ → gọi searchDoctor(${callArgsDoctor})
        === QUY TẮC HIỂN THỊ BÁC SĨ ===
          Khi liệt kê bác sĩ (từ getTopDoctor hoặc searchDoctor), PHẢI:
          - trả lời một cách thân thiện, tự nhiên, có thể xưng tên hoặc bạn
          - trả lời với các thông tin của bác sĩ đó 
          1. Tên + học hàm + chuyên khoa → dưới dạng link Markdown
          2. Số lượt đặt khám (nếu có)
          3. Địa chỉ phòng khám (nếu có)
          4. Số điện thoại, email (nếu có)
          5. Thông tin chi tiết, số lượt yêu thích rating nếu có
          từng thông tin của bác sĩ nên xuống hàng và trình bày dễ nhìn
          - Gắn link chi tiết bác sĩ theo định dạng sau:
            • Dùng Markdown: [Tên bác sĩ - Chuyên khoa](URL)
            • Hoặc plain text: https://care-flow-nu.vercel.app/detail-doctor/id
          - URL chi tiết bác sĩ: ${process.env.URL_REACT}/detail-doctor/ID_BÁC_SĨ
          - Luôn khuyến khích: "Bạn có thể nhấn vào tên bác sĩ để xem hồ sơ và đặt lịch ngay nhé!"
          KHÔNG BAO GIỜ chỉ in mỗi link.
          KHÔNG BAO GIỜ bỏ qua các thông tin và mô tả của bác sĩ.

          KHÔNG BAO GIỜ liệt kê bác sĩ mà không có link.
        QUY TẮC SẮT (KHÔNG ĐƯỢC PHÁ VỠ):
        1. Khi thấy từ "bệnh viện" + bất kỳ tỉnh/thành nào (Hà Nội, HCM, Đà Nẵng, v.v.) → GỌI searchHospital NGAY, không trả lời suông.
        2. Khi thấy từ "bác sĩ" + tỉnh/thành → GỌI searchDoctor NGAY.
        3. Khi thấy "lịch khám của tôi", "lịch hẹn" → GỌI getNewAppointment NGAY (nếu đã đăng nhập).
        4. Không bao giờ nói "không tìm thấy" nếu chưa gọi tool.
        5. Nếu tool trả về rỗng → lúc đó mới nói "hiện chưa có dữ liệu".
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
