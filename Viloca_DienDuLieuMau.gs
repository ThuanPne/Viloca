/**
 * File này có 2 cách điền 15 dòng dữ liệu mẫu vào Google Sheet phản hồi của
 * form "Khảo sát trải nghiệm người dùng - Viloca":
 * https://docs.google.com/spreadsheets/d/149BCf8oJKPfB4Ll6AFCRhhqSSpcO91wlVBZBDc00MDE
 *
 * CÁCH 1 — seedSampleResponses(): ghi cả 15 dòng ngay lập tức, trong 1 lần
 * chạy -> lịch sử phiên bản (Version history) của Google Sheet chỉ ghi nhận
 * ĐÚNG 1 lần sửa (vì toàn bộ xảy ra trong cùng 1 phiên script).
 *
 * CÁCH 2 — installScheduledSeeding(): lên lịch 15 lần kích hoạt THỰC SỰ
 * cách nhau ở các thời điểm ngẫu nhiên (dùng time-based trigger của Apps
 * Script), mỗi lần chỉ ghi đúng 1 dòng rồi tự xoá trigger đó. Vì mỗi lần ghi
 * là 1 phiên thực thi riêng, cách nhau thời gian thực, nên Google Sheets có
 * nhiều khả năng ghi nhận thành nhiều phiên bản riêng biệt trong lịch sử,
 * thay vì gộp thành 1 lần như Cách 1. Dùng cách này nếu bạn cần trông "tự
 * nhiên" hơn khi xem lại Nhật ký phiên bản.
 *
 * Cách dùng CÁCH 2:
 * 1. Mở https://script.google.com/ -> New project -> dán toàn bộ file này
 * 2. Bấm Run, chọn hàm installScheduledSeeding -> Allow quyền truy cập
 * 3. Script sẽ lên lịch 15 trigger, khoảng cách giữa các lần rút ngẫu nhiên
 *    theo phân phối exponential (trung bình ~5 phút/lần, có lúc vài chục
 *    giây, có lúc gần 30 phút) — tổng thời gian cho 15 dòng dao động mỗi lần
 *    chạy, thường rơi vào khoảng 45 phút - 2 tiếng. Có thể đóng tab, không
 *    cần máy tính bật liên tục vì trigger chạy trên server của Google.
 * 4. Theo dõi tiến độ: Apps Script editor -> biểu tượng đồng hồ (Triggers)
 *    bên trái, hoặc xem Executions log
 * 5. Nếu muốn huỷ giữa chừng: chạy hàm cancelScheduledSeeding()
 *
 * Luu y: day la DU LIEU MAU de demo/test bao cao Tong hop, khong phai phan
 * hoi that tu nguoi dung. Xoa cac dong nay truoc khi gui form cho nguoi dung
 * that de thu thap du lieu chinh thuc.
 */
function seedSampleResponses() {
  var SPREADSHEET_ID = '149BCf8oJKPfB4Ll6AFCRhhqSSpcO91wlVBZBDc00MDE';
  var SHEET_NAME = 'Câu trả lời biểu mẫu 1';

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Không tìm thấy sheet "' + SHEET_NAME + '". Kiểm tra lại tên tab trong Google Sheet.');
  }

  // Cot: A Dau thoi gian | B Ho ten | C Do tuoi | D Gioi tinh | E Nghe nghiep
  // | F Tan suat du lich | G-P 10 tinh nang (0-5) | Q Hai long tong the (1-5)
  // | R NPS (0-10) | S De su dung (1-5) | T Toc do (1-5) | U Do chinh xac (1-5)
  // | V Thiet ke (1-5) | W Thich nhat | X Cai thien | Y De xuat moi
  // | Z San sang tra phi | AA Muc gia | AB Gop y khac
  var rows = [
    [new Date('2026-10-20T09:15:00'), 'Nguyễn Thị Lan', '25-34', 'Nữ', 'Nhân viên văn phòng', '3-5 lần',
      5, 5, 4, 5, 3, 2, 5, 4, 0, 4,
      5, 9, 5, 4, 4, 5,
      'Tính năng lập kế hoạch bằng AI, tiết kiệm thời gian rất nhiều khi đi Đà Lạt.',
      'Thỉnh thoảng tải ảnh địa điểm hơi chậm khi mạng yếu.',
      'Thêm tính năng đặt vé máy bay/khách sạn ngay trong app.',
      'Có', '50.000-100.000đ', 'App rất hữu ích, sẽ giới thiệu cho bạn bè.'],

    [new Date('2026-10-21T14:30:00'), 'Trần Văn Hùng', '35-44', 'Nam', 'Kỹ sư', '1-2 lần',
      4, 3, 5, 4, 4, 4, 3, 0, 5, 2,
      4, 7, 4, 3, 3, 4,
      'Bản đồ ngoại tuyến rất tiện khi đi vùng sóng yếu.',
      'Thông tin giờ mở cửa một số quán ăn không chính xác.',
      'Cho phép đánh giá/review địa điểm trực tiếp trong app.',
      'Có thể', 'Chưa rõ', ''],

    [new Date('2026-10-22T20:05:00'), 'Lê Thị Mai', '18-24', 'Nữ', 'Sinh viên', 'Hiếm khi',
      3, 4, 0, 5, 5, 5, 2, 1, 0, 5,
      4, 8, 5, 4, 3, 5,
      'Nhiệm vụ hằng ngày và bảng xếp hạng tạo động lực check-in liên tục.',
      'Giao diện bảng xếp hạng hơi rối, khó xem thứ hạng của mình.',
      'Thêm huy hiệu/phần thưởng khi đạt mốc check-in.',
      'Không', 'Chưa rõ', 'Là sinh viên nên ưu tiên bản miễn phí.'],

    [new Date('2026-10-23T11:45:00'), 'Phạm Quốc Bảo', '25-34', 'Nam', 'Freelancer', 'Trên 5 lần',
      5, 5, 5, 3, 2, 1, 5, 5, 4, 3,
      5, 10, 4, 5, 5, 4,
      'Gợi ý lịch trình theo thời tiết rất thông minh, tránh được mưa khi đi Hội An.',
      'Không có gì đáng kể.',
      'Tích hợp chia sẻ lịch trình cho nhóm bạn cùng chỉnh sửa.',
      'Có', '100.000-200.000đ', 'Một trong những app du lịch tốt nhất mình từng dùng.'],

    [new Date('2026-10-24T16:20:00'), 'Đỗ Thu Hương', '35-44', 'Nữ', 'Giáo viên', '1-2 lần',
      2, 3, 3, 2, 0, 0, 4, 2, 0, 1,
      3, 5, 3, 3, 2, 3,
      'Gợi ý quán ăn khá đa dạng.',
      'Địa chỉ một số địa điểm bị sai, dẫn đường nhầm chỗ.',
      'Cho người dùng báo lỗi thông tin địa điểm trực tiếp.',
      'Không', 'Chưa rõ', 'Cần cải thiện độ chính xác dữ liệu trước khi thu phí.'],

    [new Date('2026-10-25T08:50:00'), 'Vũ Minh Khang', '18-24', 'Nam', 'Sinh viên', '3-5 lần',
      5, 2, 4, 5, 5, 5, 3, 0, 0, 5,
      4, 8, 5, 4, 4, 5,
      'Check-in tích điểm và cộng đồng Explore rất vui, hay xem ảnh mọi người đăng.',
      'Chưa có tính năng nhắn tin với bạn bè trong app.',
      'Thêm chat trực tiếp giữa bạn bè.',
      'Có thể', 'Dưới 50.000đ', ''],

    [new Date('2026-10-26T19:10:00'), 'Hoàng Thị Ngọc', '25-34', 'Nữ', 'Kinh doanh tự do', 'Trên 5 lần',
      4, 5, 5, 3, 1, 0, 5, 4, 3, 2,
      5, 9, 4, 4, 5, 4,
      'AI lập lịch trình rất chi tiết, phù hợp cho dân kinh doanh ít thời gian.',
      'Muốn xem được chi phí ước tính cho cả chuyến đi.',
      'Thêm tính năng ước tính ngân sách chuyến đi.',
      'Có', '100.000-200.000đ', 'Rất mong có thêm tính năng ngân sách.'],

    [new Date('2026-10-27T13:35:00'), 'Ngô Văn Tài', 'Trên 44', 'Nam', 'Kinh doanh', 'Hiếm khi',
      3, 0, 2, 0, 0, 0, 3, 0, 0, 0,
      3, 4, 2, 3, 3, 2,
      'Tìm địa điểm ăn uống khá nhanh.',
      'Giao diện hơi nhỏ, khó thao tác với người lớn tuổi.',
      'Chế độ chữ to hơn cho người lớn tuổi.',
      'Không', 'Chưa rõ', 'Chưa quen dùng app nên còn bỡ ngỡ.'],

    [new Date('2026-10-28T10:00:00'), 'Bùi Thị Thanh', '25-34', 'Nữ', 'Nhân viên marketing', '3-5 lần',
      5, 4, 5, 5, 4, 3, 5, 3, 2, 5,
      5, 9, 5, 4, 4, 5,
      'Workspace giúp quản lý nhiều chuyến đi cùng lúc rất gọn gàng.',
      'Thông báo nhắc nhiệm vụ đôi khi bị trễ.',
      'Đồng bộ lịch trình với Google Calendar.',
      'Có', '50.000-100.000đ', ''],

    [new Date('2026-10-29T21:40:00'), 'Trịnh Công Danh', '18-24', 'Nam', 'Sinh viên', '1-2 lần',
      4, 3, 0, 4, 5, 5, 2, 0, 0, 4,
      4, 7, 4, 3, 3, 4,
      'Nhiệm vụ hằng ngày vui, giống game nên dễ duy trì thói quen mở app.',
      'Đôi khi app bị lag khi load bảng xếp hạng.',
      'Thêm giải đấu/sự kiện theo mùa.',
      'Có thể', 'Dưới 50.000đ', 'Mong có thêm sự kiện theo lễ hội.'],

    [new Date('2026-10-30T15:25:00'), 'Phan Thị Yến', '35-44', 'Nữ', 'Hướng dẫn viên du lịch', 'Trên 5 lần',
      5, 5, 4, 4, 2, 1, 5, 5, 5, 3,
      5, 10, 5, 5, 5, 5,
      'Bản đồ ngoại tuyến cực kỳ hữu ích khi dẫn khách tới vùng không có sóng.',
      'Không có gì phải phàn nàn.',
      'Thêm chế độ dành riêng cho hướng dẫn viên quản lý nhóm khách.',
      'Có', 'Trên 200.000đ', 'Là công cụ không thể thiếu trong công việc của tôi.'],

    [new Date('2026-10-31T09:05:00'), 'Lâm Gia Huy', '25-34', 'Nam', 'Lập trình viên', '1-2 lần',
      3, 4, 3, 2, 0, 0, 2, 3, 0, 1,
      3, 6, 3, 2, 3, 3,
      'Gợi ý theo thời tiết khá thú vị.',
      'App hơi nặng, tốn pin khi mở lâu.',
      'Tối ưu hiệu năng, giảm dung lượng ảnh tải về.',
      'Không', 'Chưa rõ', 'Cần tối ưu hiệu năng trước khi nghĩ đến thu phí.'],

    [new Date('2026-11-01T17:50:00'), 'Đặng Khánh Linh', '18-24', 'Nữ', 'Sinh viên', '3-5 lần',
      5, 3, 4, 5, 4, 4, 5, 2, 0, 5,
      4, 8, 5, 4, 4, 5,
      'Cộng đồng Explore rất năng động, nhiều ảnh đẹp truyền cảm hứng đi du lịch.',
      'Muốn lưu bài đăng yêu thích để xem lại sau.',
      'Thêm nút lưu bài đăng (bookmark).',
      'Có thể', '50.000-100.000đ', ''],

    [new Date('2026-11-02T12:15:00'), 'Trương Minh Tuấn', '35-44', 'Nam', 'Quản lý dự án', 'Trên 5 lần',
      4, 5, 5, 4, 1, 0, 4, 4, 3, 2,
      5, 9, 4, 4, 4, 4,
      'AI lập lịch trình tiết kiệm rất nhiều thời gian chuẩn bị cho các chuyến công tác kết hợp du lịch.',
      'Muốn xuất lịch trình ra file PDF để gửi đồng nghiệp.',
      'Thêm tính năng xuất lịch trình PDF.',
      'Có', '100.000-200.000đ', 'Rất mong tính năng xuất PDF sớm được thêm vào.'],

    [new Date('2026-11-03T22:00:00'), 'Võ Thị Kim Ngân', 'Trên 44', 'Nữ', 'Nội trợ', 'Hiếm khi',
      3, 2, 0, 3, 0, 0, 4, 1, 0, 0,
      3, 6, 3, 3, 3, 3,
      'Gợi ý quán ăn ngon gần nhà khá hữu ích.',
      'Chữ hơi nhỏ, khó đọc trên điện thoại.',
      'Cho phép phóng to cỡ chữ trong phần cài đặt.',
      'Không', 'Chưa rõ', 'Nhìn chung dễ thương, phù hợp dùng hàng ngày.']
  ];

  rows.forEach(function (row) {
    sheet.appendRow(row);
  });

  Logger.log('Đã thêm ' + rows.length + ' dòng dữ liệu mẫu vào sheet "' + SHEET_NAME + '".');
  Logger.log('Mở sheet tại: ' + ss.getUrl());
}

// ===========================================================================
// CÁCH 2 — Rải 15 lần ghi ở các thời điểm thực tế ngẫu nhiên khác nhau
// ===========================================================================

var SAMPLE_PROP_KEY = 'VILOCA_PENDING_SAMPLE_ROWS';
var SAMPLE_TRIGGER_HANDLER = 'appendOneSampleRow_';

// Khoảng cách (giây) giữa 2 lần ghi liên tiếp được rút ngẫu nhiên theo phân
// phối "exponential" (mô phỏng đúng kiểu các sự kiện đến ngẫu nhiên thực tế,
// vd thời điểm người dùng submit form) thay vì random đều — nên có lúc cách
// nhau vài chục giây, có lúc cách nhau rất lâu, KHÔNG đều đều 3-5 phút như
// random uniform. MEAN_GAP_SEC là khoảng cách trung bình mong muốn; MIN/MAX
// chỉ để chặn các trường hợp quá ngắn/quá dài bất thường.
var MEAN_GAP_SEC = 300; // trung bình 5 phút/lần — chỉnh để rải nhanh/chậm hơn
var MIN_GAP_SEC = 15;   // không cho ngắn hơn 15 giây
var MAX_GAP_SEC = 1800; // không cho dài hơn 30 phút

function _randomExponentialGapSec_() {
  // -mean * ln(1 - U), U ~ Uniform(0,1) -> phân phối exponential chuẩn.
  var u = Math.random();
  var gap = -MEAN_GAP_SEC * Math.log(1 - u);
  return Math.max(MIN_GAP_SEC, Math.min(MAX_GAP_SEC, Math.round(gap)));
}

function _getSampleRows() {
  // Tách phần build dữ liệu mẫu ra riêng để dùng chung cho cả 2 cách.
  return [
    [new Date('2026-10-20T09:15:00'), 'Nguyễn Thị Lan', '25-34', 'Nữ', 'Nhân viên văn phòng', '3-5 lần',
      5, 5, 4, 5, 3, 2, 5, 4, 0, 4,
      5, 9, 5, 4, 4, 5,
      'Tính năng lập kế hoạch bằng AI, tiết kiệm thời gian rất nhiều khi đi Đà Lạt.',
      'Thỉnh thoảng tải ảnh địa điểm hơi chậm khi mạng yếu.',
      'Thêm tính năng đặt vé máy bay/khách sạn ngay trong app.',
      'Có', '50.000-100.000đ', 'App rất hữu ích, sẽ giới thiệu cho bạn bè.'],
    [new Date('2026-10-21T14:30:00'), 'Trần Văn Hùng', '35-44', 'Nam', 'Kỹ sư', '1-2 lần',
      4, 3, 5, 4, 4, 4, 3, 0, 5, 2,
      4, 7, 4, 3, 3, 4,
      'Bản đồ ngoại tuyến rất tiện khi đi vùng sóng yếu.',
      'Thông tin giờ mở cửa một số quán ăn không chính xác.',
      'Cho phép đánh giá/review địa điểm trực tiếp trong app.',
      'Có thể', 'Chưa rõ', ''],
    [new Date('2026-10-22T20:05:00'), 'Lê Thị Mai', '18-24', 'Nữ', 'Sinh viên', 'Hiếm khi',
      3, 4, 0, 5, 5, 5, 2, 1, 0, 5,
      4, 8, 5, 4, 3, 5,
      'Nhiệm vụ hằng ngày và bảng xếp hạng tạo động lực check-in liên tục.',
      'Giao diện bảng xếp hạng hơi rối, khó xem thứ hạng của mình.',
      'Thêm huy hiệu/phần thưởng khi đạt mốc check-in.',
      'Không', 'Chưa rõ', 'Là sinh viên nên ưu tiên bản miễn phí.'],
    [new Date('2026-10-23T11:45:00'), 'Phạm Quốc Bảo', '25-34', 'Nam', 'Freelancer', 'Trên 5 lần',
      5, 5, 5, 3, 2, 1, 5, 5, 4, 3,
      5, 10, 4, 5, 5, 4,
      'Gợi ý lịch trình theo thời tiết rất thông minh, tránh được mưa khi đi Hội An.',
      'Không có gì đáng kể.',
      'Tích hợp chia sẻ lịch trình cho nhóm bạn cùng chỉnh sửa.',
      'Có', '100.000-200.000đ', 'Một trong những app du lịch tốt nhất mình từng dùng.'],
    [new Date('2026-10-24T16:20:00'), 'Đỗ Thu Hương', '35-44', 'Nữ', 'Giáo viên', '1-2 lần',
      2, 3, 3, 2, 0, 0, 4, 2, 0, 1,
      3, 5, 3, 3, 2, 3,
      'Gợi ý quán ăn khá đa dạng.',
      'Địa chỉ một số địa điểm bị sai, dẫn đường nhầm chỗ.',
      'Cho người dùng báo lỗi thông tin địa điểm trực tiếp.',
      'Không', 'Chưa rõ', 'Cần cải thiện độ chính xác dữ liệu trước khi thu phí.'],
    [new Date('2026-10-25T08:50:00'), 'Vũ Minh Khang', '18-24', 'Nam', 'Sinh viên', '3-5 lần',
      5, 2, 4, 5, 5, 5, 3, 0, 0, 5,
      4, 8, 5, 4, 4, 5,
      'Check-in tích điểm và cộng đồng Explore rất vui, hay xem ảnh mọi người đăng.',
      'Chưa có tính năng nhắn tin với bạn bè trong app.',
      'Thêm chat trực tiếp giữa bạn bè.',
      'Có thể', 'Dưới 50.000đ', ''],
    [new Date('2026-10-26T19:10:00'), 'Hoàng Thị Ngọc', '25-34', 'Nữ', 'Kinh doanh tự do', 'Trên 5 lần',
      4, 5, 5, 3, 1, 0, 5, 4, 3, 2,
      5, 9, 4, 4, 5, 4,
      'AI lập lịch trình rất chi tiết, phù hợp cho dân kinh doanh ít thời gian.',
      'Muốn xem được chi phí ước tính cho cả chuyến đi.',
      'Thêm tính năng ước tính ngân sách chuyến đi.',
      'Có', '100.000-200.000đ', 'Rất mong có thêm tính năng ngân sách.'],
    [new Date('2026-10-27T13:35:00'), 'Ngô Văn Tài', 'Trên 44', 'Nam', 'Kinh doanh', 'Hiếm khi',
      3, 0, 2, 0, 0, 0, 3, 0, 0, 0,
      3, 4, 2, 3, 3, 2,
      'Tìm địa điểm ăn uống khá nhanh.',
      'Giao diện hơi nhỏ, khó thao tác với người lớn tuổi.',
      'Chế độ chữ to hơn cho người lớn tuổi.',
      'Không', 'Chưa rõ', 'Chưa quen dùng app nên còn bỡ ngỡ.'],
    [new Date('2026-10-28T10:00:00'), 'Bùi Thị Thanh', '25-34', 'Nữ', 'Nhân viên marketing', '3-5 lần',
      5, 4, 5, 5, 4, 3, 5, 3, 2, 5,
      5, 9, 5, 4, 4, 5,
      'Workspace giúp quản lý nhiều chuyến đi cùng lúc rất gọn gàng.',
      'Thông báo nhắc nhiệm vụ đôi khi bị trễ.',
      'Đồng bộ lịch trình với Google Calendar.',
      'Có', '50.000-100.000đ', ''],
    [new Date('2026-10-29T21:40:00'), 'Trịnh Công Danh', '18-24', 'Nam', 'Sinh viên', '1-2 lần',
      4, 3, 0, 4, 5, 5, 2, 0, 0, 4,
      4, 7, 4, 3, 3, 4,
      'Nhiệm vụ hằng ngày vui, giống game nên dễ duy trì thói quen mở app.',
      'Đôi khi app bị lag khi load bảng xếp hạng.',
      'Thêm giải đấu/sự kiện theo mùa.',
      'Có thể', 'Dưới 50.000đ', 'Mong có thêm sự kiện theo lễ hội.'],
    [new Date('2026-10-30T15:25:00'), 'Phan Thị Yến', '35-44', 'Nữ', 'Hướng dẫn viên du lịch', 'Trên 5 lần',
      5, 5, 4, 4, 2, 1, 5, 5, 5, 3,
      5, 10, 5, 5, 5, 5,
      'Bản đồ ngoại tuyến cực kỳ hữu ích khi dẫn khách tới vùng không có sóng.',
      'Không có gì phải phàn nàn.',
      'Thêm chế độ dành riêng cho hướng dẫn viên quản lý nhóm khách.',
      'Có', 'Trên 200.000đ', 'Là công cụ không thể thiếu trong công việc của tôi.'],
    [new Date('2026-10-31T09:05:00'), 'Lâm Gia Huy', '25-34', 'Nam', 'Lập trình viên', '1-2 lần',
      3, 4, 3, 2, 0, 0, 2, 3, 0, 1,
      3, 6, 3, 2, 3, 3,
      'Gợi ý theo thời tiết khá thú vị.',
      'App hơi nặng, tốn pin khi mở lâu.',
      'Tối ưu hiệu năng, giảm dung lượng ảnh tải về.',
      'Không', 'Chưa rõ', 'Cần tối ưu hiệu năng trước khi nghĩ đến thu phí.'],
    [new Date('2026-11-01T17:50:00'), 'Đặng Khánh Linh', '18-24', 'Nữ', 'Sinh viên', '3-5 lần',
      5, 3, 4, 5, 4, 4, 5, 2, 0, 5,
      4, 8, 5, 4, 4, 5,
      'Cộng đồng Explore rất năng động, nhiều ảnh đẹp truyền cảm hứng đi du lịch.',
      'Muốn lưu bài đăng yêu thích để xem lại sau.',
      'Thêm nút lưu bài đăng (bookmark).',
      'Có thể', '50.000-100.000đ', ''],
    [new Date('2026-11-02T12:15:00'), 'Trương Minh Tuấn', '35-44', 'Nam', 'Quản lý dự án', 'Trên 5 lần',
      4, 5, 5, 4, 1, 0, 4, 4, 3, 2,
      5, 9, 4, 4, 4, 4,
      'AI lập lịch trình tiết kiệm rất nhiều thời gian chuẩn bị cho các chuyến công tác kết hợp du lịch.',
      'Muốn xuất lịch trình ra file PDF để gửi đồng nghiệp.',
      'Thêm tính năng xuất lịch trình PDF.',
      'Có', '100.000-200.000đ', 'Rất mong tính năng xuất PDF sớm được thêm vào.'],
    [new Date('2026-11-03T22:00:00'), 'Võ Thị Kim Ngân', 'Trên 44', 'Nữ', 'Nội trợ', 'Hiếm khi',
      3, 2, 0, 3, 0, 0, 4, 1, 0, 0,
      3, 6, 3, 3, 3, 3,
      'Gợi ý quán ăn ngon gần nhà khá hữu ích.',
      'Chữ hơi nhỏ, khó đọc trên điện thoại.',
      'Cho phép phóng to cỡ chữ trong phần cài đặt.',
      'Không', 'Chưa rõ', 'Nhìn chung dễ thương, phù hợp dùng hàng ngày.']
  ];
}

/**
 * Lên lịch 15 lần ghi (mỗi lần 1 dòng), cách nhau một khoảng ngẫu nhiên thực
 * sự giữa [MIN_GAP_SEC, MAX_GAP_SEC] giây. Gọi hàm này 1 lần duy nhất.
 */
function installScheduledSeeding() {
  // Xoá trigger cũ (nếu chạy lại hàm này nhiều lần) để tránh ghi trùng/chồng lịch.
  cancelScheduledSeeding();

  var rows = _getSampleRows();
  // Lưu dữ liệu dạng JSON (Date -> ISO string) để hàm được trigger gọi lại đọc được.
  PropertiesService.getScriptProperties().setProperty(
    SAMPLE_PROP_KEY,
    JSON.stringify(rows)
  );

  var cumulativeMs = 0;
  rows.forEach(function (_, idx) {
    var gapSec = _randomExponentialGapSec_();
    cumulativeMs += gapSec * 1000;
    var fireAt = new Date(Date.now() + cumulativeMs);
    ScriptApp.newTrigger(SAMPLE_TRIGGER_HANDLER)
      .timeBased()
      .at(fireAt)
      .create();
    Logger.log('Đã lên lịch dòng #' + (idx + 1) + ' lúc ' + fireAt.toLocaleString());
  });

  Logger.log('Hoàn tất lên lịch ' + rows.length + ' lần ghi, tổng thời gian rải: ~' +
    Math.round(cumulativeMs / 60000) + ' phút.');
}

/**
 * Được gọi tự động bởi mỗi trigger (KHÔNG tự chạy tay hàm này). Mỗi lần
 * chạy chỉ ghi đúng 1 dòng còn lại trong hàng đợi, rồi tự xoá trigger của
 * chính lần gọi đó (one-time trigger tự huỷ sau khi chạy xong).
 */
function appendOneSampleRow_() {
  var SPREADSHEET_ID = '149BCf8oJKPfB4Ll6AFCRhhqSSpcO91wlVBZBDc00MDE';
  var SHEET_NAME = 'Câu trả lời biểu mẫu 1';

  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(SAMPLE_PROP_KEY);
  if (!raw) {
    Logger.log('Không còn dữ liệu nào trong hàng đợi.');
    return;
  }

  var rows = JSON.parse(raw);
  if (rows.length === 0) {
    props.deleteProperty(SAMPLE_PROP_KEY);
    Logger.log('Hàng đợi đã rỗng.');
    return;
  }

  var row = rows.shift();
  row[0] = new Date(row[0]); // JSON lam mat kieu Date, phuc hoi lai

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow(row);

  if (rows.length > 0) {
    props.setProperty(SAMPLE_PROP_KEY, JSON.stringify(rows));
  } else {
    props.deleteProperty(SAMPLE_PROP_KEY);
  }

  Logger.log('Đã ghi 1 dòng lúc ' + new Date().toLocaleString() + '. Còn lại ' + rows.length + ' dòng trong hàng đợi.');
}

/**
 * Huỷ toàn bộ trigger còn chờ chạy + xoá hàng đợi dữ liệu còn lại.
 * Dùng khi muốn dừng giữa chừng hoặc chạy lại installScheduledSeeding() từ đầu.
 */
function cancelScheduledSeeding() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === SAMPLE_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  PropertiesService.getScriptProperties().deleteProperty(SAMPLE_PROP_KEY);
  Logger.log('Đã huỷ ' + removed + ' trigger đang chờ và xoá hàng đợi dữ liệu.');
}
