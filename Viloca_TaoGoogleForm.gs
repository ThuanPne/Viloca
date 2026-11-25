/**
 * Chạy hàm createVilocaSurveyForm() 1 lần trong script.google.com để tự động
 * tạo Google Form khảo sát trải nghiệm người dùng Viloca + Google Sheet nhận
 * phản hồi liên kết sẵn.
 *
 * Cách dùng:
 * 1. Mở https://script.google.com/ -> New project
 * 2. Xoá code mẫu, dán toàn bộ nội dung file này vào
 * 3. Bấm Run (chọn hàm createVilocaSurveyForm) -> lần đầu Google sẽ hỏi
 *    quyền truy cập Drive/Forms của chính tài khoản bạn -> bấm Allow
 * 4. Sau khi chạy xong, vào View > Logs (hoặc Ctrl+Enter) để lấy link Form
 *    và link Sheet phản hồi
 */
function createVilocaSurveyForm() {
  var form = FormApp.create('Khảo sát trải nghiệm người dùng - Viloca');
  form.setDescription(
    'Cảm ơn bạn đã dành thời gian trải nghiệm Viloca! ' +
    'Chia sẻ của bạn giúp đội ngũ cải thiện ứng dụng tốt hơn mỗi ngày.'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setShuffleQuestions(false);

  // ---------------------------------------------------------------------
  // A. THONG TIN CHUNG
  // ---------------------------------------------------------------------
  form.addPageBreakItem().setTitle('A. Thông tin chung');

  form.addTextItem().setTitle('Họ tên (tuỳ chọn)').setRequired(false);
  form.addTextItem()
    .setTitle('Email / số điện thoại (tuỳ chọn, để liên hệ lại nếu cần)')
    .setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle('Độ tuổi')
    .setChoiceValues(['Dưới 18', '18-24', '25-34', '35-44', 'Trên 44'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Giới tính')
    .setChoiceValues(['Nam', 'Nữ', 'Khác'])
    .setRequired(true);
  form.addTextItem().setTitle('Nghề nghiệp').setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle('Tần suất đi du lịch trong 1 năm')
    .setChoiceValues(['Hiếm khi', '1-2 lần', '3-5 lần', 'Trên 5 lần'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Bạn đã sử dụng Viloca được bao lâu?')
    .setChoiceValues(['Dưới 1 tuần', '1-4 tuần', '1-3 tháng', 'Trên 3 tháng'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Bạn đang dùng gói nào?')
    .setChoiceValues(['Free', 'Pro', 'Không rõ'])
    .setRequired(true);

  // ---------------------------------------------------------------------
  // B. MUC DO HAI LONG THEO TUNG TINH NANG (Grid)
  // ---------------------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('B. Mức độ hài lòng theo từng tính năng')
    .setHelpText('0 = Chưa từng dùng · 1 = Rất không hài lòng · 5 = Rất hài lòng');

  var features = [
    'Tìm kiếm / khám phá địa điểm gần bạn (Nearby)',
    'Lập kế hoạch chuyến đi bằng AI',
    'Quản lý chuyến đi cá nhân (Workspace)',
    'Check-in địa điểm & tích điểm',
    'Nhiệm vụ & điểm danh hằng ngày',
    'Bảng xếp hạng (Leaderboard)',
    'Gợi ý ẩm thực / lưu trú / lễ hội',
    'Gợi ý lịch trình thích ứng theo thời tiết',
    'Bản đồ ngoại tuyến (Offline map)',
    'Khám phá cộng đồng (bài đăng, ảnh)'
  ];
  form.addGridItem()
    .setTitle('Mức độ hài lòng với từng tính năng')
    .setRows(features)
    .setColumns(['0 - Chưa dùng', '1', '2', '3', '4', '5'])
    .setRequired(true);

  // ---------------------------------------------------------------------
  // C. DANH GIA TONG THE
  // ---------------------------------------------------------------------
  form.addPageBreakItem().setTitle('C. Đánh giá tổng thể trải nghiệm');

  form.addScaleItem()
    .setTitle('Mức độ hài lòng tổng thể với Viloca')
    .setBounds(1, 5)
    .setLabels('Rất không hài lòng', 'Rất hài lòng')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('Khả năng giới thiệu Viloca cho bạn bè / người thân')
    .setBounds(0, 10)
    .setLabels('Chắc chắn không', 'Chắc chắn có')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('Mức độ dễ sử dụng (giao diện, thao tác)')
    .setBounds(1, 5)
    .setLabels('Rất khó', 'Rất dễ')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('Tốc độ / hiệu năng ứng dụng (tải trang, tải ảnh...)')
    .setBounds(1, 5)
    .setLabels('Rất chậm', 'Rất nhanh')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('Độ chính xác thông tin địa điểm (địa chỉ, giờ mở cửa, giá...)')
    .setBounds(1, 5)
    .setLabels('Rất không chính xác', 'Rất chính xác')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('Thiết kế giao diện / trải nghiệm thị giác')
    .setBounds(1, 5)
    .setLabels('Rất không thích', 'Rất thích')
    .setRequired(true);

  // ---------------------------------------------------------------------
  // D. CAM NHAN & DE XUAT
  // ---------------------------------------------------------------------
  form.addPageBreakItem().setTitle('D. Cảm nhận & đề xuất');

  form.addParagraphTextItem()
    .setTitle('Tính năng bạn thích nhất là gì? Vì sao?')
    .setRequired(false);
  form.addParagraphTextItem()
    .setTitle('Điều gì khiến bạn chưa hài lòng / muốn cải thiện?')
    .setRequired(false);
  form.addParagraphTextItem()
    .setTitle('Bạn có đề xuất tính năng mới nào cho Viloca không?')
    .setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle('Bạn có sẵn sàng trả phí cho gói Pro không?')
    .setChoiceValues(['Có', 'Không', 'Có thể'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Nếu có, mức giá hợp lý theo bạn là bao nhiêu /tháng?')
    .setChoiceValues([
      'Dưới 50.000đ', '50.000-100.000đ', '100.000-200.000đ',
      'Trên 200.000đ', 'Chưa rõ'
    ])
    .setRequired(false);
  form.addParagraphTextItem().setTitle('Góp ý khác (nếu có)').setRequired(false);

  // ---------------------------------------------------------------------
  // Tao Sheet nhan phan hoi va lien ket voi Form
  // ---------------------------------------------------------------------
  var ss = SpreadsheetApp.create('Viloca - Phản hồi khảo sát');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('Form (gửi cho người dùng điền): ' + form.getPublishedUrl());
  Logger.log('Form (để bạn chỉnh sửa): ' + form.getEditUrl());
  Logger.log('Google Sheet nhận phản hồi: ' + ss.getUrl());
}
