const { Client, RichEmbed } = require('discord.js')
const axios = require('axios')
const cheerio = require('cheerio')

const bot = new Client()

const users = require('./models/users')

const PREFIX = '1!'
const GUILD_ID = '469080709403770883'

let selfChannels = []

const gameRoles = {
  'Counter-Strike Global Offensive': '469528267116773399',
  'League of Legends': '473787596632358914',
  'Overwatch': '469473209155059723',
  'Fortnite': '469473210585317386',
  'osu!': '469528265632120832',
  'DOTA 2': '469472500733050901',
  'Hearthstone': '473788126624481280',
  'Dead by Daylight': '473787892120944641',
  'Warframe': '473790116465344514',
  'PLAYERUNKNOWN\'S BATTLEGROUNDS': '469473441091813376',
  'Rainbow Six Siege': '469472498749014037',
}

const usersInVoice = []
const timeInVoice = []

setInterval(() => {
  if (!usersInVoice.length) return

  usersInVoice.forEach(user => {
    if (!timeInVoice[user]) timeInVoice[user] = 0

    timeInVoice[user] += 1
  })
}, 1000)

setInterval(() => {
  if (!usersInVoice.length) return

  usersInVoice.forEach(user => {
    if (timeInVoice[user] && timeInVoice[user] > 0) {
      users.findOrCreate({
        where: {
          id: user
        }
      })
        .spread(info => {
          if (!info) return

          const set = info.online + timeInVoice[user]

          timeInVoice[user] = 0

          users.update({ online: set },
            {
              where: {
                id: user
              }
            }
          ).then(() => {
            console.log(`Update user with id: ${user}`)
          })
        })
        .catch(console.error)
    }
  })
}, 31000)

const pad = n => (n < 10) ? '0' + n : n

const convertSecondsToTime = seconds => {
  let minutes = Math.floor(seconds / 60)
  seconds = seconds % 60

  let hours = Math.floor(minutes / 60)
  minutes = minutes % 60

  return {
    h: pad(hours),
    m: pad(minutes),
    s: pad(seconds)
  }
}

const getD2BuffInfo = id => axios.get(`https://ru.dotabuff.com/players/${id}`).then(response => {
  if (response.status === 200) {
    let html = response.data
    let $ = cheerio.load(html)

    return info = {
      URL: `https://ru.dotabuff.com/players/${id}`,
      avatar: $('.image-player').attr('src'),
      nickname: $('.header-content-title h1').text().replace(/Обзор/g, ''),
      rank: $('.rank-tier-wrapper .leaderboard-rank-value').text(),
      rankLogo: $('.rank-tier-base').attr('src'),
      lastgame: $('.header-content-secondary dl:first-child time').text(),
      rate: {
        single: parseInt($('.header-content-secondary dl:nth-child(2)').text()),
        group: parseInt($('.header-content-secondary dl:nth-child(3)').text())
      },
      matches: {
        wins: $('.game-record .wins').text(),
        losses: $('.game-record .losses').text(),
        abandons: $('.game-record .abandons').text(),
        winRate: $('.header-content-secondary dl:last-of-type dd').text()
      },
      lastResults: $('.performances-overview').find('.won, .lost').text().replace(/Поражение/g, '☠️').replace(/Победа/g, '🏆')
    }
  }
})

const colors = ['ff2828', 'ff3d28', 'ff4b28', 'ff5a28', 'ff6828', 'ff7628', 'ff8c28', 'ffa128', 'ffac28', 'ffb728', 'ffc228', 'ffd028', 'ffd728', 'ffe228', 'fff028', 'fffb28', 'edff28', 'deff28', 'd0ff28', 'c2ff28', 'b3ff28', '9aff28', '8cff28', '7dff28', '6fff28', '5aff28', '3dff28', '28ff2b', '28ff41', '28ff56', '28ff6c', '28ff81', '28ff93', '28ffa9', '28ffba', '28ffc9', '28ffde', '28fff4', '28ffff', '28f0ff', '28deff', '28deff', '28d3ff', '28c5ff', '28baff', '28b0ff', '28a5ff', '289eff', '2893ff', '2885ff', '2876ff', '2864ff', '2856ff', '284bff', '2841ff', '2836ff', '2828ff', '3228ff', '4428ff', '5328ff', '6828ff', '7628ff', '7e28ff', '8828ff', '9328ff', 'a128ff', 'b028ff', 'be28ff', 'c928ff', 'd328ff', 'db28ff', 'e528ff', 'f028ff', 'ff28ff', 'ff28f7', 'ff28e5', 'ff28de', 'ff28d0', 'ff28c9', 'ff28ba', 'ff28b3', 'ff28a5', 'ff289a', 'ff288c', 'ff2881', 'ff287a', 'ff2873', 'ff2868', 'ff2861', 'ff2856', 'ff284f', 'ff2848', 'ff2844', 'ff282b'];
const rainbow = () => {
  colors.forEach((color, num) => {
    setTimeout(() => {
      bot.guilds.get(GUILD_ID).roles.get('471056516796121088').setColor(color)
      if (num === colors.length - 1) setTimeout(rainbow, 600000)
    }, num * 600000)
  })
}

const getTimeNow = () => {
  const today = new Date(new Date().getTime() + 3 * 60 * 60 * 1000)

  const time = {
    h: today.getHours(),
    m: today.getMinutes()
  }

  const timeChannel = bot.channels.get('474228880027287567')
  timeChannel.setName(`Время сейчас: ${time.h}:${pad(time.m)} МСК`)

  setTimeout(getTimeNow, 60000)
}

bot.on('ready', rainbow)
bot.on('ready', getTimeNow)

bot.on('ready', () => {
  const guild = bot.guilds.get(GUILD_ID)

  guild.channels.filter(channel => channel.type === 'voice').forEach(channel => {
    channel.members.forEach(member => {
      if (!member.user.bot) usersInVoice.push(member.id)
    })
  })

  guild.members.filter(m => m.displayName.startsWith('!')).forEach(member => {
    const name = member.displayName

    member.setNickname(name.replace(/^!+/gi, ''))
  })
})

bot.on('presenceUpdate', (oldMember, newMember) => {
  const member = newMember
  const game = member.presence.game

  if (game && game.name in gameRoles) {
    if (!member.roles.has(gameRoles[game.name])) {
      member.addRole(gameRoles[game.name])
    }
  }
})

bot.on('guildMemberUpdate', (oldMember, newMember) => {
  const member = newMember
  const name = member.displayName

  if (name.startsWith('!')) {
    member.setNickname(name.replace(/^!+/gi, ''))
  }
})

bot.on('userUpdate', (oldUser, newUser) => {
  const member = bot.guilds.get(GUILD_ID).members.get(newUser.id)
  const name = member.displayName

  if (name.startsWith('!')) {
    member.setNickname(name.replace(/^!+/gi, ''))
  }
})

bot.on('channelUpdate', (oldChannel, newChannel) => {
  const limit = 10
  const channel = newChannel

  if (selfChannels.includes(channel.id)) {
    if (channel.userLimit === 0 || channel.userLimit > limit) channel.edit({ userLimit: limit }).catch(console.error)
  }
})

bot.on('voiceStateUpdate', (oldUser, newUser) => {
  if (oldUser.user.bot || newUser.user.bot) return

  const newChannel = newUser.voiceChannel
  const oldChannel = oldUser.voiceChannel

  if (!oldChannel && newChannel) {
    usersInVoice.push(newUser.id)
  }
  
  if (oldChannel && !newChannel) {
    if (usersInVoice.includes(oldUser.id)) {
      usersInVoice.splice(usersInVoice.indexOf(oldUser.id), 1)

      users.findOrCreate({
        where: {
          id: oldUser.id
        }
      })
        .spread(info => {
          const set = info.online + timeInVoice[oldUser.id]

          timeInVoice[oldUser.id] = 0

          users.update({ online: set },
            {
              where: {
                id: oldUser.id
              }
            }
          )
        })
        .catch(console.error)
      }
  }

  if (newChannel) {
    const channelId = newChannel.id

    if (channelId === '478835433397157898') {
      const guild = newUser.guild

      guild.createChannel(newUser.displayName, 'voice', [{
        id: newUser.id,
        allow: ['MANAGE_CHANNELS']
      }])
        .then(channel => {
          channel.edit({
            parent: '478833880875532299',
            userLimit: 2
          })

          newUser.setVoiceChannel(channel.id)
          selfChannels.push(channel.id)
        })
        .catch(console.error)
    }
  }

  if (oldChannel) {
    const channelId = oldChannel.id

    if (selfChannels.includes(channelId)) {
      if (oldChannel.members.size === 0) {
        const guild = oldUser.guild
        const channel = guild.channels.get(channelId)

        delete selfChannels[channelId]

        if (channel.deletable) channel.delete().catch(console.error)
      }
    }
  }
})

bot.on('message', message => {
  if (message.author.bot) return
  if (message.content.indexOf(PREFIX) !== 0) return

  const args = message.content.slice(PREFIX.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()

  if (command === 'online') {
    message.delete()

    const channel = message.channel
    const member = message.member

    const userId = member.id

    users.findOrCreate({
      where: {
        id: userId
      }
    })
      .spread(info => {
        const time = convertSecondsToTime(info.online)
        const notify = new RichEmbed()

        notify
          .setColor('#a80505')
          .setDescription(member)
          .setThumbnail(member.user.displayAvatarURL)
          .addField('Голосовой онлайн', `${time.h}:${time.m}:${time.s}`)

        return channel.send(notify).then(msg => msg.delete(15000))
      })
      .catch(console.error)
  }

  if (command === 'd2bf') {
    message.delete()

    const playerId = args[0]

    getD2BuffInfo(playerId).then(profile => {
      if (!profile) return

      const response = new RichEmbed()

      response.setColor('#009dd0')
        .setTitle(`#${playerId}`)
        .setAuthor(profile.nickname, 'https://ru.dotabuff.com/assets/favicon-a6c9d750400872d536f8d3376a67851d3d5ee5a9b3d1beda17c66ab92ad62cdb.png')
        .setURL(profile.URL)
        .setThumbnail(profile.rankLogo)
        .setImage(profile.avatar)
        .addField('Ранк', (profile.rank) ? profile.rank : 'Отсутствует')

      if (profile.rate.single) response.addField('Одиночный MMR', profile.rate.single)
      if (profile.rate.group) response.addField('Групповой MMR', profile.rate.group)

      response.addBlankField(true)

      if (profile.matches.winRate) response.addField('Доля побед', profile.matches.winRate)
      if (profile.matches.wins) response.addField('Выигранных матчей', profile.matches.wins)
      if (profile.matches.losses) response.addField('Проигранных матчей', profile.matches.losses)

      if (profile.lastResults) response.addField('Последние матчи', profile.lastResults)
      if (profile.lastgame) response.addField('Последняя игра была', profile.lastgame)

      return message.channel.send(response)
    })
  }

  if (command === 'embed' && message.author.id === '462996610146893824') {
    try {
      let text = args.join(' ').replace(/\n/g, '\\n')
      let embed = new RichEmbed()
      let footer = text.match(/{footer:(.*?)( \| icon: ?(.*?))?}/i)

      if (footer !== null) {
        embed.setFooter(footer[1], footer[3])
      }

      let image = text.match(/{image: ?(.*?)( \| hide)?}/i)
      if (image !== null) {
        if (image[2] !== null)
          embed.attachFile({
            attachment: image[1],
            file: image[1].substring(image[1].lastIndexOf('/') + 1)
          }).setImage('attachment://' + image[1].substring(image[1].lastIndexOf('/') + 1))
        else
          embed.setThumbnail(image[1])
      }

      let thumb = text.match(/{thumbnail: ?(.*?)( \| hide)?}/i)
      if (thumb !== null) {
        if (thumb[2] !== null)
          embed.attachFile({
            attachment: thumb[1],
            file: thumb[1].substring(thumb[1].lastIndexOf('/') + 1)
          }).setThumbnail('attachment://' + thumb[1].substring(thumb[1].lastIndexOf('/') + 1))
        else
          embed.setThumbnail(thumb[1])
      }

      let author = text.match(/{author:(.*?)( \| icon: ?(.*?))?( \| url: ?(.*?))?}/i)
      if (author !== null) {
        embed.setAuthor(author[1], author[3], author[5])
      }

      let title = text.match(/{title:(.*?)}/i)
      if (title !== null) {
        embed.setTitle(title[1])
      }

      let url = text.match(/{url: ?(.*?)}/i)
      if (url !== null) {
        embed.setURL(url[1])
      }

      let description = text.match(/{description:(.*?)}/i)
      if (description !== null) {
        embed.setDescription(description[1].replace(/\\n/g, '\n'))
      }

      let color = text.match(/{colou?r: ?(.*?)}/i)
      if (color !== null) {
        embed.setColor(color[1])
      }

      let timestamp = text.match(/{timestamp(: ?(.*?))?}/i)
      if (timestamp !== null) {
        if (timestamp[2] === undefined || timestamp[2] === null)
          embed.setTimestamp(new Date())
        else
          embed.setTimestamp(new Date(timestamp[2]))
      }

      let fields = text.match(/{field: ?(.*?) \| value: ?(.*?)( \| inline)?}/gi)
      if (fields !== null) {
        fields.forEach((field) => {
          if (field[1] == null || field[2] == null || typeof field[1] === 'undefined' || typeof field[2] === 'undefined') return
          let matches = field.match(/{field: ?(.*?) \| value: ?(.*?)( \| inline)?}/i)

          embed.addField(matches[1], matches[2], (matches[3] != null));
        })
      }

      message.channel.send({ embed })
      message.delete()
    } catch (e) {
      message.channel.send('Ошибка').then(msg => msg.delete(3000))
      console.error(e)
    }
  }
})

bot.login(process.env.TOKEN).catch(console.error)
