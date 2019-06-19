const mongoose = require('mongoose')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const config = require('./config')
const { addOrUpdateUser } = require('./utils/user-actions')


mongoose.connect(config.mongoConnectUri, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  reconnectTries: Number.MAX_VALUE,
})
const db = mongoose.connection

// Check for db errors
db.on('error', (err) => {
  console.error(err)
})


// Create constant login keyboard
const keyboard = Markup.inlineKeyboard([
  Markup.loginButton('Login btn', `${config.domain}/api/login`),
])
const kb = Extra.markup(keyboard)

const bot = new Telegraf(config.token)

// Setup middleware to update user's info on each interacion
bot.use(({ message }, next) => {
  addOrUpdateUser(message.from)
  return next()
})

bot.start(({ reply }) => reply('Hello...', kb))
bot.help(({ reply }) => reply('Help message...', kb))
bot.on('message', ctx => ctx.telegram.sendCopy(ctx.from.id, ctx.message, kb))


// Check connection
db.once('open', () => {
  console.log('Connected to MongoDB')
  // Start server only after DB connect
  // bot.launch().then(() => console.log('Started bot'))
  bot.launch({
    webhook: {
      port: config.port,
      domain: config.domain,
      hookPath: config.hookPath,
    },
  }).then(() => console.log('Started bot with webhook'))
})