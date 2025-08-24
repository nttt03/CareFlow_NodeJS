const getBotReply = async (message) => {
  const text = message.toLowerCase();

  if (text.includes("giờ làm việc")) {
    return "Giờ làm việc là từ 8h đến 17h, thứ 2 đến thứ 7.";
  }

  if (text.includes("khoa nhi")) {
    return "Chúng tôi có khoa Nhi với đội ngũ bác sĩ giàu kinh nghiệm.";
  }

  if (text.includes("bác sĩ")) {
    return "Bạn cần bác sĩ chuyên khoa nào? Nội, Ngoại, Nhi, Tai Mũi Họng?";
  }

  return "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể đặt lại không?";
};

module.exports = {
  getBotReply,
};
