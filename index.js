const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");

const client = new Discord.Client();
 
client.login(process.env.TOKEN);

const getD2BuffInfo = id => axios.get(`https://ru.dotabuff.com/players/${id}`).then(response => {
  if (response.status === 200) {
    let html = response.data
    let $ = cheerio.load(html)

    return info = {
      URL: `https://ru.dotabuff.com/players/${id}`,
      avatar: $('.image-player').attr('src'),
      nickname: $('.header-content-title h1').text().replace(/Обзор/g, ''),
      rank: $(".rank-tier-wrapper .leaderboard-rank-value").text(),
      rankLogo: $('.rank-tier-base').attr('src'),
      lastgame: $('.header-content-secondary dl:first-child time').text(),
      rate: {
        single: parseInt($(".header-content-secondary dl:nth-child(2)").text()),
        group: parseInt($(".header-content-secondary dl:nth-child(3)").text())
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
}).catch(console.error)
 
const colors = ["ff2828","ff3d28","ff4b28","ff5a28","ff6828","ff7628","ff8c28","ffa128","ffac28","ffb728","ffc228","ffd028","ffd728","ffe228","fff028","fffb28","edff28","deff28","d0ff28","c2ff28","b3ff28","9aff28","8cff28","7dff28","6fff28","5aff28","3dff28","28ff2b","28ff41","28ff56","28ff6c","28ff81","28ff93","28ffa9","28ffba","28ffc9","28ffde","28fff4","28ffff","28f0ff","28deff","28deff","28d3ff","28c5ff","28baff","28b0ff","28a5ff","289eff","2893ff","2885ff","2876ff","2864ff","2856ff","284bff","2841ff","2836ff","2828ff","3228ff","4428ff","5328ff","6828ff","7628ff","7e28ff","8828ff","9328ff","a128ff","b028ff","be28ff","c928ff","d328ff","db28ff","e528ff","f028ff","ff28ff","ff28f7","ff28e5","ff28de","ff28d0","ff28c9","ff28ba","ff28b3","ff28a5","ff289a","ff288c","ff2881","ff287a","ff2873","ff2868","ff2861","ff2856","ff284f","ff2848","ff2844","ff282b"];
function color () {
    colors.forEach(function (item, number)
   {
    setTimeout(function () {client.guilds.get('469080709403770883').roles.get('471056516796121088').setColor(item).catch();
    if(number === colors.length-1)
    setTimeout(function () {color()}, 600000)}, number*600000);
   }
 );
};
 
client.on('ready', color);
function startTime() {
    var today = new Date(new Date().getTime() + 3*60*60*1000);
    var h = today.getHours();
    var m = today.getMinutes();
    m = checkTime(m);
    client.channels.get('474228880027287567').setName('Время сейчас: '+h+':'+m+' МСК');
    setTimeout(startTime, 60000)
}
function checkTime(i) {
    if (i < 10) {i = "0" + i};
    return i;
}
client.on('ready', startTime);
let arr = {
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
};
 
client.on('presenceUpdate', (old, new_) => {
    if (new_.presence.game && new_.presence.game.name && new_.presence.game.name in arr) {
        if (!new_.roles.has(arr[new_.presence.game.name])) {
            new_.addRole(arr[new_.presence.game.name])
        }
    }
});
 
client.on("ready", () => {
function clear_nicks(){
    client.guilds.get('469080709403770883').members.filter(memb => memb.displayName.startsWith('!')).forEach(member => member.setNickname(member.displayName.replace(/^!+/gi, '')).catch())
}
clear_nicks();
setInterval(clear_nicks, 300000);});
 
client.on("guildMemberUpdate", (old_memb, new_memb) => {
    if (new_memb.displayName.startsWith('!')) new_memb.setNickname(new_memb.displayName.replace(/^!+/gi, '')).catch();
});
 
client.on("userUpdate", (old_user, new_user) => {
    if (client.guilds.get('469080709403770883').members.get(new_user.id).displayName.startsWith('!')) client.guilds.get('469080709403770883').members.get(new_user.id).setNickname(client.guilds.get('469080709403770883').members.get(new_user.id).displayName.replace(/^!+/gi, '')).catch();
});
 async function multipleReact(message, arr) {
    if (arr !== []) {
        await message.react(client.emojis.get(arr.shift())).catch().then(function () {multipleReact(message,arr).catch();});
    }
}
let prefix = '1!';
client.on("message", async message => {
    if(message.author.bot) return;
    if(message.content.indexOf(prefix) !== 0) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'd2bf') {
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
              .addField('Ранк', profile.rank)
              .addField('Одиночный MMR', profile.rate.single)
              .addField('Групповой MMR', profile.rate.group)
              .addBlankField(true)
              .addField('Доля побед', profile.matches.winRate)
              .addField('Выигранных матчей', profile.matches.wins)
              .addField('Проигранных матчей', profile.matches.losses)
              .addField('Последние матчи', profile.lastResults)
              .addField('Последняя игра была', profile.lastgame)
              
            return message.channel.send(response)
        })
    }
 
    if (command === 'embed' && message.author.id === '462996610146893824') {
        try {
            let text = args.join(" ").replace(/\n/g, "\\n");
            let embed = new Discord.RichEmbed();
            let footer = text.match(/{footer:(.*?)( \| icon: ?(.*?))?}/i);
            if (footer !== null) {
                embed.setFooter(footer[1], footer[3])
            }
            let image = text.match(/{image: ?(.*?)( \| hide)?}/i);
            if (image !== null) {
                if (image[2] !== null)
                embed.attachFile({
                    attachment: image[1],
                    file: image[1].substring(image[1].lastIndexOf('/') + 1)
                }).setImage('attachment://'+image[1].substring(image[1].lastIndexOf('/') + 1));
                else
                    embed.setThumbnail(image[1]);
            }
            let thumb = text.match(/{thumbnail: ?(.*?)( \| hide)?}/i);
            if (thumb !== null) {
                if (thumb[2] !== null)
                embed.attachFile({
                    attachment: thumb[1],
                    file: thumb[1].substring(thumb[1].lastIndexOf('/') + 1)
                }).setThumbnail('attachment://'+thumb[1].substring(thumb[1].lastIndexOf('/') + 1));
                else
                    embed.setThumbnail(thumb[1]);
            }
            let author = text.match(/{author:(.*?)( \| icon: ?(.*?))?( \| url: ?(.*?))?}/i);
            if (author !== null) {
                embed.setAuthor(author[1], author[3], author[5])
            }
            let title = text.match(/{title:(.*?)}/i);
            if (title !== null) {
                embed.setTitle(title[1])
            }
            let url = text.match(/{url: ?(.*?)}/i);
            if (url !== null) {
                embed.setURL(url[1])
            }
            let description = text.match(/{description:(.*?)}/i);
            if (description !== null) {
                embed.setDescription(description[1].replace(/\\n/g, '\n'))
            }
            let color = text.match(/{colou?r: ?(.*?)}/i);
            if (color !== null) {
                embed.setColor(color[1])
            }
            let timestamp = text.match(/{timestamp(: ?(.*?))?}/i);
            if (timestamp !== null) {
                if (timestamp[2] === undefined || timestamp[2] === null)
                    embed.setTimestamp(new Date());
                else
                    embed.setTimestamp(new Date(timestamp[2]));
            }
            let fields = text.match(/{field: ?(.*?) \| value: ?(.*?)( \| inline)?}/gi);
            if (fields !== null) {
                fields.forEach((item) => {
                    if (item[1] == null || item[2] == null || typeof item[1] === "undefined" || typeof item[2] === "undefined") return;
                    let matches = item.match(/{field: ?(.*?) \| value: ?(.*?)( \| inline)?}/i);
                    embed.addField(matches[1], matches[2], (matches[3] != null));
                });}
            message.channel.send({embed});
            message.delete();
        } catch(e) {
            message.channel.send('Ошибка').then(msg => msg.delete(3000));
            console.error(e);
        }
    }
});
    
