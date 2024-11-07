const { Telegraf } = require('telegraf');
const bot = new Telegraf('7868909413:AAGYqI4X7TeWyywfUSpMaPCwPWhRFIs93CE'); // Замените на ваш токен бота

bot.command('start', (ctx) => {
    ctx.reply('Привет! Нажмите кнопку ниже, чтобы запустить игру про динозаврика!', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Запустить игру', web_app: { url: 'https://672d4f5d826e457ee8aedec3--testrunraidbot.netlify.app/' } }]
            ]
        }
    });
});

// Обработка полученных данных из WebApp
bot.on('web_app_data', (ctx) => {
    const score = JSON.parse(ctx.web_app_data.data).score;
    ctx.reply(`Игра завершена! Ваш результат: ${score} очков.`);
});

bot.launch();
