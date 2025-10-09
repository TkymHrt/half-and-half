-- エリア情報を挿入
INSERT INTO public.areas (id, name, description) VALUES 
('campus-main', '配置図', '大学祭の配置図面');

-- フロア情報を挿入
INSERT INTO public.floors (id, area_id, name, image_path, width_px, height_px, order_index) VALUES 
('campus-main-01', 'campus-main', 'メイン図面 (1/4)', '/maps/R5_校内見取り図_pages-to-jpg-0001.jpg', 4961, 3508, 1),
('campus-main-02', 'campus-main', 'メイン図面 (2/4)', '/maps/R5_校内見取り図_pages-to-jpg-0002.jpg', 4961, 3508, 2),
('campus-main-03', 'campus-main', 'メイン図面 (3/4)', '/maps/R5_校内見取り図_pages-to-jpg-0003.jpg', 4961, 3508, 3),
('campus-main-04', 'campus-main', 'メイン図面 (4/4)', '/maps/R5_校内見取り図_pages-to-jpg-0004.jpg', 4961, 3508, 4);

-- ロケーション情報を挿入
INSERT INTO public.locations (id, floor_id, label, kind, coord_x, coord_y) VALUES 
('loc-1', 'campus-main-01', '体育館', 'destination', 0.3, 0.4),
('loc-2', 'campus-main-01', '倉庫', 'storage', 0.7, 0.6),
('loc-3', 'campus-main-02', '学生会館', 'destination', 0.5, 0.3),
('loc-4', 'campus-main-03', '第1会議室', 'destination', 0.2, 0.7),
('loc-5', 'campus-main-04', '第2倉庫', 'storage', 0.8, 0.2);