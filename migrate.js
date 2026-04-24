import Database from 'better-sqlite3';
const db = new Database('./data/database.sqlite');

try {
    db.prepare("ALTER TABLE post_history ADD COLUMN platform TEXT DEFAULT 'threads'").run();
    console.log('Column platform successfully added to post_history');
} catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log('Column platform already exists.');
    } else {
        console.error('Migration error:', e.message);
    }
}

try {
    // Also ensure x_app_key exists in settings if not already there
    const check = db.prepare("SELECT * FROM settings WHERE key = 'x_app_key'").get();
    if (!check) {
        db.prepare("INSERT INTO settings (key, value) VALUES ('x_app_key', '')").run();
        db.prepare("INSERT INTO settings (key, value) VALUES ('x_app_secret', '')").run();
        db.prepare("INSERT INTO settings (key, value) VALUES ('x_access_token', '')").run();
        db.prepare("INSERT INTO settings (key, value) VALUES ('x_access_secret', '')").run();
        console.log('X settings seeded.');
    }
} catch (e) {
    console.error('Settings seeding error:', e.message);
}
