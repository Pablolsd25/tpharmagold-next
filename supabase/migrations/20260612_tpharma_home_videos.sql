-- Reemplaza videos de Casa Empire por el video gym oficial de tpharmagold.com
UPDATE site_settings
SET value = 'https://video.wixstatic.com/video/98134b_6dd464ad60084e9aae7151a182b7f2fc/480p/mp4/file.mp4',
    updated_at = now()
WHERE key IN ('home_video_480', 'home_video_1080');

DELETE FROM site_settings WHERE key = 'home_showcase_video';
