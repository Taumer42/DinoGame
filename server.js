const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Подключение к базе данных SQLite
const db = new sqlite3.Database('./game.db');
db.run(`CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER PRIMARY KEY,
    hp INTEGER,
    coins INTEGER,
    jumpLevel INTEGER,
    radiusLevel INTEGER,
    hpLevel INTEGER
)`);

// Маршрут для сохранения прогресса
app.post('/saveProgress', (req, res) => {
    const { user_id, hp, coins, jumpLevel, radiusLevel, hpLevel } = req.body;
    db.run(
        `INSERT OR REPLACE INTO progress (user_id, hp, coins, jumpLevel, radiusLevel, hpLevel) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, hp, coins, jumpLevel, radiusLevel, hpLevel],
        (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка сохранения данных' });
            res.json({ message: 'Прогресс сохранен!' });
        }
    );
});

// Маршрут для загрузки прогресса
app.get('/loadProgress', (req, res) => {
    const user_id = req.query.user_id;
    db.get(`SELECT * FROM progress WHERE user_id = ?`, [user_id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Ошибка загрузки данных' });
        res.json(row || { hp: 3, coins: 0, jumpLevel: 1, radiusLevel: 1, hpLevel: 1 });
    });
});

app.listen(port, () => console.log(`Сервер запущен на порту ${port}`));
