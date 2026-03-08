require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

console.log("بدء تشغيل البوت...");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) {
  console.error("خطأ: DISCORD_TOKEN غير موجود داخل ملف .env");
  process.exit(1);
}

if (!CHANNEL_ID) {
  console.error("خطأ: CHANNEL_ID غير موجود داخل ملف .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const adhkarFilePath = path.join(__dirname, "adhkar.json");

let adhkar = [];
try {
  const fileContent = fs.readFileSync(adhkarFilePath, "utf8");
  adhkar = JSON.parse(fileContent);

  if (!Array.isArray(adhkar) || adhkar.length === 0) {
    console.error("خطأ: ملف adhkar.json فارغ أو غير صحيح.");
    process.exit(1);
  }
} catch (error) {
  console.error("خطأ أثناء قراءة adhkar.json:", error.message);
  process.exit(1);
}

let lastIndex = -1;
let intervalId = null;

function getRandomDhikr() {
  if (adhkar.length === 1) return adhkar[0];

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * adhkar.length);
  } while (randomIndex === lastIndex);

  lastIndex = randomIndex;
  return adhkar[randomIndex];
}

async function getTargetChannel() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel) {
    throw new Error("لم يتم العثور على القناة. تأكد من CHANNEL_ID.");
  }

  if (!channel.isTextBased()) {
    throw new Error("القناة المحددة ليست قناة نصية.");
  }

  return channel;
}

async function sendDhikr(channel = null) {
  try {
    const targetChannel = channel || (await getTargetChannel());
    const dhikr = getRandomDhikr();

    await targetChannel.send(`📿 **ذكر:**\n${dhikr}`);
    console.log("تم إرسال ذكر بنجاح.");
  } catch (error) {
    console.error("خطأ أثناء إرسال الذكر:", error.message);
  }
}

function startHourlyDhikr() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(async () => {
    await sendDhikr();
  }, 60 * 60 * 1000);

  console.log("تم تشغيل الإرسال كل ساعة.");
}

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  await sendDhikr();
  startHourlyDhikr();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  if (content === "!ذكر") {
    await sendDhikr(message.channel);
  }
});

client.login(TOKEN).catch((error) => {
  console.error("فشل تسجيل الدخول:", error.message);
});