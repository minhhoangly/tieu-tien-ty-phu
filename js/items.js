/*
 * The shopping catalogue. Edit freely: the app sorts by price on load.
 *
 *   id     unique slug (also the key used for saved progress)
 *   name   Vietnamese display name
 *   price  whole VND, rough market estimate (not a quote)
 *   emoji  artwork shown on the tile
 *   hue    0-360, tints the tile background
 *   limit  optional maximum quantity you can buy
 *   image  optional URL; when set it replaces the emoji with your own picture
 *
 * Prices are indicative figures for the Vietnamese market and will drift;
 * check them before publishing.
 */
window.ITEMS = [
  { id: 'banh-mi', name: 'Ổ bánh mì thịt', price: 25000, emoji: '🥖', hue: 40 },
  { id: 'ca-phe', name: 'Ly cà phê sữa đá', price: 30000, emoji: '☕', hue: 25 },
  { id: 'pho-bo', name: 'Tô phở bò', price: 50000, emoji: '🍜', hue: 15 },
  { id: 'tra-sua', name: 'Ly trà sữa trân châu', price: 55000, emoji: '🧋', hue: 30 },
  { id: 've-phim', name: 'Vé xem phim', price: 100000, emoji: '🎟️', hue: 350 },
  { id: 'sach', name: 'Cuốn sách hay', price: 120000, emoji: '📚', hue: 210 },
  { id: 'lau', name: 'Nồi lẩu cho cả nhóm', price: 800000, emoji: '🍲', hue: 5 },
  { id: 'giay', name: 'Đôi giày thể thao', price: 2500000, emoji: '👟', hue: 190 },
  { id: 'phim-online', name: 'Một năm xem phim trực tuyến', price: 3000000, emoji: '📺', hue: 270 },
  { id: 'tai-nghe', name: 'Tai nghe không dây', price: 3500000, emoji: '🎧', hue: 230 },
  { id: 'xe-dap', name: 'Chiếc xe đạp', price: 5000000, emoji: '🚲', hue: 150 },
  { id: 'ban-tiec', name: 'Bàn tiệc cưới', price: 8000000, emoji: '🍽️', hue: 335 },
  { id: 'cho-con', name: 'Chú chó con', price: 8000000, emoji: '🐶', hue: 45 },
  { id: 'dien-thoai', name: 'Điện thoại thông minh', price: 18000000, emoji: '📱', hue: 205 },
  { id: 'laptop', name: 'Máy tính xách tay', price: 25000000, emoji: '💻', hue: 215 },
  { id: 'trau', name: 'Con trâu', price: 35000000, emoji: '🐃', hue: 100 },
  { id: 'xe-ga', name: 'Xe máy tay ga phổ thông', price: 35000000, emoji: '🛵', hue: 165 },
  { id: 'du-lich', name: 'Chuyến du lịch châu Âu', price: 80000000, emoji: '✈️', hue: 195 },
  { id: 'xe-ga-cao-cap', name: 'Xe máy tay ga cao cấp', price: 90000000, emoji: '🏍️', hue: 0 },
  { id: 'vang', name: 'Một lượng vàng', price: 130000000, emoji: '🪙', hue: 48 },
  { id: 'vuon-ca-phe', name: 'Một hecta vườn cà phê', price: 600000000, emoji: '🌱', hue: 120 },
  { id: 'oto-dien', name: 'Ô tô điện cỡ nhỏ', price: 600000000, emoji: '🚗', hue: 175 },
  { id: 'nha-cap-4', name: 'Nhà cấp 4 ở quê', price: 800000000, emoji: '🏘️', hue: 85 },
  { id: 'sedan', name: 'Xe sedan cỡ lớn', price: 1300000000, emoji: '🚙', hue: 220 },
  { id: 'can-ho', name: 'Căn hộ chung cư 2 phòng ngủ', price: 4500000000, emoji: '🏢', hue: 200 },
  { id: 'nha-pho', name: 'Nhà phố trung tâm', price: 15000000000, emoji: '🏠', hue: 20 },
  { id: 'phim-dien-anh', name: 'Làm một bộ phim điện ảnh', price: 30000000000, emoji: '🎬', hue: 290 },
  { id: 'biet-thu', name: 'Biệt thự có hồ bơi', price: 50000000000, emoji: '🏡', hue: 160 },
  { id: 'du-thuyen', name: 'Du thuyền', price: 125000000000, emoji: '🛥️', hue: 200 },
  { id: 'tranh-co', name: 'Bức tranh cổ đấu giá', price: 250000000000, emoji: '🖼️', hue: 30, limit: 1 },
  { id: 'cao-toc', name: '1 km đường cao tốc', price: 400000000000, emoji: '🛣️', hue: 220 },
  { id: 'may-bay', name: 'Máy bay riêng', price: 1250000000000, emoji: '🛩️', hue: 210 },
  { id: 'san-van-dong', name: 'Xây một sân vận động', price: 2000000000000, emoji: '🏟️', hue: 130, limit: 10 },
  { id: 'toa-thap', name: 'Tòa tháp văn phòng', price: 5000000000000, emoji: '🏙️', hue: 235, limit: 5 },
  // Big-ticket items so the largest budgets have something to chew on.
  { id: 'du-hanh-vu-tru', name: 'Chuyến du hành vào vũ trụ', price: 1400000000000, emoji: '🚀', hue: 250 },
  { id: 'nha-may-oto', name: 'Nhà máy sản xuất ô tô', price: 52000000000000, emoji: '🏭', hue: 215, limit: 5 },
  { id: 'clb-bong-da', name: 'CLB bóng đá Ngoại hạng Anh', price: 78000000000000, emoji: '⚽', hue: 140, limit: 1 },
  { id: 'san-bay', name: 'Xây một sân bay quốc tế', price: 416000000000000, emoji: '🛫', hue: 200, limit: 1 }
];
