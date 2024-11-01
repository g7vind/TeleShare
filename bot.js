const Config = require('./models/config.model');
const TelegramBot = require('node-telegram-bot-api');
const Files = require('./models/file.model');
const Users = require('./models/user.model');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map(id => parseInt(id));


const timetable = {
    "Monday": [
        "9:00 AM - 9:55 AM: Web Programming",
        "9:55 AM - 10:50 AM: AI",
        "10:50 AM - 11:00 AM: Break",
        "11:00 AM - 11:55 AM: Disaster Management",
        "11:55 AM - 12:40 PM: Lunch Break",
        "12:40 PM - 1:35 PM: Web Programming",
        "1:35 PM - 2:30 PM: AI",
        "2:30 PM - 2:40 PM: Break",
        "2:40 PM - 3:35 PM: Honours",
        "3:35 PM - 4:30 PM: Industrial Safety Engineering"
    ],
    "Tuesday": [
        "9:00 AM - 11:55 AM: Compiler Lab",
        "11:55 AM - 12:40 PM: Lunch Break",
        "12:40 PM - 1:35 PM: Web Programming",
        "1:35 PM - 2:30 PM: Minor",
        "2:30 PM - 2:40 PM: Break",
        "2:40 PM - 3:35 PM: Disaster Management",
        "3:35 PM - 4:30 PM: AI"
    ],
    "Wednesday": [
        "9:00 AM - 11:55 AM: Seminar",
        "11:55 AM - 12:40 PM: Lunch Break",
        "12:40 PM - 1:35 PM: Web Programming",
        "1:35 PM - 2:30 PM: AI",
        "2:30 PM - 2:40 PM: Break",
        "2:40 PM - 3:35 PM: Honours",
        "3:35 PM - 4:30 PM: Industrial Safety Engineering"
    ],
    "Thursday": [
        "9:00 AM - 9:55 AM: AI",
        "9:55 AM - 10:50 AM: Industrial Safety Engineering",
        "10:50 AM - 11:00 AM: Break",
        "11:00 AM - 11:55 AM: Minor",
        "11:55 AM - 12:40 PM: Lunch Break",
        "12:40 PM - 1:35 PM: Disaster Management",
        "1:35 PM - 2:30 PM: Honours",
        "2:30 PM - 2:40 PM: Break",
        "2:40 PM - 3:35 PM: Industrial Safety Engineering",
        "3:35 PM - 4:30 PM: Minor"
    ],
    "Friday": [
        "9:00 AM - 4:30 PM: Project"
    ]
};

async function startBot() {
    // const config = await Config.findOne();
    // if (config.is_bot_active){
    //     console.log('Bot is already active');
    //     process.exit(0);
    // }
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log('Bot is starting');
    // await Config.updateOne({}, { is_bot_active: true }, { upsert: true });

    bot.onText(/\/start/, async (msg) => {
        const { id, first_name, last_name, username } = msg.from;

        if (!(await Users.findOne({ user_id: id }))) {
            const newUser = new Users({
                user_id:id,
                first_name,
                last_name,
                username,
                block:0
            });
            await newUser.save();
        }
        bot.sendMessage(id, `Welcome ${first_name}! Use /help to see available commands.`);
    });

    bot.onText(/\/help/, (msg) => {
        const helpText = "/start - Start the bot\n/help - Show help\n/works - View assignments\n/timetable - View timetable\n/addassignment - Add assignment (Admin only)";
        bot.sendMessage(msg.chat.id, helpText);
    });

    bot.onText(/\/works/, async (msg) => {
        const user = await Users.findOne({ userId: msg.from.id });
        
        if (user && user.block === 1) {
            return bot.sendMessage(msg.chat.id, "Your account is blocked. Contact admin.");
        }
        ADMIN_IDS.forEach(id => {
            bot.sendMessage(id, `User with username: ${msg.from.username} and name: ${msg.from.first_name} ${msg.from.last_name} requested for assignments.`);
        });
        const assignments = await Files.find().sort({ timestamp: -1 }) // Show the latest 5 assignments
        if (!assignments.length) {
            bot.sendMessage(msg.chat.id, "No assignments available.");
        } else {
            const buttons = assignments.map(assignment => ([{
                text: assignment.title,
                callback_data: assignment._id
            }]));
            bot.sendMessage(msg.chat.id, "Select a file to download:", { reply_markup: { inline_keyboard: buttons } });
        }
    });
    bot.on("callback_query", async (callbackQuery) => {
        const { message, data: assignmentId } = callbackQuery;
        const userId = message.chat.id;
        try {
            const assignment = await Files.findById(assignmentId);
            const user = await Users.findOne({ userId });
            if (user && user.block === 1) {
                return bot.sendMessage(userId, "Your account is blocked. Contact admin.");
            }
            
            if (assignment) {
                ADMIN_IDS.forEach(id => {
                    bot.sendMessage(id, `User with username: ${message.chat.username} and name: ${message.chat.first_name} ${message.chat.last_name} downloaded the assignment: ${assignment.title}`);
                });
                bot.sendDocument(userId, assignment.file_url);
            } else {
                bot.sendMessage(userId, "Files not found.");
            }
        } catch (error) {
            console.error("Error handling callback query:", error);
            return bot.sendMessage(userId, "An error occurred. Please try again.");
        }
    });

    bot.onText(/\/timetable ?(.*)/, async (msg, match) => {
        const day = match[1]
            ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() 
            : new Date().toLocaleDateString("en", { weekday: "long" });
        const schedule = timetable[day];
        
        if (schedule) {
            const formattedSchedule = schedule.join("\n");
            bot.sendMessage(msg.chat.id, `${day}'s Timetable:\n${formattedSchedule}`);
        } else {
            bot.sendMessage(msg.chat.id, `No schedule available for ${day}.`);
        }
    });
    
    bot.onText(/\/addassignment/, async (msg) => {
        if (!ADMIN_IDS.includes(msg.from.id)) {
            return bot.sendMessage(msg.chat.id, "You are not authorized to add assignments.");
        }
        bot.sendMessage(msg.chat.id, "Please enter the title of the assignment:");
        bot.once("message", (titleMsg) => {
            const title = titleMsg.text;
            bot.sendMessage(titleMsg.chat.id, "Now, please upload the document for the assignment:");
            bot.once("document", async (docMsg) => {
                try {
                    const newFile = new Files({
                        title,
                        file_url: docMsg.document.file_id,
                        uploaded_by: docMsg.from.id,
                    });
                    await newFile.save();
                    bot.sendMessage(docMsg.chat.id, `File '${title}' added successfully.`);
                    const users=Users.find()
                    users.forEach(user => {
                        bot.sendMessage(user.chatId, `New assignment uploaded: ${title}`);
                    });
                } catch (error) {
                    console.error("Error adding assignment:", error);
                    bot.sendMessage(docMsg.chat.id, "Failed to add assignment.");
                }
            });
        });
    });    
    // process.on("exit", async () => {
    //     await Config.updateOne({}, { is_bot_active: false });
    //     console.log("Bot is stopping");
    // });
}

module.exports = {
    start: startBot
};