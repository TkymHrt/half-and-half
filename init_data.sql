-- ベーシックなエリアとフロアデータを追加
-- エリアの追加
INSERT INTO areas (id, name, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '1号館', '1号館エリア'),
  ('550e8400-e29b-41d4-a716-446655440001', '2号館', '2号館エリア'),
  ('550e8400-e29b-41d4-a716-446655440002', '体育館', '体育館エリア')
ON CONFLICT (id) DO NOTHING;

-- フロアの追加
INSERT INTO floors (id, area_id, name, image_path, width_px, height_px, order_index) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '1階', '/maps/R5_校内見取り図_pages-to-jpg-0001.jpg', 1200, 800, 1),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '2階', '/maps/R5_校内見取り図_pages-to-jpg-0002.jpg', 1200, 800, 2),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '1階', '/maps/R5_校内見取り図_pages-to-jpg-0003.jpg', 1200, 800, 1),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '1階', '/maps/R5_校内見取り図_pages-to-jpg-0004.jpg', 1200, 800, 1)
ON CONFLICT (area_id, name) DO NOTHING;

-- 基本的なロケーションも追加
INSERT INTO locations (floor_id, label, kind, coord_x, coord_y) VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '入口', 'general', 0.1, 0.1),
  ('660e8400-e29b-41d4-a716-446655440000', '倉庫', 'storage', 0.8, 0.8),
  ('660e8400-e29b-41d4-a716-446655440001', '会議室', 'destination', 0.5, 0.5)
ON CONFLICT (floor_id, label) DO NOTHING;