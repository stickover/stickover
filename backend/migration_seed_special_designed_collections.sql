-- Seeds the "Special Collections" and "Designed Cases" collections requested by the
-- store owner. Both groups are marked is_highlighted=1 so they show with a highlight
-- border on the Home page "Shop By Category" grid. Run migration_material_and_highlight.sql
-- first if you haven't already.

INSERT INTO collections (id, name, slug, description, is_visible, is_highlighted, display_order) VALUES
(UUID(), 'Customized Photo Acrylic Strong Glass Cases', 'customized-photo-acrylic-strong-glass-cases', 'Upload your own photo on a strong acrylic glass case.', 1, 1, 100),
(UUID(), 'Customized Photo Gold Glass Cases', 'customized-photo-gold-glass-cases', 'Upload your own photo on a premium gold-finish glass case.', 1, 1, 101),
(UUID(), 'Customized Photo Hard Plastic Cases', 'customized-photo-hard-plastic-cases', 'Upload your own photo on a durable hard plastic case.', 1, 1, 102),
(UUID(), 'Customized Photo Premium Glass Cases', 'customized-photo-premium-glass-cases', 'Upload your own photo on a premium glass case.', 1, 1, 103),
(UUID(), 'Murugan Acrylic Strong Glass Cases', 'murugan-acrylic-strong-glass-cases', 'Lord Murugan designed acrylic strong glass cases.', 1, 1, 104),
(UUID(), 'TVK Acrylic Strong Glass Cases', 'tvk-acrylic-strong-glass-cases', 'TVK designed acrylic strong glass cases.', 1, 1, 105),
(UUID(), 'Shivan Acrylic Strong Glass Cases', 'shivan-acrylic-strong-glass-cases', 'Lord Shivan designed acrylic strong glass cases.', 1, 1, 106),
(UUID(), 'Lord Venkateswara Acrylic Strong Glass Cases', 'lord-venkateswara-acrylic-strong-glass-cases', 'Lord Venkateswara designed acrylic strong glass cases.', 1, 1, 107),
(UUID(), 'Ayyappan Acrylic Strong Glass Cases', 'ayyappan-acrylic-strong-glass-cases', 'Lord Ayyappan designed acrylic strong glass cases.', 1, 1, 108),
(UUID(), 'Virat Kohli Acrylic Strong Glass Cases', 'virat-kohli-acrylic-strong-glass-cases', 'Virat Kohli designed acrylic strong glass cases.', 1, 1, 109),
(UUID(), 'TVK Gold Glass Cases', 'tvk-gold-glass-cases', 'TVK designed gold-finish glass cases.', 1, 1, 110),
(UUID(), 'Murugan Gold Glass Cases', 'murugan-gold-glass-cases', 'Lord Murugan designed gold-finish glass cases.', 1, 1, 111);
